import React, { useState, useMemo } from "react";
import {
  QrCode,
  Search,
  Scale,
  X,
  FileText,
  ChevronDown,
  Eye,
} from "lucide-react";
import { Booking } from "../../interfaces";

interface ConsignmentBookingsTableProps {
  currentBookings: Booking[];
  previousBookings: Booking[];
  isActionLoading: boolean;
  onAccept: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  onVerifyEntry: (token: string) => void;
  onOpenWeighbridge: (booking: Booking) => void;
  onViewSlip: (booking: Booking) => void;
  onViewDetails: (booking: Booking) => void;
  onOpenVerifyModal: () => void;
  onDefaultSlots: () => void;
}

export const ConsignmentBookingsTable: React.FC<ConsignmentBookingsTableProps> = ({
  currentBookings,
  previousBookings,
  isActionLoading,
  onAccept,
  onReject,
  onVerifyEntry,
  onOpenWeighbridge,
  onViewSlip,
  onViewDetails,
  onOpenVerifyModal,
  onDefaultSlots,
}) => {
  // Tab state kept close to the table so the top pipeline doesn't re-render!
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const targetDataset = activeTab === "current" ? currentBookings : previousBookings;

  const displayedBookings = useMemo(() => {
    return targetDataset.filter((b) => {
      // Status filter
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }
      // Search query filter
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
  }, [targetDataset, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* ═══ Toolbar & Filters ═══ */}
      <div className="space-y-3 shrink-0">
        {/* Row 1: Segmented Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tabs: Current Bookings & Previous Logs */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-neutral-900 rounded-full border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            <button
              onClick={() => setActiveTab("current")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === "current"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Current Bookings</span>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-black border dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                {currentBookings.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("previous")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === "previous"
                  ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                  : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              }`}
            >
              <span>Previous Logs</span>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-[10px] font-semibold">
                {previousBookings.length}
              </span>
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onDefaultSlots}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-[#E5E5E5] shadow-xs transition cursor-pointer"
            >
              <span>Default Slots For Crnt Time</span>
            </button>
            <button
              onClick={onOpenVerifyModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full text-white shadow-xs transition bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
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

      {/* ═══ Consignment Manifest Card ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-subtle border border-slate-200/80 dark:border-neutral-800 overflow-hidden min-h-[430px] flex flex-col justify-between">
        {/* Dynamic Table Header Bar: Differs between Current Bookings & Previous Logs */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
              {activeTab === "current"
                ? "Active Consignment Bookings"
                : "Previous Consignment Logs"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-neutral-400 mt-0.5 font-normal">
              {activeTab === "current"
                ? "Live verified gate passes and weighbridge manifests"
                : "Historical completed gate passes, weighbridge manifests and settled records"}
            </p>
          </div>
          <div className="text-xs text-slate-400 dark:text-neutral-400 font-medium">
            Total {displayedBookings.length} Records
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
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
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm cursor-pointer hover:underline">
                        {b.token}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5 font-normal">{b.id}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-[#E5E5E5] text-sm block">{b.farmerName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block font-normal">{b.farmerPhone} • {b.farmerId}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">{b.crop}</span>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 block">{b.variety || "Grade-A Standard"}</span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">
                        {b.estimatedQuantityQuintals || b.quantityQuintals || 0} Qtl
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block font-normal">
                        {Math.round(((b.estimatedQuantityQuintals || b.quantityQuintals || 45) / 500) * 100)}% of slot allocated
                      </span>
                    </td>
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="text-slate-900 dark:text-[#E5E5E5] text-sm block font-medium">{b.slotTimeWindow}</span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 block font-normal">{b.arrivalDate}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
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
                              onClick={() => onAccept(b.id)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1 text-xs font-semibold rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => onReject(b.id)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1 text-xs font-semibold rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {b.status === "ACCEPTED" && (
                          <button
                            onClick={() => onVerifyEntry(b.token)}
                            disabled={isActionLoading}
                            className="px-4 py-1 text-xs font-semibold rounded-full border border-neutral-400 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
                          >
                            Verify Entry
                          </button>
                        )}
                        {b.status === "VERIFIED" && (
                          <button
                            onClick={() => onOpenWeighbridge(b)}
                            disabled={isActionLoading}
                            className="px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </button>
                        )}
                        {b.status === "COMPLETED" && (
                          <button
                            onClick={() => onViewSlip(b)}
                            className="px-3.5 py-1 text-xs font-medium rounded-full border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                            <span>View Slip</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewDetails(b)}
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
            Showing {displayedBookings.length} of {displayedBookings.length}{" "}
            {activeTab === "current" ? "active" : "previous"} records
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition cursor-pointer">
              Prev
            </button>
            <button className="w-7 h-7 flex items-center justify-center font-semibold text-slate-900 dark:text-[#E5E5E5] border border-slate-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 shadow-xs">
              1
            </button>
            <button className="px-2.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
