import React, { useState, useEffect } from "react";
import { Calendar, Clock, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { updateWeeklyScheduleThunk } from "../../store/slices/mandiSlice";
import { DayOfWeek } from "../../interfaces";

const ALL_DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function MandiOperatingScheduleCard() {
  const dispatch = useAppDispatch();
  const { profile, isActionLoading } = useAppSelector((state) => state.mandi);

  const [closedDays, setClosedDays] = useState<string[]>(["Sunday"]);
  const [closedHours, setClosedHours] = useState<string>("20:00 - 06:00");
  const [operatingHours, setOperatingHours] = useState<string>("09:00 AM - 05:00 PM");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.closedDays) setClosedDays(profile.closedDays);
      if (profile.closedHours) setClosedHours(profile.closedHours);
      if (profile.operatingHours) setOperatingHours(profile.operatingHours);
    }
  }, [profile]);

  const toggleClosedDay = (day: string) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter((d) => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const handleSaveSchedule = async () => {
    setFeedback(null);
    try {
      await dispatch(
        updateWeeklyScheduleThunk({
          closedDays,
          closedHours,
          operatingHours,
        })
      ).unwrap();
      setFeedback({
        type: "success",
        text: "Operating calendar and closed hours saved successfully!",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err || "Failed to save schedule",
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-[#E5E5E5]">
              Yard Operating Calendar &amp; Closed Rules
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium">
              Configure weekly closed days and overnight gate closure timing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={isActionLoading}
          className="btn-primary-green flex items-center gap-2 px-4 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Calendar Rules</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="space-y-4 text-xs">
        {/* Weekly Closed Days */}
        <div>
          <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-2">
            Weekly Operating &amp; Closed Days:
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const isClosed = closedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleClosedDay(day)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    isClosed
                      ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {isClosed ? "✕ Closed on " : "✓ Open: "}
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating & Night Hours Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
              Standard Operating Hours
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 dark:text-neutral-500 shrink-0" />
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g. 09:00 AM - 05:00 PM"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
              Yard Night / Closed Hours
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 dark:text-neutral-500 shrink-0" />
              <input
                type="text"
                value={closedHours}
                onChange={(e) => setClosedHours(e.target.value)}
                placeholder="e.g. 20:00 - 06:00"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Arrival bookings will be locked out during these overnight hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
