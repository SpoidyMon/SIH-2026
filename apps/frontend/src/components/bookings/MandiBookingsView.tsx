import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  RotateCcw,
  QrCode,
  Truck,
  Calendar,
  Clock,
  User,
  Scale,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  updateBookingStatusThunk,
  verifyGateTokenThunk,
  completeBookingThunk,
  fetchFarmerDetailsThunk,
  fetchCurrentBookingsThunk,
  fetchPreviousBookingsThunk,
  setSelectedFarmerDetails,
} from "../../store/slices/mandiSlice";
import { Booking } from "../../interfaces";
import { FarmerDetailsModal } from "../common/FarmerDetailsModal";
import { BookingDetailsModal } from "../dashboard/modals/BookingDetailsModal";
import { WeighbridgeSettlementModal } from "../dashboard/modals/WeighbridgeSettlementModal";
import { SettlementSlipModal } from "../dashboard/modals/SettlementSlipModal";
import { VerifyTokenModal } from "../dashboard/modals/VerifyTokenModal";

export type MandiBookingsTab = "pending" | "accepted" | "completed" | "discarded";

export function MandiBookingsView() {
  const dispatch = useAppDispatch();
  const { currentBookings, previousBookings, selectedFarmerDetails, isActionLoading } = useAppSelector(
    (state) => state.mandi
  );

  useEffect(() => {
    dispatch(fetchCurrentBookingsThunk());
    dispatch(fetchPreviousBookingsThunk());
  }, [dispatch]);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<MandiBookingsTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cropFilter, setCropFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForWeighbridge, setSelectedBookingForWeighbridge] = useState<Booking | null>(null);
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  // Reject Modal State
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Combine unique bookings
  const allBookings = useMemo(() => {
    const map = new Map<string, Booking>();
    currentBookings.forEach((b) => map.set(b.id, b));
    previousBookings.forEach((b) => map.set(b.id, b));
    return Array.from(map.values());
  }, [currentBookings, previousBookings]);

  // Distinct crops
  const distinctCrops = useMemo(() => {
    return Array.from(new Set(allBookings.map((b) => b.crop))).filter(Boolean);
  }, [allBookings]);

  // Segmented Lists
  const pendingList = useMemo(() => allBookings.filter((b) => b.status === "PENDING"), [allBookings]);
  const acceptedList = useMemo(
    () => allBookings.filter((b) => b.status === "ACCEPTED" || b.status === "VERIFIED" || b.status === "ARRIVED"),
    [allBookings]
  );
  const completedList = useMemo(() => allBookings.filter((b) => b.status === "COMPLETED"), [allBookings]);
  const discardedList = useMemo(
    () => allBookings.filter((b) => b.status === "REJECTED" || b.status === "CANCELLED"),
    [allBookings]
  );

  const targetDataset = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return pendingList;
      case "accepted":
        return acceptedList;
      case "completed":
        return completedList;
      case "discarded":
        return discardedList;
      default:
        return pendingList;
    }
  }, [activeTab, pendingList, acceptedList, completedList, discardedList]);

  const filteredBookings = useMemo(() => {
    return targetDataset.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchToken = b.token?.toLowerCase().includes(q);
        const matchId = b.id?.toLowerCase().includes(q);
        const matchFarmer = b.farmerName?.toLowerCase().includes(q);
        const matchCrop = b.crop?.toLowerCase().includes(q);
        const matchPhone = b.farmerPhone?.toLowerCase().includes(q);
        if (!matchToken && !matchId && !matchFarmer && !matchCrop && !matchPhone) return false;
      }
      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      // Crop
      if (cropFilter !== "ALL" && b.crop !== cropFilter) return false;

      return true;
    });
  }, [targetDataset, searchQuery, statusFilter, cropFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCropFilter("ALL");
    setCurrentPage(1);
  };

  const handleAccept = useCallback((bookingId: string) => {
    dispatch(updateBookingStatusThunk({ id: bookingId, status: "ACCEPTED" }));
  }, [dispatch]);

  const handleOpenRejectModal = (booking: Booking) => {
    setRejectingBooking(booking);
    setRejectionReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectingBooking) return;
    const reason = rejectionReason.trim() || "Slot capacity reached or produce criteria not met.";
    dispatch(updateBookingStatusThunk({ id: rejectingBooking.id, status: "REJECTED", rejectionReason: reason }));
    setRejectingBooking(null);
    setRejectionReason("");
  };

  const handleVerifyEntry = useCallback((token: string) => {
    dispatch(verifyGateTokenThunk(token));
  }, [dispatch]);

  const handleOpenWeighbridge = useCallback((booking: Booking) => {
    setSelectedBookingForWeighbridge(booking);
  }, []);

  const handleCompleteSettlement = useCallback(
    (bookingId: string, actualWeightQuintals: number, finalPayoutAmount: number) => {
      dispatch(
        completeBookingThunk({
          id: bookingId,
          payload: {
            actualWeightQuintals,
            finalPayoutAmount,
          },
        })
      );
    },
    [dispatch]
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fade-in font-sans pb-10">
      {/* ═══ 1. HEADER ═══ */}
      <div className="border-b border-slate-200 dark:border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
            Consignment Bookings Manifest
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
            Manage incoming arrivals, verify gate passes, inspect farmer profiles, and settle weighbridge clearances.
          </p>
        </div>

        <button
          onClick={() => setShowVerifyModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition bg-emerald-600 hover:bg-emerald-700 cursor-pointer self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Verify QR / Token</span>
        </button>
      </div>

      {/* ═══ 2. SEGMENTED TABS & SEARCH TOOLBAR ═══ */}
      <div className="space-y-3">
        {/* Row 1: 4 Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center p-1 bg-slate-100 dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            {/* Tab 1: Pending */}
            <button
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "pending"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Pending Bookings</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                {pendingList.length}
              </span>
            </button>

            {/* Tab 2: Accepted */}
            <button
              onClick={() => {
                setActiveTab("accepted");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "accepted"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Accepted Passes</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-400 text-[10px] font-bold">
                {acceptedList.length}
              </span>
            </button>

            {/* Tab 3: Completed */}
            <button
              onClick={() => {
                setActiveTab("completed");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "completed"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Completed Settlements</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                {completedList.length}
              </span>
            </button>

            {/* Tab 4: Discarded */}
            <button
              onClick={() => {
                setActiveTab("discarded");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "discarded"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Discarded Requests</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-[10px] font-bold">
                {discardedList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Filter Toolbar */}
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-3 shadow-xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by token, farmer name, mobile number, or crop..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E5E5E5] placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={cropFilter}
            onChange={(e) => {
              setCropFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-44 px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Crops</option>
            {distinctCrops.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-emerald-700 bg-slate-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition cursor-pointer border border-slate-200 dark:border-neutral-700 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* ═══ 3. MANIFEST TABLE & CARDS ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-subtle border border-slate-200/80 dark:border-neutral-800 overflow-hidden flex flex-col justify-between min-h-[480px]">
        {/* Manifest Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
              {activeTab === "pending"
                ? "Pending Consignment Requests"
                : activeTab === "accepted"
                ? "Authorized Gate Passes"
                : activeTab === "completed"
                ? "Settled & Weighed Consignments"
                : "Discarded Applications"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              {activeTab === "pending"
                ? "Incoming requests awaiting Mandi approval. Click any row to view complete farmer KYC and crop breakdown."
                : activeTab === "accepted"
                ? "Official gate tokens ready for yard check-in and weighbridge assay."
                : activeTab === "completed"
                ? "Completed deliveries with verified weights and DBT payouts."
                : "Rejected applications with reason. Farmers are blocked from reapplying on the same slot."}
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
            Total {filteredBookings.length} {filteredBookings.length === 1 ? "Record" : "Records"}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto flex-1 flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">BOOKING / TOKEN</th>
                <th className="py-3.5 px-4">FARMER DETAILS</th>
                <th className="py-3.5 px-4">CROPS</th>
                <th className="py-3.5 px-4">QUANTITY (KG)</th>
                <th className="py-3.5 px-4">ARRIVAL WINDOW</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 pl-4 pr-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-24 text-slate-400 dark:text-neutral-500 font-medium">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-neutral-600" />
                    <p className="font-bold text-sm text-slate-700 dark:text-neutral-300">
                      No {activeTab} consignment bookings found
                    </p>
                    <p className="text-xs mt-0.5">
                      Try switching tabs or adjusting search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => {
                  const displayKg = b.quantityKg || (b.quantityQuintals ? b.quantityQuintals * 100 : 0);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBookingForDetails(b)}
                      className="hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition cursor-pointer"
                    >
                      <td className="py-4 pl-6 pr-4 align-middle whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm hover:underline">
                          {b.token || `REQ-#${b.queueNumber || 1}`}
                        </span>
                        <span className="block text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5 font-mono">
                          Queue #{b.queueNumber || 1} • {b.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-[#E5E5E5] text-sm block">
                          {b.farmerName || "Registered Producer"}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block">
                          {b.farmerPhone || "KYC Verified"}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-semibold">
                          {b.crop}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {b.variety || "Grade-A Produce"}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-bold">
                          {displayKg.toLocaleString()} KG
                        </span>
                        {b.estimatedPayout ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            ₹{b.estimatedPayout.toLocaleString()} est.
                          </span>
                        ) : null}
                      </td>

                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-semibold">
                          {b.slotTimeWindow || (b.slot?.startTime ? `${b.slot?.startTime} - ${b.slot?.endTime}` : "09:00 - 13:30")}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block">
                          {b.arrivalDate || b.slot?.date || "Today"}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                            b.status === "PENDING"
                              ? "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                              : b.status === "ACCEPTED"
                              ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300"
                              : b.status === "VERIFIED" || b.status === "ARRIVED"
                              ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                              : b.status === "COMPLETED"
                              ? "border-slate-300 text-slate-700 bg-slate-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                              : "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                          }`}
                        >
                          {b.status}
                        </span>
                        {b.rejectionReason && (
                          <span
                            className="block text-[10px] text-red-500 font-semibold truncate max-w-[140px] mx-auto mt-0.5"
                            title={b.rejectionReason}
                          >
                            {b.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td
                        className="py-4 pl-4 pr-6 align-middle text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2 justify-end">
                          {b.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleAccept(b.id)}
                                disabled={isActionLoading}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-neutral-900 transition cursor-pointer shadow-2xs"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(b)}
                                disabled={isActionLoading}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {b.status === "ACCEPTED" && (
                            <button
                              onClick={() => handleVerifyEntry(b.token)}
                              disabled={isActionLoading}
                              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
                            >
                              Verify Gate Pass
                            </button>
                          )}

                          {(b.status === "VERIFIED" || b.status === "ARRIVED") && (
                            <button
                              onClick={() => handleOpenWeighbridge(b)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Settle Weight</span>
                            </button>
                          )}

                          {b.status === "COMPLETED" && (
                            <button
                              onClick={() => setSelectedBookingForSlip(b)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Slip</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedBookingForDetails(b)}
                            title="Inspect Details & KYC"
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 bg-slate-50/50 dark:bg-neutral-900/30 shrink-0">
            <div>
              Showing {paginatedBookings.length} of {filteredBookings.length} records in <strong>{activeTab}</strong> tab
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer font-semibold transition"
              >
                Prev
              </button>
              <div className="px-3 py-1 font-bold text-slate-900 dark:text-[#E5E5E5] border border-slate-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 shadow-xs">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer font-semibold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ REJECTION REASON MODAL ═══ */}
      {rejectingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Reject Consignment Application</span>
              </h3>
              <button
                onClick={() => setRejectingBooking(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Please specify a mandatory reason for rejecting this arrival application for farmer{" "}
              <strong>{rejectingBooking.farmerName || "Farmer"}</strong>. Note that the farmer will not be able to reapply for this slot once rejected.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Yard intake capacity reached / Moisture criteria not met / Yard undergoing maintenance"
                className="w-full p-3 text-xs bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:border-red-500 outline-none text-slate-800 dark:text-[#E5E5E5]"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isActionLoading}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer shadow-xs transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
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

      <VerifyTokenModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerify={handleVerifyEntry}
      />

      <FarmerDetailsModal
        isOpen={showFarmerModal}
        onClose={() => {
          setShowFarmerModal(false);
          dispatch(setSelectedFarmerDetails(null));
        }}
        farmer={selectedFarmerDetails}
      />
    </div>
  );
}
