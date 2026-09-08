import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Check,
  Settings2,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Save,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  batchCreateSlotsThunk,
  updateWeeklyScheduleThunk,
} from "../../store/slices/mandiSlice";
import {
  DayOfWeek,
  DayMandiConfig,
  CreateSlotPayload,
  CustomSlotItem,
} from "../../interfaces";
import {
  getNextDateForDay,
} from "../../utils/timeFormat";
import { DaySlotManagementModal } from "./DaySlotManagementModal";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_CROPS = ["Wheat", "Mustard", "Soybean", "Tomato", "Onion"];

export function MandiWeeklyAvailability() {
  const dispatch = useAppDispatch();
  const { profile, commodities, isActionLoading } = useAppSelector((state) => state.mandi);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active managing day for modal
  const [managingDay, setManagingDay] = useState<DayOfWeek | null>(null);
  const [defaultInstructions, setDefaultInstructions] = useState<string>(
    "Gate pass verification required. Bring produce in standard bags. Moisture assay at Gate 2."
  );

  // Available crop options from backend commodities or defaults
  const availableCrops = useMemo(() => {
    if (commodities && commodities.length > 0) {
      return commodities.map((c) => c.name);
    }
    return DEFAULT_CROPS;
  }, [commodities]);

  // Initial days schedule state with customSlots
  const [schedule, setSchedule] = useState<Record<DayOfWeek, DayMandiConfig>>(() => {
    const closedDays = profile?.closedDays || ["Sunday"];
    const initial: Record<string, DayMandiConfig> = {};

    DAYS_OF_WEEK.forEach((day) => {
      const isClosed = closedDays.includes(day);
      const defaultSlots: CustomSlotItem[] = [
        {
          id: `slot-${day}-1`,
          name: "Slot 1 (Morning Shift)",
          startTime: "09:00",
          endTime: "13:30",
          maxFarmers: 15,
          crops: [
            { crop: "Wheat", quantityKg: 5000, ratePerKg: 28 },
            { crop: "Mustard", quantityKg: 3000, ratePerKg: 54 },
          ],
          instructions: "Entry through Gate 2. Standard moisture test required.",
        },
        {
          id: `slot-${day}-2`,
          name: "Slot 2 (Afternoon Shift)",
          startTime: "14:00",
          endTime: "17:30",
          maxFarmers: 10,
          crops: [
            { crop: "Wheat", quantityKg: 3000, ratePerKg: 28 },
            { crop: "Soybean", quantityKg: 2000, ratePerKg: 46 },
          ],
          instructions: "Entry through Gate 2. Standard moisture test required.",
        },
      ];

      const totalKg = defaultSlots.reduce(
        (sum, s) => sum + s.crops.reduce((cSum, c) => cSum + (c.quantityKg || 0), 0),
        0
      );

      initial[day] = {
        day,
        enabled: !isClosed,
        startTime: "09:00",
        endTime: day === "Saturday" ? "18:30" : "17:30",
        capacityQuintals: Math.round(totalKg / 100),
        totalCapacityKg: totalKg,
        maxFarmers: 25,
        bufferMinutes: 15,
        bufferPercentage: 10,
        selectedCrops: ["Wheat", "Mustard", "Soybean"],
        customSlots: defaultSlots,
        defaultInstructions: "Entry through Gate 2. Standard moisture test required.",
        isExpanded: false,
      };
    });

    return initial as Record<DayOfWeek, DayMandiConfig>;
  });

  // Synchronize when profile closedDays loads
  useEffect(() => {
    if (profile?.closedDays) {
      setSchedule((prev) => {
        const updated = { ...prev };
        DAYS_OF_WEEK.forEach((day) => {
          const isClosed = profile.closedDays?.includes(day);
          if (updated[day]) {
            updated[day] = {
              ...updated[day],
              enabled: !isClosed,
            };
          }
        });
        return updated;
      });
    }
  }, [profile?.closedDays]);

  const toggleDayEnabled = useCallback((day: DayOfWeek) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  }, []);

  const handleSaveDayConfig = useCallback(
    (dayToUpdate: DayOfWeek, updatedConfig: DayMandiConfig, saveAsDefault?: boolean) => {
      setSchedule((prev) => ({
        ...prev,
        [dayToUpdate]: updatedConfig,
      }));

      if (saveAsDefault && updatedConfig.defaultInstructions) {
        setDefaultInstructions(updatedConfig.defaultInstructions);
      }

      setSuccessMessage(`Updated custom arrival slots for ${dayToUpdate}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    },
    []
  );

  const handleApplyToAllDays = useCallback(
    (sourceDay: DayOfWeek) => {
      const source = schedule[sourceDay];
      setSchedule((prev) => {
        const updated = { ...prev };
        DAYS_OF_WEEK.forEach((day) => {
          if (updated[day].enabled) {
            updated[day] = {
              ...updated[day],
              customSlots: JSON.parse(JSON.stringify(source.customSlots || [])),
              capacityQuintals: source.capacityQuintals,
              totalCapacityKg: source.totalCapacityKg,
              maxFarmers: source.maxFarmers,
              defaultInstructions: source.defaultInstructions,
            };
          }
        });
        return updated;
      });

      setSuccessMessage(`Applied ${sourceDay}'s custom slots to all active operating days.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    },
    [schedule]
  );

  // Handle saving weekly profile schedule (closedDays & operatingHours)
  const handleSaveWeeklySchedule = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const closedDays = DAYS_OF_WEEK.filter((day) => !schedule[day].enabled);
    const activeDays = DAYS_OF_WEEK.filter((day) => schedule[day].enabled);

    const sampleActiveDay = activeDays[0] ? schedule[activeDays[0]] : null;
    const operatingHours = sampleActiveDay
      ? `${sampleActiveDay.startTime} - ${sampleActiveDay.endTime}`
      : "09:00 AM - 05:00 PM";

    try {
      await dispatch(
        updateWeeklyScheduleThunk({
          closedDays,
          operatingHours,
        })
      ).unwrap();

      setSuccessMessage("Weekly operating schedule and closed days saved successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err || "Failed to update weekly schedule");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Handle batch generating slots for the next 7 days in the database
  const handleGenerateNext7DaysSlots = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const activeDays = DAYS_OF_WEEK.filter((day) => schedule[day].enabled);
    if (activeDays.length === 0) {
      setErrorMessage("Please enable at least one operating day to generate slots.");
      return;
    }

    const closedDays = DAYS_OF_WEEK.filter((day) => !schedule[day].enabled);
    const slotsToGenerate: CreateSlotPayload[] = [];

    activeDays.forEach((dayName) => {
      const dayConfig = schedule[dayName];
      const slotDate = getNextDateForDay(dayName);

      if (dayConfig.customSlots && dayConfig.customSlots.length > 0) {
        dayConfig.customSlots.forEach((cSlot) => {
          const mainCrop = cSlot.crops.map((c) => c.crop).join(", ") || "Agricultural Produce";
          const slotTotalKg = cSlot.crops.reduce((acc, c) => acc + (c.quantityKg || 0), 0);
          const allowedCrops = cSlot.crops.map((c) => ({
            crop: c.crop,
            quantityKg: c.quantityKg,
            ratePerKg: c.ratePerKg,
            isFixed: false,
          }));

          slotsToGenerate.push({
            crop: mainCrop,
            allowedCrops,
            instructions: cSlot.instructions || dayConfig.defaultInstructions,
            date: slotDate,
            startTime: cSlot.startTime,
            endTime: cSlot.endTime,
            totalCapacityQuintals: Math.round(slotTotalKg / 100),
            totalCapacityKg: slotTotalKg,
            maxFarmers: Number(cSlot.maxFarmers) || 10,
            bufferMinutes: 15,
            bufferPercentage: 10,
          });
        });
      } else {
        // Fallback default
        slotsToGenerate.push({
          crop: "Wheat, Mustard",
          date: slotDate,
          startTime: "09:00",
          endTime: "13:30",
          totalCapacityQuintals: 50,
          totalCapacityKg: 5000,
          maxFarmers: 15,
          bufferMinutes: 15,
          bufferPercentage: 10,
        });
      }
    });

    try {
      const result = await dispatch(
        batchCreateSlotsThunk({
          slots: slotsToGenerate,
          closedDays,
          closedHours: "20:00 - 06:00",
        })
      ).unwrap();

      setSuccessMessage(
        `Generated ${result.length || slotsToGenerate.length} live arrival slots for the upcoming 7 days across calendar!`
      );
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err: any) {
      setErrorMessage(err || "Failed to generate live arrival slots");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* ═══ TOP HEADER ═══ */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-neutral-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-[#E5E5E5] uppercase">
            WEEKLY ARRIVAL AVAILABILITY
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
            Select operating days and click <strong>Manage</strong> to configure custom arrival slots, crops, intake limits in KG, and rates.
          </p>
        </div>
      </div>

      {/* ═══ NOTIFICATION BANNERS ═══ */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ═══ DAYS OF THE WEEK TABLE ═══ */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800/60 px-6 py-2">
        {DAYS_OF_WEEK.map((day) => {
          const config = schedule[day];
          const isEnabled = config.enabled;
          const slotsCount = config.customSlots?.length || 1;
          const totalKg = config.customSlots
            ? config.customSlots.reduce((sum, s) => sum + s.crops.reduce((cSum, c) => cSum + (c.quantityKg || 0), 0), 0)
            : (config.totalCapacityKg || config.capacityQuintals * 100);

          return (
            <div key={day} className="py-4 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* 1. Checkbox + Day Name */}
                <div className="flex items-center gap-3.5 w-44 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleDayEnabled(day)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      isEnabled
                        ? "bg-[#10B981] hover:bg-[#059669] text-white shadow-xs"
                        : "border border-gray-300 dark:border-neutral-700 bg-white dark:bg-black hover:border-gray-400"
                    }`}
                    aria-label={`Toggle ${day}`}
                  >
                    {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <span
                    onClick={() => toggleDayEnabled(day)}
                    className={`text-sm font-bold cursor-pointer select-none transition-colors ${
                      isEnabled
                        ? "text-gray-900 dark:text-[#E5E5E5]"
                        : "text-gray-500 dark:text-neutral-500"
                    }`}
                  >
                    {day}
                  </span>
                </div>

                {/* 2. Slots Summary Pill or Unavailable text */}
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  {isEnabled ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {config.customSlots && config.customSlots.length > 0 ? (
                        config.customSlots.map((s, idx) => (
                          <span
                            key={s.id}
                            className="px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-medium text-[11px]"
                          >
                            <strong>Slot {idx + 1}</strong>: {s.startTime}-{s.endTime} ({s.crops.map((c) => `${c.crop} ${c.quantityKg}kg`).join(", ")})
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 dark:text-neutral-400 font-medium">
                          09:00 - 17:30 • {totalKg.toLocaleString()} KG Intake
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="italic text-gray-400 dark:text-neutral-500 text-xs font-medium">
                      Mandi Closed / Unavailable
                    </span>
                  )}
                </div>

                {/* 3. Manage Button */}
                {isEnabled && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManagingDay(day)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Manage ({slotsCount} {slotsCount === 1 ? "Slot" : "Slots"})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ ACTIONS FOOTER ═══ */}
      <div className="px-6 py-4 bg-gray-50/80 dark:bg-[#171717] border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 font-medium">
          <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {DAYS_OF_WEEK.filter((d) => schedule[d].enabled).length} days active for farmer bookings
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Save Weekly Profile Schedule */}
          <button
            type="button"
            onClick={handleSaveWeeklySchedule}
            disabled={isActionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-800 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Weekly Schedule</span>
          </button>

          {/* Batch Generate Live Slots for Upcoming 7 Days */}
          <button
            type="button"
            onClick={handleGenerateNext7DaysSlots}
            disabled={isActionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Next 7 Days Slots</span>
          </button>
        </div>
      </div>

      {/* ═══ MANAGE SLOTS MODAL ═══ */}
      {managingDay && (
        <DaySlotManagementModal
          isOpen={Boolean(managingDay)}
          day={managingDay}
          config={schedule[managingDay]}
          availableCommodities={availableCrops}
          defaultInstructions={defaultInstructions}
          onClose={() => setManagingDay(null)}
          onSaveDayConfig={handleSaveDayConfig}
          onApplyToAllDays={handleApplyToAllDays}
        />
      )}
    </div>
  );
}

