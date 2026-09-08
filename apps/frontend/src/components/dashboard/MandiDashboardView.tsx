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
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForWeighbridge, setSelectedBookingForWeighbridge] = useState<Booking | null>(null);
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);

  // Stable action handlers
  const handleAccept = useCallback((bookingId: string) => {
    dispatch(updateBookingStatusThunk({ id: bookingId, status: "ACCEPTED" }));
  }, [dispatch]);

  const handleReject = useCallback((bookingId: string) => {
    const reason = prompt("Enter rejection reason (e.g. Yard intake capacity reached for this grade):");
    if (reason !== null) {
      dispatch(updateBookingStatusThunk({ id: bookingId, status: "REJECTED" }));
    }
  }, [dispatch]);

  const handleVerifyEntry = useCallback((token: string) => {
    dispatch(verifyGateTokenThunk(token));
  }, [dispatch]);

  const handleOpenWeighbridge = useCallback((booking: Booking) => {
    setSelectedBookingForWeighbridge(booking);
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
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
        onOpenVerifyModal={() => setShowVerifyModal(true)}
        onDefaultSlots={handleDefaultSlots}
      />

      {/* Modals */}
      <VerifyTokenModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerify={handleVerifyEntry}
      />

      <BookingDetailsModal
        booking={selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
      />

      <WeighbridgeSettlementModal
        booking={selectedBookingForWeighbridge}
        onClose={() => setSelectedBookingForWeighbridge(null)}
        onComplete={handleCompleteSettlement}
      />

      <SettlementSlipModal
        booking={selectedBookingForSlip}
        onClose={() => setSelectedBookingForSlip(null)}
      />
    </div>
  );
}
