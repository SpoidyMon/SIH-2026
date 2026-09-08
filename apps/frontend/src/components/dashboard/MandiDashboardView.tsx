import React, { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  updateBookingStatusThunk,
  verifyGateTokenThunk,
  completeBookingThunk,
  applyDefaultPresetsThunk,
  fetchDashboardStatsThunk,
  fetchCurrentBookingsThunk,
  fetchPreviousBookingsThunk,
  fetchSlotsThunk,
} from "../../store/slices/mandiSlice";
import { Booking } from "../../interfaces";
import { MandiOperationalPipeline } from "./MandiOperationalPipeline";
import { ConsignmentBookingsTable } from "./ConsignmentBookingsTable";
import { VerifyTokenModal } from "./modals/VerifyTokenModal";
import { BookingDetailsModal } from "./modals/BookingDetailsModal";
import { WeighbridgeSettlementModal } from "./modals/WeighbridgeSettlementModal";
import { SettlementSlipModal } from "./modals/SettlementSlipModal";

export function MandiDashboardView() {
  const dispatch = useAppDispatch();
  const { stats, currentBookings, previousBookings, slots, profile, isActionLoading } = useAppSelector(
    (state) => state.mandi
  );

  useEffect(() => {
    dispatch(fetchDashboardStatsThunk());
    dispatch(fetchCurrentBookingsThunk());
    dispatch(fetchPreviousBookingsThunk());
    dispatch(fetchSlotsThunk());
  }, [dispatch]);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetBookingForVerify, setTargetBookingForVerify] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForWeighbridge, setSelectedBookingForWeighbridge] = useState<Booking | null>(null);
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);

  // Stable action handlers
  const handleAccept = useCallback((bookingId: string) => {
    dispatch(updateBookingStatusThunk({ id: bookingId, status: "ACCEPTED" }));
  }, [dispatch]);

  const handleReject = useCallback((bookingId: string, reason?: string) => {
    const finalReason = reason !== undefined
      ? reason
      : prompt("Enter rejection reason (e.g. Yard intake capacity reached for this grade):");
    if (finalReason !== null) {
      dispatch(updateBookingStatusThunk({ id: bookingId, status: "REJECTED", rejectionReason: finalReason || undefined }));
    }
  }, [dispatch]);

  const handleVerifyEntry = useCallback((token: string) => {
    dispatch(verifyGateTokenThunk(token));
  }, [dispatch]);

  const [isWeighbridgePreVerified, setIsWeighbridgePreVerified] = useState(false);

  const handleOpenWeighbridge = useCallback((booking: Booking, isPreVerified: boolean = false) => {
    setSelectedBookingForWeighbridge(booking);
    setIsWeighbridgePreVerified(isPreVerified);
  }, []);

  const handleCompleteSettlement = useCallback((
    bookingId: string,
    actualWeightQuintals: number,
    finalPayoutAmount: number
  ) => {
    dispatch(
      completeBookingThunk({
        id: bookingId,
        payload: {
          actualWeightQuintals,
          finalPayoutAmount,
        },
      })
    );
  }, [dispatch]);

  const handleDefaultSlots = useCallback(() => {
    dispatch(applyDefaultPresetsThunk());
  }, [dispatch]);

  const handleOpenVerifyModal = useCallback((booking?: Booking | null) => {
    setTargetBookingForVerify(booking || null);
    setShowVerifyModal(true);
  }, []);

  return (
    <div className="space-y-4 w-full max-w-[1700px] mx-auto font-sans px-1 sm:px-2">
      {/* Top Section: Memoized MandiOperationalPipeline with live metrics */}
      <MandiOperationalPipeline
        stats={stats}
        currentBookings={currentBookings}
        previousBookings={previousBookings}
        slots={slots}
        profile={profile}
      />

      {/* Main Table: Segmented Tabs (Current Bookings vs Previous Logs) and dynamic manifest */}
      <ConsignmentBookingsTable
        currentBookings={currentBookings}
        previousBookings={previousBookings}
        isActionLoading={isActionLoading}
        onAccept={handleAccept}
        onReject={handleReject}
        onVerifyEntry={handleVerifyEntry}
        onOpenWeighbridge={handleOpenWeighbridge}
        onViewSlip={setSelectedBookingForSlip}
        onViewDetails={setSelectedBookingForDetails}
        onOpenVerifyModal={handleOpenVerifyModal}
        onDefaultSlots={handleDefaultSlots}
      />

      {/* Modals */}
      <VerifyTokenModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setTargetBookingForVerify(null);
        }}
        onVerify={handleVerifyEntry}
        targetBooking={targetBookingForVerify}
      />

      <BookingDetailsModal
        booking={selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <WeighbridgeSettlementModal
        booking={selectedBookingForWeighbridge}
        onClose={() => {
          setSelectedBookingForWeighbridge(null);
          setIsWeighbridgePreVerified(false);
        }}
        onComplete={handleCompleteSettlement}
        isPreVerified={isWeighbridgePreVerified}
      />

      <SettlementSlipModal
        booking={selectedBookingForSlip}
        onClose={() => setSelectedBookingForSlip(null)}
      />
    </div>
  );
}
