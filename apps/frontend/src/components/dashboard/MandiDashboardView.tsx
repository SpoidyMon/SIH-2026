import React, { useState } from "react";
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CalendarDays,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowUpRight,
  Filter,
  X,
  Printer,
  ChevronDown,
  FileText,
  Building2,
  Phone,
  UserCheck,
  MapPin,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  updateBookingStatusThunk,
  verifyGateTokenThunk,
  completeBookingThunk,
  applyDefaultPresetsThunk,
  setActiveNavTab,
} from "../../store/slices/mandiSlice";
import { Booking } from "../../interfaces";

export function MandiDashboardView() {
  const dispatch = useAppDispatch();
  const { stats, currentBookings, previousBookings, isActionLoading } = useAppSelector(
    (state) => state.mandi
  );

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState("");
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForWeighbridge, setSelectedBookingForWeighbridge] = useState<Booking | null>(null);
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);

  // Weighbridge settlement form state
  const [grossWeightKg, setGrossWeightKg] = useState<number>(4700);
  const [tareWeightKg, setTareWeightKg] = useState<number>(200);
  const [moisturePercent, setMoisturePercent] = useState<number>(11.5);

  // Filtered rows
  const targetDataset = activeTab === "current" ? currentBookings : previousBookings;
  const displayedBookings = targetDataset.filter((b) => {
    // Status Filter
    if (statusFilter !== "ALL" && b.status !== statusFilter) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchToken = b.token?.toLowerCase().includes(q);
      const matchId = b.id?.toLowerCase().includes(q);
      const matchFarmer = b.farmerName?.toLowerCase().includes(q);
      const matchPhone = b.farmerPhone?.toLowerCase().includes(q);
      const matchCrop = b.crop?.toLowerCase().includes(q);
      const matchVariety = b.variety?.toLowerCase().includes(q);
      if (!matchToken && !matchId && !matchFarmer && !matchPhone && !matchCrop && !matchVariety) {
        return false;
      }
    }
    return true;
  });

  // Action Handlers
  const handleAccept = (bookingId: string) => {
    dispatch(updateBookingStatusThunk({ id: bookingId, status: "ACCEPTED" }));
  };

  const handleReject = (bookingId: string) => {
    const reason = prompt("Enter rejection reason (e.g. Yard intake capacity reached for this grade):");
    if (reason !== null) {
      dispatch(updateBookingStatusThunk({ id: bookingId, status: "REJECTED" }));
    }
  };

  const handleVerifyEntry = (token: string) => {
    dispatch(verifyGateTokenThunk(token));
  };

  const handleOpenWeighbridge = (booking: Booking) => {
    setSelectedBookingForWeighbridge(booking);
    const estimatedKg = (booking.estimatedQuantityQuintals || booking.quantityQuintals || 50) * 100;
    setGrossWeightKg(estimatedKg + 200);
    setTareWeightKg(200);
    setMoisturePercent(11.4);
  };

  const handleCompleteSettlement = () => {
    if (!selectedBookingForWeighbridge) return;
    const netQuintals = Math.max(0, (grossWeightKg - tareWeightKg) / 100);
    const ratePerQuintal = selectedBookingForWeighbridge.crop.includes("Wheat")
      ? 2300
      : selectedBookingForWeighbridge.crop.includes("Mustard")
      ? 5400
      : selectedBookingForWeighbridge.crop.includes("Rice")
      ? 3800
      : 5400;
    const finalPayout = Math.round(netQuintals * ratePerQuintal);

    dispatch(
      completeBookingThunk({
        id: selectedBookingForWeighbridge.id,
        payload: {
          actualWeightQuintals: netQuintals,
          finalPayoutAmount: finalPayout,
        },
      })
    );
    setSelectedBookingForWeighbridge(null);
  };

  const handleDefaultSlots = () => {
    dispatch(applyDefaultPresetsThunk());
  };

  const handleQuickVerifyTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) return;
    dispatch(verifyGateTokenThunk(verifyTokenInput.trim()));
    setShowVerifyModal(false);
    setVerifyTokenInput("");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fade-in font-sans">
      {/* ═══ BEGIN: Zone2_TopSection (Header & Realtime KPI Metric Indicators) ═══ */}
      <section className="bg-white dark:bg-[#121212] rounded-2xl p-5 shadow-subtle border border-slate-200/80 dark:border-neutral-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#E5E5E5]">
              Mandi Operational Pipeline
            </h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
              Real-time consignment intake, gate token clearance, weighbridge assay &amp; DBT payouts.
            </p>
          </div>
          {/* Live Time & Mandi Sub-Yard Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border dark:border-neutral-800 text-xs font-medium text-slate-600 dark:text-neutral-300">
              <span>📍 APMC Indore Central — Yard B</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-black dark:text-emerald-300 border border-emerald-400 dark:border-emerald-800/60 text-xs font-semibold">
              <span>Season: Rabi 2024–25</span>
            </div>
          </div>
        </div>

        {/* 4 Clean KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* KPI 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Today's Arrival Slots</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            </div>
            <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">14 Windows</p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Wheat &amp; Mustard</span> in morning shift
            </p>
          </div>

          {/* KPI 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Active Bookings</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">42 Consignments</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">8 Pending Review • 12 Accepted</p>
          </div>

          {/* KPI 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Yard Clearance Today</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">28 Cleared</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              19 Weighed &amp; Escrow Settled
            </p>
          </div>

          {/* KPI 4 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Total Net Turnover</span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            </div>
            <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">₹ 96.7 Lakhs</p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              Avg. settlement: 18 mins
            </p>
          </div>
        </div>
      </section>
      {/* ═══ END: Zone2_TopSection ═══ */}

      {/* ═══ BEGIN: Zone3_ToolbarAndFilters ═══ */}
      <div className="space-y-3 shrink-0">
        {/* Row 1: Segmented Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tabs: Current Bookings & Previous Logs */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-neutral-900 rounded-full border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            <button
              onClick={() => setActiveTab("current")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === "current"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-sm"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Current Bookings</span>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-black border dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                4
              </span>
            </button>
            <button
              onClick={() => setActiveTab("previous")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === "previous"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-sm"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Previous Logs</span>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-[10px] font-bold">
                2
              </span>
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDefaultSlots}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-[#E5E5E5] shadow-xs transition cursor-pointer"
            >
              <span>Default Slots For Crnt Time</span>
            </button>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full text-white shadow-xs transition bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Verify QR / Token</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Input & Status Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 rounded-full focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 dark:text-[#E5E5E5] placeholder-slate-400 dark:placeholder-neutral-500 shadow-xs transition"
              placeholder="Search by token, farmer name, mobile or commodity..."
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
          <div className="relative shrink-0">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none flex items-center gap-2 pl-4 pr-9 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-[#E5E5E5] shadow-xs transition cursor-pointer outline-none"
              >
                <option value="ALL">Filter Status: All</option>
                <option value="PENDING">Filter Status: PENDING</option>
                <option value="ACCEPTED">Filter Status: ACCEPTED</option>
                <option value="VERIFIED">Filter Status: VERIFIED</option>
                <option value="COMPLETED">Filter Status: COMPLETED</option>
                <option value="REJECTED">Filter Status: REJECTED</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      {/* ═══ END: Zone3_ToolbarAndFilters ═══ */}

      {/* ═══ BEGIN: Zone1_PrimaryConsignmentManifest ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-subtle border border-slate-200/80 dark:border-neutral-800 overflow-hidden mb-6 min-h-[430px] flex flex-col justify-between">
        {/* Table Header Bar */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">Active Consignment Bookings</h2>
            <p className="text-xs text-slate-400 dark:text-neutral-400 mt-0.5">Live verified gate passes and weighbridge manifests</p>
          </div>
          <div className="text-xs text-slate-400 dark:text-neutral-400 font-medium">
            Total {displayedBookings.length} Records
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">BOOKING / TOKEN</th>
                <th className="py-3.5 px-4">FARMER DETAILS</th>
                <th className="py-3.5 px-4">CROP &amp; VARIETY</th>
                <th className="py-3.5 px-4">QUANTITY &amp; %</th>
                <th className="py-3.5 px-4">ARRIVAL SLOT</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 pl-4 pr-6 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
              {displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-neutral-500">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                displayedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 transition">
                    <td className="py-4 pl-6 pr-4 align-middle whitespace-nowrap">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm cursor-pointer hover:underline">
                        {b.token}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">{b.id}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-[#E5E5E5] text-sm block">{b.farmerName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block">{b.farmerPhone} • {b.farmerId}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">{b.crop}</span>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 block">{b.variety || "Grade-A Standard"}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">
                        {b.estimatedQuantityQuintals || b.quantityQuintals || 0} Qtl
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block">
                        {Math.round(((b.estimatedQuantityQuintals || b.quantityQuintals || 45) / 500) * 100)}% of slot allocated
                      </span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">{b.slotTimeWindow}</span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block">{b.arrivalDate}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                        b.status === "PENDING"
                          ? "border-amber-300 text-amber-600 bg-amber-50/40 dark:bg-black dark:border-amber-600/60 dark:text-amber-400"
                          : b.status === "ACCEPTED"
                          ? "border-blue-300 text-blue-600 bg-blue-50/40 dark:bg-black dark:border-neutral-700 dark:text-neutral-300"
                          : b.status === "VERIFIED"
                          ? "border-emerald-400 text-emerald-600 bg-emerald-50/40 dark:bg-black dark:border-emerald-800/60 dark:text-emerald-400"
                          : "border-slate-300 text-slate-700 bg-slate-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-6 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {b.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleAccept(b.id)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1 text-xs font-semibold rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(b.id)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1 text-xs font-semibold rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {b.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleVerifyEntry(b.token)}
                            disabled={isActionLoading}
                            className="px-4 py-1 text-xs font-semibold rounded-full border border-neutral-400 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
                          >
                            Verify Entry
                          </button>
                        )}
                        {b.status === "VERIFIED" && (
                          <button
                            onClick={() => handleOpenWeighbridge(b)}
                            disabled={isActionLoading}
                            className="px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </button>
                        )}
                        {b.status === "COMPLETED" && (
                          <button
                            onClick={() => setSelectedBookingForSlip(b)}
                            className="px-3.5 py-1 text-xs font-medium rounded-full border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                            <span>View Slip</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBookingForDetails(b)}
                          title="View Booking Details"
                          className="w-7 h-7 rounded-full border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition ml-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 bg-white dark:bg-[#121212]">
          <div>
            Showing {displayedBookings.length} of {displayedBookings.length} active records
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition cursor-pointer">Prev</button>
            <button className="w-7 h-7 flex items-center justify-center font-bold text-slate-900 dark:text-[#E5E5E5] border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 shadow-xs">1</button>
            <button className="px-2.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition cursor-pointer">Next</button>
          </div>
        </div>
      </div>
      {/* ═══ END: Zone1_PrimaryConsignmentManifest ═══ */}

      {/* ═══ MODAL 1: QUICK VERIFY QR / TOKEN ═══ */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-[#E5E5E5]">
                <QrCode className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
                <span>Verify Gate Pass / Arrival Token</span>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickVerifyTokenSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase">
                  Scan QR or Enter Token ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    placeholder="e.g. TKN-7821 or TKN-3190"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-xl text-sm font-mono text-black dark:text-[#E5E5E5] placeholder:text-neutral-400 focus:outline-none focus:border-[#059669]"
                    autoFocus
                  />
                  <QrCode className="w-4 h-4 text-neutral-400 absolute right-3 top-3.5" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Sample active tokens: <strong className="text-black dark:text-[#E5E5E5] font-mono">TKN-7821</strong>, <strong className="text-black dark:text-[#E5E5E5] font-mono">TKN-3190</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Grant Gate Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: BOOKING DETAILS & GATE PASS ═══ */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-[#E5E5E5]">
                <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
                <span>Electronic Gate Pass #{selectedBookingForDetails.token}</span>
              </div>
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block text-xs">Farmer</span>
                  <span className="font-black text-black dark:text-[#E5E5E5] text-sm">{selectedBookingForDetails.farmerName}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 block">{selectedBookingForDetails.farmerPhone}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block text-xs">Vehicle Reference</span>
                  <span className="font-mono font-bold text-black dark:text-[#E5E5E5] text-sm">{selectedBookingForDetails.vehicleNumber}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 block">{selectedBookingForDetails.mandiName}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Crop & Variety</span>
                  <span className="font-bold text-neutral-900 dark:text-[#E5E5E5]">{selectedBookingForDetails.crop} ({selectedBookingForDetails.variety})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Allocated Arrival Window</span>
                  <span className="font-bold text-neutral-900 dark:text-[#E5E5E5]">{selectedBookingForDetails.arrivalDate} | {selectedBookingForDetails.slotTimeWindow}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Estimated Lot Weight</span>
                  <span className="font-bold text-neutral-900 dark:text-[#E5E5E5]">{selectedBookingForDetails.estimatedQuantityQuintals} Quintals</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Booking Status</span>
                  <span className="font-bold uppercase text-[#059669] dark:text-[#5CE65C]">{selectedBookingForDetails.status}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Gate Slip</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="px-4 py-2 text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: WEIGHBRIDGE MEASUREMENT & FINAL SETTLEMENT ═══ */}
      {selectedBookingForWeighbridge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-[#E5E5E5]">
                <Scale className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
                <span>Weighbridge Measurement & Final Settlement</span>
              </div>
              <button
                onClick={() => setSelectedBookingForWeighbridge(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                <div className="font-bold text-neutral-900 dark:text-[#E5E5E5]">{selectedBookingForWeighbridge.farmerName} • {selectedBookingForWeighbridge.vehicleNumber}</div>
                <div className="text-neutral-500 dark:text-neutral-400">{selectedBookingForWeighbridge.crop} (Estimated: {selectedBookingForWeighbridge.estimatedQuantityQuintals} Qtl)</div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">Loaded Gross Weight (Kg)</label>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-bold text-black dark:text-[#E5E5E5]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">Tare Truck Weight (Kg)</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-bold text-black dark:text-[#E5E5E5]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">Assayed Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-bold text-black dark:text-[#E5E5E5]"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-semibold text-[#059669] dark:text-[#5CE65C]">
                  <span>Net Agricultural Quintals:</span>
                  <span>{((grossWeightKg - tareWeightKg) / 100).toFixed(2)} Qtl</span>
                </div>
                <div className="flex justify-between font-black text-black dark:text-[#E5E5E5] text-sm pt-1 border-t border-[#BBF7D0] dark:border-neutral-800">
                  <span>Direct Trade Payout:</span>
                  <span className="text-[#059669] dark:text-[#5CE65C]">
                    ₹
                    {(
                      Math.max(0, (grossWeightKg - tareWeightKg) / 100) *
                      (selectedBookingForWeighbridge.crop.includes("Wheat") ? 2300 : 5400)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForWeighbridge(null)}
                  className="px-4 py-2 font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSettlement}
                  className="px-5 py-2 font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Complete & Issue Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 4: OFFICIAL WEIGHMENT & PAYOUT SLIP ═══ */}
      {selectedBookingForSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 dark:bg-black text-white dark:text-[#E5E5E5] border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-black text-xs">
                  APMC
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white dark:text-[#E5E5E5]">
                    Indore APMC Grain Yard
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Electronic Weighment & Settlement Advice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForSlip(null)}
                className="text-neutral-400 hover:text-white dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Reference Tags */}
              <div className="flex justify-between items-center bg-neutral-50 dark:bg-black p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                <div>
                  <span className="text-[11px] text-neutral-400 uppercase block">Slip Number</span>
                  <span className="font-bold text-black dark:text-[#E5E5E5]">SLIP-{selectedBookingForSlip.id.replace("BK-", "")}-WGH</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400 uppercase block">Token / Date</span>
                  <span className="font-bold text-[#059669] dark:text-[#5CE65C]">{selectedBookingForSlip.token} • {selectedBookingForSlip.arrivalDate}</span>
                </div>
              </div>

              {/* Farmer & Crop Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-400 uppercase font-semibold block">Farmer</span>
                  <span className="font-bold text-neutral-900 dark:text-[#E5E5E5] text-xs">{selectedBookingForSlip.farmerName}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 block text-xs">{selectedBookingForSlip.farmerPhone}</span>
                  <span className="text-xs font-mono text-neutral-400">{selectedBookingForSlip.farmerId}</span>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-400 uppercase font-semibold block">Consignment</span>
                  <span className="font-bold text-neutral-900 dark:text-[#E5E5E5] text-xs">{selectedBookingForSlip.crop}</span>
                  <span className="text-[#059669] dark:text-[#5CE65C] font-semibold block text-xs">{selectedBookingForSlip.variety || "Standard Grade"}</span>
                  <span className="text-xs font-mono text-neutral-500">Truck: {selectedBookingForSlip.vehicleNumber}</span>
                </div>
              </div>

              {/* Weighment Manifest */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <div className="bg-neutral-100 dark:bg-[#181818] px-3.5 py-2 font-bold text-xs text-neutral-700 dark:text-neutral-300">
                  Certified Weighbridge Scale Measurement
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Loaded Vehicle Gross Weight:</span>
                    <span className="font-mono font-bold text-black dark:text-[#E5E5E5]">
                      {(selectedBookingForSlip.actualGrossWeightKg || 11200).toLocaleString()} Kg
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Tare Vehicle Weight (Empty):</span>
                    <span className="font-mono font-bold text-black dark:text-[#E5E5E5]">
                      {(selectedBookingForSlip.tareWeightKg || 200).toLocaleString()} Kg
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Assayed Moisture Reading:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-[#5CE65C]">
                      {selectedBookingForSlip.moisturePercentage || 11.4}% (Compliant)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800 font-extrabold text-black dark:text-[#E5E5E5] text-sm">
                    <span>Certified Net Produce Weight:</span>
                    <span className="text-[#059669] dark:text-[#5CE65C]">
                      {selectedBookingForSlip.finalNetWeightQuintals || selectedBookingForSlip.estimatedQuantityQuintals} Qtl
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Summary */}
              <div className="p-4 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#059669] dark:text-[#5CE65C] block">
                    Direct Farmer Settlement (DBT)
                  </span>
                  <span className="text-2xl font-black text-black dark:text-[#E5E5E5]">
                    ₹{(selectedBookingForSlip.finalPayoutAmount || 594000).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#059669] text-white">
                  ESCROW SETTLED
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 dark:bg-black hover:bg-neutral-200 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForSlip(null)}
                  className="px-5 py-2 text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
