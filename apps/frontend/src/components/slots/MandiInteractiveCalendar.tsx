import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  Ban,
  X,
  Check,
} from "lucide-react";
import { MandiSlot } from "../../interfaces";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeMandiDateThunk } from "../../store/slices/mandiSlice";

interface MandiInteractiveCalendarProps {
  slots: MandiSlot[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenCreateModalForDate: (date: string) => void;
  closedDays?: string[];
  closedHours?: string | null;
}

export function MandiInteractiveCalendar({
  slots,
  selectedDate,
  onSelectDate,
  onOpenCreateModalForDate,
  closedDays = [],
  closedHours,
}: MandiInteractiveCalendarProps) {
  const dispatch = useAppDispatch();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("Administrative / Mandi Yard Holiday");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Current view year & month state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = today.toISOString().split("T")[0];
    onSelectDate(todayStr);
  };

  const handleConfirmCloseDate = async () => {
    if (!selectedDate) return;
    setIsSubmittingClose(true);
    try {
      await dispatch(closeMandiDateThunk({ date: selectedDate, reason: closeReason })).unwrap();
      setShowCloseModal(false);
    } catch (err) {
      console.error("Failed to close mandi for date", err);
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const monthName = currentMonthDate.toLocaleString("en-US", { month: "long" });

  // Map slots by date string "YYYY-MM-DD"
  const slotsByDate = useMemo(() => {
    const map: Record<string, MandiSlot[]> = {};
    slots.forEach((s) => {
      const d = s.slotDate || s.date;
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(s);
      }
    });
    return map;
  }, [slots]);

  // Generate matrix for calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayName: string;
      isClosed: boolean;
      slots: MandiSlot[];
    }> = [];

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, prevDayNum);
      const dStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDayNum).padStart(2, "0")}`;
      const dName = dayNames[prevDate.getDay()];
      days.push({
        dateStr: dStr,
        dayNumber: prevDayNum,
        isCurrentMonth: false,
        dayName: dName,
        isClosed: closedDays.includes(dName),
        slots: slotsByDate[dStr] || [],
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const curDate = new Date(year, month, dayNum);
      const dName = dayNames[curDate.getDay()];
      days.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        dayName: dName,
        isClosed: closedDays.includes(dName),
        slots: slotsByDate[dStr] || [],
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let nextDayNum = 1; nextDayNum <= remaining; nextDayNum++) {
      const nextDate = new Date(year, month + 1, nextDayNum);
      const dStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDayNum).padStart(2, "0")}`;
      const dName = dayNames[nextDate.getDay()];
      days.push({
        dateStr: dStr,
        dayNumber: nextDayNum,
        isCurrentMonth: false,
        dayName: dName,
        isClosed: closedDays.includes(dName),
        slots: slotsByDate[dStr] || [],
      });
    }

    return days;
  }, [year, month, closedDays, slotsByDate]);

  return (
    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Calendar Header */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#E5E5E5] flex items-center gap-2">
              <span>{monthName} {year}</span>
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium">
              Click any date to inspect booked arrivals in KG, capacity, or schedule custom windows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {selectedDate && (
            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Mark {selectedDate} Closed</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 rounded-xl transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-neutral-800/80 bg-gray-50/70 dark:bg-neutral-900/50 text-center py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Days Matrix */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-neutral-800/60 bg-gray-100/30 dark:bg-black">
        {calendarDays.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const hasSlots = cell.slots.length > 0;
          const totalCapacityKg = cell.slots.reduce((acc, s) => acc + (s.totalCapacityKg || ((s.maxCapacityQuintals || s.totalCapacityQuintals || 0) * 100)), 0);
          const totalBookedKg = cell.slots.reduce((acc, s) => acc + (s.bookedCapacityKg || ((s.bookedCapacityQuintals || 0) * 100)), 0);
          const totalFarmers = cell.slots.reduce((acc, s) => acc + (s.currentFarmersBooked ?? s.bookedFarmers ?? 0), 0);

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                !cell.isCurrentMonth
                  ? "opacity-35 bg-gray-50/40 dark:bg-neutral-950/40"
                  : isSelected
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500 dark:ring-emerald-400 z-10"
                  : cell.isClosed
                  ? "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40"
                  : "bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-neutral-900/70"
              }`}
            >
              {/* Day Number and Status Badge */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : cell.isCurrentMonth
                      ? "text-gray-900 dark:text-[#E5E5E5]"
                      : "text-gray-400 dark:text-neutral-600"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cell.isClosed ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    Closed
                  </span>
                ) : hasSlots ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {cell.slots.length} {cell.slots.length === 1 ? "Slot" : "Slots"}
                  </span>
                ) : null}
              </div>

              {/* Slot Details inside Day Cell */}
              <div className="my-1 space-y-1">
                {hasSlots ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-gray-800 dark:text-[#E5E5E5] truncate">
                      {cell.slots.map((s) => s.crop).join(", ")}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                      <span>📦 {totalBookedKg.toLocaleString("en-IN")}/{totalCapacityKg.toLocaleString("en-IN")} KG</span>
                      <span>•</span>
                      <span>👨‍🌾 {totalFarmers}</span>
                    </div>
                    {/* Utilization mini progress bar */}
                    {totalCapacityKg > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (totalBookedKg / totalCapacityKg) > 0.8
                              ? "bg-red-500"
                              : "bg-[#10B981]"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((totalBookedKg / totalCapacityKg) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : !cell.isClosed && cell.isCurrentMonth ? (
                  <span className="text-[10px] text-gray-300 dark:text-neutral-700 font-medium italic hidden group-hover:inline-block">
                    No slots scheduled
                  </span>
                ) : null}
              </div>

              {/* Hover Quick Action */}
              <div className="flex items-center justify-end pt-1">
                {!cell.isClosed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreateModalForDate(cell.dateStr);
                    }}
                    title={`Add arrival slot on ${cell.dateStr}`}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 p-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Slot</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Bottom Legend */}
      <div className="px-6 py-3 bg-gray-50/80 dark:bg-[#171717] border-t border-gray-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-neutral-400">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Open Yard / Active Slots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Closed Day</span>
          </div>
          {closedHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Night Gate Closure: {closedHours}</span>
            </div>
          )}
        </div>

        {selectedDate && (
          <span className="text-[11px] font-bold text-gray-800 dark:text-[#E5E5E5]">
            Selected: <strong className="text-emerald-600 dark:text-emerald-400">{selectedDate}</strong>
          </span>
        )}
      </div>

      {/* Mark Day as Mandi Closed Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900 dark:text-[#E5E5E5]">
                  Mark Mandi Closed on {selectedDate}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
              Marking this date as closed will deactivate all arrival slot windows for <strong>{selectedDate}</strong>, automatically cancel pending bookings for this date, and notify farmers that the Mandi yard is not accepting consignments.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                Closure Reason / Notice for Farmers:
              </label>
              <textarea
                rows={2}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g. Yard sanitation / Public holiday / Weighbridge maintenance"
                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-xs text-gray-900 dark:text-[#E5E5E5] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingClose}
                onClick={handleConfirmCloseDate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingClose ? "Closing Date..." : "Confirm Close Day"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
