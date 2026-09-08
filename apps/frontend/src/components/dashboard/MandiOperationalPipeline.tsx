import React from "react";
import { MandiDashboardStats } from "../../interfaces";

interface MandiOperationalPipelineProps {
  stats?: MandiDashboardStats | null;
}

export const MandiOperationalPipeline = React.memo(function MandiOperationalPipeline({
  stats,
}: MandiOperationalPipelineProps) {
  const arrivalSlots = stats?.activeSlotsCount ?? 14;
  const activeBookings = (stats?.pendingBookingsCount ?? 8) + (stats?.verifiedCount ?? 12) + 22;
  const cleared = stats?.completedCount ?? 28;
  const turnoverLakhs = stats?.completedTodayPayouts
    ? (stats.completedTodayPayouts / 100000).toFixed(1)
    : "96.7";

  return (
    <section className="bg-white dark:bg-[#121212] rounded-2xl p-5 shadow-subtle border border-slate-200/80 dark:border-neutral-800 shrink-0">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#E5E5E5]">
            Mandi Operational Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
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

      {/* 4 Clean KPI Metric Cards matching reference image styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
        {/* KPI 1 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
            <span>Today's Arrival Slots</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            {arrivalSlots} Windows
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1 font-normal">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Wheat &amp; Mustard</span> in morning shift
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
            <span>Active Bookings</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            {activeBookings} Consignments
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            8 Pending Review • 12 Accepted
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
            <span>Yard Clearance Today</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            {cleared} Cleared
          </p>
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
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            ₹ {turnoverLakhs} Lakhs
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-normal">
            Avg. settlement: 18 mins
          </p>
        </div>
      </div>
    </section>
  );
});
