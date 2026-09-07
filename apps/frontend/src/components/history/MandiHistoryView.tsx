import React, { useState } from "react";
import { Search, Download, FileText, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";

export function MandiHistoryView() {
  const { previousBookings } = useAppSelector((state) => state.mandi);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("ALL");

  const filteredHistory = previousBookings.filter((b) => {
    if (selectedCrop !== "ALL" && !b.crop.toUpperCase().includes(selectedCrop.toUpperCase())) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const tokenMatch = (b.token || "").toLowerCase().includes(term);
      const farmerMatch = (b.farmerName || b.farmer?.name || "").toLowerCase().includes(term);
      const vehicleMatch = (b.vehicleNumber || "").toLowerCase().includes(term);
      if (!tokenMatch && !farmerMatch && !vehicleMatch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-3">
        <div>
          <h1 className="text-xl font-black text-black dark:text-[#E5E5E5] tracking-tight">
            Arrival History & Weighbridge Settlements
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
            Archival audit log of verified gate passes, gross weights, assayed moisture, and final payments.
          </p>
        </div>

        <button
          onClick={() => alert("Downloading certified weighbridge settlement ledger CSV...")}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-800 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#15803D] dark:text-[#5CE65C]" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Token, Farmer Name, or Vehicle No..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#5CE65C] text-black dark:text-[#E5E5E5]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-600 dark:text-neutral-400">Crop:</span>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold border border-gray-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-black text-gray-800 dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C] cursor-pointer"
          >
            <option value="ALL">All Commodities</option>
            <option value="WHEAT">Wheat</option>
            <option value="RICE">Rice</option>
            <option value="MUSTARD">Mustard</option>
            <option value="SOYABEAN">Soyabean</option>
          </select>
        </div>
      </div>

      {/* 3. Historical Data Table */}
      <div className="mandi-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="mandi-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Farmer Details</th>
                <th>Crop & Variety</th>
                <th>Gross Weight</th>
                <th>Tare Weight</th>
                <th>Net Weight</th>
                <th>Settled Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No historical weighbridge records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-mono font-bold text-xs text-[#15803D]">
                        {row.token}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400">
                        {row.id}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-black text-xs">
                        {row.farmerName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {row.vehicleNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-black text-xs">
                        {row.crop}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {row.variety || "Standard Grade"}
                      </div>
                    </td>
                    <td className="font-mono font-bold text-xs">
                      {row.actualGrossWeightKg ? `${row.actualGrossWeightKg} Kg` : "-"}
                    </td>
                    <td className="font-mono text-xs text-gray-500">
                      {row.tareWeightKg ? `${row.tareWeightKg} Kg` : "-"}
                    </td>
                    <td>
                      <span className="font-black text-black text-xs">
                        {row.finalNetWeightQuintals ?? row.estimatedQuantityQuintals} Qtl
                      </span>
                    </td>
                    <td>
                      <span className="font-black text-[#15803D] text-xs">
                        ₹{(row.finalPayoutAmount ?? 125000).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <span className="badge-completed text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
