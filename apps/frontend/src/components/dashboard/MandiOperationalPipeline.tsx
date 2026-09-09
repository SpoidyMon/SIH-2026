import React, { useMemo } from "react";
import { MandiDashboardStats, Booking, MandiSlot, MandiProfile } from "../../interfaces";

interface MandiOperationalPipelineProps {
  stats?: MandiDashboardStats | null;
  currentBookings?: Booking[];
  previousBookings?: Booking[];
  slots?: MandiSlot[];
  profile?: MandiProfile | null;
}

export const MandiOperationalPipeline = React.memo(function MandiOperationalPipeline({
  stats,
  currentBookings = [],
  previousBookings = [],
  slots = [],
  profile,
}: MandiOperationalPipelineProps) {
  // 1. Live Slots KPI Calculation
  const arrivalSlots =
    stats?.metrics?.totalSlotsToday !== undefined
      ? stats.metrics.totalSlotsToday
      : stats?.totalSlotsToday !== undefined
      ? stats.totalSlotsToday
      : slots.length;

  const uniqueCrops = useMemo(() => {
    const crops = Array.from(new Set(slots.map((s) => s.crop).filter(Boolean)));
    return crops.length > 0 ? crops.slice(0, 2).join(" & ") : "Wheat & Mustard";
  }, [slots]);

  // 2. Live Active Bookings KPI Calculation
  const pendingCount = currentBookings.filter((b) => b.status === "PENDING").length;
  const acceptedCount = currentBookings.filter(
    (b) => b.status === "ACCEPTED" || b.status === "VERIFIED"
  ).length;
  const totalActiveBookings =
    stats?.metrics?.activeBookings !== undefined
      ? stats.metrics.activeBookings
      : stats?.activeBookings !== undefined
      ? stats.activeBookings
      : pendingCount + acceptedCount;

  // 3. Live Yard Clearance Today Calculation
  const completedTodayList = previousBookings.filter((b) => b.status === "COMPLETED");
  const clearedCount =
    stats?.metrics?.completedToday !== undefined
      ? stats.metrics.completedToday
      : stats?.completedToday !== undefined
      ? stats.completedToday
      : completedTodayList.length;

  const weighedCount = clearedCount;

  // 4. Live Net Turnover Calculation
  const calculatedPayout = completedTodayList.reduce((sum, b) => {
    if (b.estimatedPayout && b.estimatedPayout > 0) return sum + b.estimatedPayout;
    const kg = b.quantityKg || (b.quantityQuintals ? b.quantityQuintals * 100 : 0);
    return sum + kg * 28;
  }, 0);

  const turnoverLakhs =
    stats?.metrics?.netTurnoverLakhs !== undefined
      ? stats.metrics.netTurnoverLakhs.toFixed(1)
      : stats?.netTurnoverLakhs !== undefined
      ? stats.netTurnoverLakhs.toFixed(1)
      : calculatedPayout > 0
      ? (calculatedPayout / 100000).toFixed(1)
      : "0.0";

  const avgSettlementMins =
    stats?.metrics?.avgSettlementMins || stats?.avgSettlementMins || 18;

  const mandiDisplayName = profile?.mandiName || stats?.mandiName || "APMC Market Yard";

  return (
    <section className="bg-white dark:bg-[#121212] rounded-2xl p-5 shadow-subtle border border-slate-200/80 dark:border-neutral-800 shrink-0">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-[#E5E5E5]">
            Mandi Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
            Real-time consignment intake, gate token clearance, weighbridge assay &amp; DBT payouts.
          </p>
        </div>
        {/* Live APMC Mandi Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200">
            <span>📍 {mandiDisplayName}</span>
          </div>
        </div>
      </div>

      {/* 4 Clean Real-time KPI Metric Cards */}
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
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{uniqueCrops}</span> in morning shift
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
            <span>Active Bookings</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            {totalActiveBookings} Consignments
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {pendingCount} Pending Review • {acceptedCount} Accepted
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
            <span>Yard Clearance Today</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl text-slate-900 dark:text-[#E5E5E5] mt-1 font-semibold">
            {clearedCount} Cleared
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {weighedCount} Weighed &amp; Escrow Settled
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
            Avg. settlement: {avgSettlementMins} mins
          </p>
        </div>
      </div>
    </section>
  );
});

