import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  QrCode,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Phone,
  Scale,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
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

const ITEMS_PER_PAGE = 4;

export function MandiBookingsView() {
  const dispatch = useAppDispatch();
  const { currentBookings, previousBookings, selectedFarmerDetails, isActionLoading } = useAppSelector(
    (state) => state.mandi
  );

  useEffect(() => {
    dispatch(fetchCurrentBookingsThunk());
    dispatch(fetchPreviousBookingsThunk());
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cropFilter, setCropFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedPassBooking, setSelectedPassBooking] = useState<Booking | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [selectedSettlementBooking, setSelectedSettlementBooking] = useState<Booking | null>(null);

  // Settlement Form State
  const [grossWeightKg, setGrossWeightKg] = useState<number>(4800);
  const [tareWeightKg, setTareWeightKg] = useState<number>(200);

  // Available Crops for Filter
  const allDataset = [...currentBookings, ...previousBookings];
  const distinctCrops = Array.from(new Set(allDataset.map((b) => b.crop))).filter(Boolean);

  const targetList = activeTab === "active" ? currentBookings : previousBookings;

  const filteredBookings = useMemo(() => {
    return targetList.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchToken = b.token?.toLowerCase().includes(q);
        const matchId = b.id?.toLowerCase().includes(q);
        const matchFarmer = b.farmerName?.toLowerCase().includes(q);
        const matchCrop = b.crop?.toLowerCase().includes(q);
        const matchVehicle = b.vehicleNumber?.toLowerCase().includes(q);
        if (!matchToken && !matchId && !matchFarmer && !matchCrop && !matchVehicle) return false;
      }
      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      // Crop
      if (cropFilter !== "ALL" && b.crop !== cropFilter) return false;

      return true;
    });
  }, [targetList, searchQuery, statusFilter, cropFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCropFilter("ALL");
    setCurrentPage(1);
  };

  const handleOpenFarmerDetails = (farmerId: string) => {
    dispatch(fetchFarmerDetailsThunk(farmerId));
    setShowFarmerModal(true);
  };

  const handleOpenSettlement = (booking: Booking) => {
    setSelectedSettlementBooking(booking);
    const est = (booking.quantityQuintals || 50) * 100;
    setGrossWeightKg(est + 200);
    setTareWeightKg(200);
  };

  const handleSaveSettlement = () => {
    if (!selectedSettlementBooking) return;
    const netQuintals = Math.max(0, (grossWeightKg - tareWeightKg) / 100);
    const rate = selectedSettlementBooking.crop.includes("Wheat")
      ? 2425
      : selectedSettlementBooking.crop.includes("Mustard")
      ? 5650
      : 3850;
    const finalPayout = Math.round(netQuintals * rate);

    dispatch(
      completeBookingThunk({
        id: selectedSettlementBooking.id,
        payload: {
          actualWeightQuintals: netQuintals,
          finalPayoutAmount: finalPayout,
        },
      })
    );
    setSelectedSettlementBooking(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "ARRIVED":
        return {
          bg: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
          label: status === "VERIFIED" ? "Gate Arrived" : "Arrived",
        };
      case "ACCEPTED":
        return {
          bg: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
          label: "Accepted",
        };
      case "COMPLETED":
        return {
          bg: "bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-300 border-slate-300 dark:border-neutral-700",
          label: "Completed",
        };
      case "REJECTED":
      case "CANCELLED":
        return {
          bg: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800",
          label: status,
        };
      default:
        return {
          bg: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
          label: "Pending",
        };
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in font-sans pb-10">
      {/* ═══ 1. HEADER ═══ */}
      <div className="border-b border-slate-200 dark:border-neutral-800 pb-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
          Bookings
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
          Manage active unloading slots, previous deliveries, and digital passes.
        </p>
      </div>

      {/* ═══ 2. SEARCH & FILTER TOOLBAR (Matches Reference Image) ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-3 shadow-subtle flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by booking ID, mandi, crop or vehicle..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E5E5E5] placeholder:text-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-40 px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="VERIFIED">Gate Arrived / Verified</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* Crops Filter */}
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

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-emerald-700 bg-slate-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition cursor-pointer border border-slate-200 dark:border-neutral-700 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* ═══ 3. TABS & RESULT STATS ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Showing {filteredBookings.length} of {targetList.length} bookings
          </span>
        </div>

        {/* Active vs History Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
          <button
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "active"
                ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-neutral-400"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Bookings ({currentBookings.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-neutral-400"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Previous History ({previousBookings.length})</span>
          </button>
        </div>
      </div>

      {/* ═══ 4. BOOKINGS CARDS LIST (Matching Reference Image) ═══ */}
      <div className="space-y-3">
        {paginatedBookings.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-neutral-600" />
            <p className="font-bold text-sm text-slate-700 dark:text-neutral-300">No arrival bookings found</p>
            <p className="text-xs mt-1">Try adjusting search criteria or wait for new farmer arrivals.</p>
          </div>
        ) : (
          paginatedBookings.map((b) => {
            const badge = getStatusBadge(b.status);
            const queueNumStr = b.queueNumber ? String(b.queueNumber).padStart(3, "0") : "001";
            const isFirstInQueue = b.queueNumber === 1;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-subtle hover:border-emerald-300 dark:hover:border-emerald-800/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Slot & Queue Indicator */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400">SLOT</span>
                    <span className="text-base font-bold text-slate-900 dark:text-[#E5E5E5] font-mono leading-none mt-0.5">
                      {queueNumStr}
                    </span>
                    {isFirstInQueue && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        1st in line
                      </span>
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-slate-900 dark:text-[#E5E5E5] border border-slate-200 dark:border-neutral-700">
                        {b.token}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-[#E5E5E5]">
                        {b.crop} {b.variety ? `(${b.variety})` : ""}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                      <button
                        onClick={() => handleOpenFarmerDetails(b.farmerId)}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        title="View complete farmer profile and KYC records"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{b.farmerName || "Farmer"}</span>
                      </button>

                      <span>•</span>

                      <span className="font-medium text-slate-700 dark:text-neutral-300">
                        {b.quantityQuintals ?? b.estimatedQuantityQuintals ?? 10} Quintals ({(((b.quantityQuintals ?? b.estimatedQuantityQuintals ?? 10)) * 100).toLocaleString("en-IN")} KG)
                      </span>

                      {b.vehicleNumber && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-neutral-400">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {b.vehicleNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Right: Timing & Actions */}
                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-neutral-800">
                  {/* Schedule */}
                  <div className="text-right text-xs shrink-0 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#E5E5E5] justify-end">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{b.arrivalDate || "Today"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] justify-end mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{b.slotTimeWindow || "10:00 AM - 11:30 AM"}</span>
                    </div>
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-2">
                    {/* Digital Pass Button (Matches Reference) */}
                    <button
                      onClick={() => setSelectedPassBooking(b)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-emerald-500 text-slate-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition cursor-pointer bg-slate-50/60 dark:bg-neutral-800/60"
                      title="View Digital QR Entry Pass"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Digital Pass</span>
                    </button>

                    {/* Operational Action Buttons */}
                    {b.status === "PENDING" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => dispatch(updateBookingStatusThunk({ id: b.id, status: "ACCEPTED" }))}
                          disabled={isActionLoading}
                          className="btn-primary-green px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => dispatch(updateBookingStatusThunk({ id: b.id, status: "REJECTED" }))}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {b.status === "ACCEPTED" && (
                      <button
                        onClick={() => dispatch(verifyGateTokenThunk(b.token))}
                        disabled={isActionLoading}
                        className="btn-primary-green px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                      >
                        Gate Verify
                      </button>
                    )}

                    {(b.status === "VERIFIED" || b.status === "ARRIVED") && (
                      <button
                        onClick={() => handleOpenSettlement(b)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Settle Weight</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ 5. PAGINATION (Matches Reference Image) ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentPage === page
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══ DIGITAL PASS MODAL ═══ */}
      {selectedPassBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900/50">
              <span className="font-bold text-xs text-slate-900 dark:text-[#E5E5E5]">
                Electronic Gate Pass & QR Token
              </span>
              <button
                onClick={() => setSelectedPassBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* Token Code */}
              <div className="inline-block px-4 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-mono font-bold text-lg text-emerald-800 dark:text-emerald-300 tracking-wider">
                {selectedPassBooking.token}
              </div>

              {/* QR Code Visual representation */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-800 shadow-md flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    selectedPassBooking.qrCodeData || selectedPassBooking.token
                  )}`}
                  alt="Entry QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-neutral-400">
                <p className="font-bold text-slate-900 dark:text-[#E5E5E5] text-sm">
                  {selectedPassBooking.farmerName || "Farmer Producer"}
                </p>
                <p>
                  {selectedPassBooking.crop} • {selectedPassBooking.quantityQuintals} Quintals
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  Vehicle: {selectedPassBooking.vehicleNumber || "Tractor / Trolley"}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-800 dark:text-neutral-200 font-bold text-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pass</span>
                </button>
                <button
                  onClick={() => setSelectedPassBooking(null)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Close Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ WEIGHBRIDGE SETTLEMENT MODAL ═══ */}
      {selectedSettlementBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-[#E5E5E5]">
                  Weighbridge Intake Settlement
                </h3>
              </div>
              <button
                onClick={() => setSelectedSettlementBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  Gross Weight (KG)
                </label>
                <input
                  type="number"
                  value={grossWeightKg}
                  onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl font-mono font-bold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  Vehicle Tare Weight (KG)
                </label>
                <input
                  type="number"
                  value={tareWeightKg}
                  onChange={(e) => setTareWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl font-mono font-bold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Commodity Weight:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {Math.max(0, grossWeightKg - tareWeightKg)} KG (
                    {((grossWeightKg - tareWeightKg) / 100).toFixed(2)} Qtl)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedSettlementBooking(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettlement}
                className="flex-1 btn-primary-green py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FARMER DETAILS MODAL ═══ */}
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
