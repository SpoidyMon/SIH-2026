import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Globe,
  Check,
  ChevronDown,
  ChevronUp,
  Settings2,
  Copy,
  Sparkles,
  Layers,
  Save,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
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
} from "../../interfaces";
import {
  TIME_OPTIONS,
  TIMEZONES,
  to24Hour,
  to12Hour,
  getNextDateForDay,
} from "../../utils/timeFormat";

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

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available crop options from backend commodities or defaults
  const availableCrops = useMemo(() => {
    if (commodities && commodities.length > 0) {
      return commodities.map((c) => c.name);
    }
    return DEFAULT_CROPS;
  }, [commodities]);

  // Initial days schedule state
  const [schedule, setSchedule] = useState<Record<DayOfWeek, DayMandiConfig>>(() => {
    const closedDays = profile?.closedDays || ["Sunday"];
    const initial: Record<string, DayMandiConfig> = {};

    DAYS_OF_WEEK.forEach((day) => {
      const isClosed = closedDays.includes(day);
      initial[day] = {
        day,
        enabled: !isClosed,
        startTime: "9:00 AM",
        endTime: day === "Saturday" ? "6:30 PM" : "5:00 PM",
        capacityQuintals: 500,
        maxFarmers: 10,
        bufferMinutes: 15,
        bufferPercentage: 10,
        selectedCrops: ["Wheat", "Mustard", "Soybean"],
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

  const updateDayTime = useCallback(
    (day: DayOfWeek, field: "startTime" | "endTime", value: string) => {
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
        },
      }));
    },
    []
  );

  const toggleDayExpanded = useCallback((day: DayOfWeek) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isExpanded: !prev[day].isExpanded,
      },
    }));
  }, []);

  const updateDayMandiOptions = useCallback(
    (day: DayOfWeek, updates: Partial<DayMandiConfig>) => {
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          ...updates,
        },
      }));
    },
    []
  );

  const toggleCropSelection = useCallback((day: DayOfWeek, cropName: string) => {
    setSchedule((prev) => {
      const current = prev[day].selectedCrops;
      const exists = current.includes(cropName);
      const nextCrops = exists
        ? current.filter((c) => c !== cropName)
        : [...current, cropName];

      return {
        ...prev,
        [day]: {
          ...prev[day],
          selectedCrops: nextCrops.length > 0 ? nextCrops : [cropName],
        },
      };
    });
  }, []);

  const copyDaySettingsToAll = useCallback((sourceDay: DayOfWeek) => {
    const source = schedule[sourceDay];
    setSchedule((prev) => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach((day) => {
        if (updated[day].enabled) {
          updated[day] = {
            ...updated[day],
            startTime: source.startTime,
            endTime: source.endTime,
            capacityQuintals: source.capacityQuintals,
            maxFarmers: source.maxFarmers,
            bufferMinutes: source.bufferMinutes,
            bufferPercentage: source.bufferPercentage,
            selectedCrops: [...source.selectedCrops],
          };
        }
      });
      return updated;
    });

    setSuccessMessage(`Applied ${sourceDay}'s settings to all active operating days.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  }, [schedule]);

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

      setSuccessMessage("Weekly operating schedule and closed days updated successfully!");
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
      const mainCrop = dayConfig.selectedCrops.join(", ") || "Mixed Commodities";

      const allowedCrops = dayConfig.selectedCrops.map((c) => ({
        crop: c,
        quantityQuintals: undefined,
        isFixed: false,
      }));

      slotsToGenerate.push({
        crop: mainCrop,
        allowedCrops,
        date: slotDate,
        startTime: to24Hour(dayConfig.startTime),
        endTime: to24Hour(dayConfig.endTime),
        totalCapacityQuintals: Number(dayConfig.capacityQuintals),
        maxFarmers: Number(dayConfig.maxFarmers),
        bufferMinutes: Number(dayConfig.bufferMinutes),
        bufferPercentage: Number(dayConfig.bufferPercentage),
      });
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
        `Generated ${result.length || slotsToGenerate.length} live arrival slots for the upcoming 7 days!`
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
            AVAILABILITY
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
            Select days and time slots when you're open for bookings.
          </p>
        </div>

        {/* Timezone Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-gray-400 dark:text-neutral-500 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">Timezone:</span>
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="appearance-none bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-full pl-3 pr-8 py-1.5 text-xs font-bold text-gray-800 dark:text-neutral-200 focus:outline-none focus:border-[#5CE65C] cursor-pointer shadow-2xs"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
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

      {/* ═══ DAYS OF THE WEEK LIST ═══ */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800/60 px-6 py-2">
        {DAYS_OF_WEEK.map((day) => {
          const config = schedule[day];
          const isEnabled = config.enabled;

          return (
            <div key={day} className="py-4 transition-colors">
              {/* Row: Checkbox + Day + Hours / Unavailable + Mandi Options Pill */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Checkbox + Day Label */}
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

                {/* Middle: Hours or Unavailable text */}
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  {isEnabled ? (
                    <>
                      {/* Start Time Select */}
                      <div className="relative">
                        <select
                          value={config.startTime}
                          onChange={(e) => updateDayTime(day, "startTime", e.target.value)}
                          className="appearance-none bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-700 rounded-full pl-4 pr-8 py-1.5 text-xs font-bold text-gray-800 dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C] cursor-pointer shadow-2xs hover:border-gray-300"
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium px-1">
                        to
                      </span>

                      {/* End Time Select */}
                      <div className="relative">
                        <select
                          value={config.endTime}
                          onChange={(e) => updateDayTime(day, "endTime", e.target.value)}
                          className="appearance-none bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-700 rounded-full pl-4 pr-8 py-1.5 text-xs font-bold text-gray-800 dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C] cursor-pointer shadow-2xs hover:border-gray-300"
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Mandi Options Summary Pill */}
                      <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-900/80 px-3 py-1 rounded-full border border-gray-100 dark:border-neutral-800">
                        <span>🌾 {config.selectedCrops.length} Crops</span>
                        <span>•</span>
                        <span>📦 {config.capacityQuintals} Qtl</span>
                        <span>•</span>
                        <span>👨‍🌾 {config.maxFarmers} Farmers</span>
                        <span>•</span>
                        <span>⏱️ {config.bufferMinutes}m</span>
                      </div>
                    </>
                  ) : (
                    <span className="italic text-gray-400 dark:text-neutral-500 text-xs font-medium">
                      Unavailable
                    </span>
                  )}
                </div>

                {/* Right: Mandi Options Expand Toggle (when enabled) */}
                {isEnabled && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(day)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Mandi Options</span>
                      {config.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ═══ EXPANDED MANDI OPTIONS DRAWER ═══ */}
              {isEnabled && config.isExpanded && (
                <div className="mt-3.5 p-4 bg-gray-50/90 dark:bg-[#161616] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-4 animate-fade-in text-xs">
                  {/* Row 1: Crop Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800 dark:text-[#E5E5E5] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Accepted Intake Commodities ({day})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateDayMandiOptions(day, {
                            selectedCrops: [...availableCrops],
                          })
                        }
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Select All Commodities
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {availableCrops.map((cropName) => {
                        const isSelected = config.selectedCrops.includes(cropName);
                        return (
                          <button
                            key={cropName}
                            type="button"
                            onClick={() => toggleCropSelection(day, cropName)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs"
                                : "bg-white dark:bg-black text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-800 hover:border-gray-300"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {cropName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: Capacity, Farmers & Weighbridge parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200/60 dark:border-neutral-800">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-400 mb-1">
                        Intake Capacity (Qtl)
                      </label>
                      <input
                        type="number"
                        min="10"
                        step="50"
                        value={config.capacityQuintals}
                        onChange={(e) =>
                          updateDayMandiOptions(day, {
                            capacityQuintals: Math.max(10, Number(e.target.value)),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-gray-800 dark:text-[#E5E5E5]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-400 mb-1">
                        Max Farmers / Yard
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={config.maxFarmers}
                        onChange={(e) =>
                          updateDayMandiOptions(day, {
                            maxFarmers: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-gray-800 dark:text-[#E5E5E5]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-400 mb-1">
                        Buffer Window (Mins)
                      </label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={config.bufferMinutes}
                        onChange={(e) =>
                          updateDayMandiOptions(day, {
                            bufferMinutes: Math.max(5, Number(e.target.value)),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-gray-800 dark:text-[#E5E5E5]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-400 mb-1">
                        Tolerance Margin (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={config.bufferPercentage}
                        onChange={(e) =>
                          updateDayMandiOptions(day, {
                            bufferPercentage: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-gray-800 dark:text-[#E5E5E5]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Helper Action */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => copyDaySettingsToAll(day)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy {day}'s commodities &amp; limits to all open days</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(day)}
                      className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ ACTIONS FOOTER ═══ */}
      <div className="px-6 py-4 bg-gray-50/80 dark:bg-[#171717] border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
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
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-700 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Weekly Schedule</span>
          </button>

          {/* Batch Generate Live Slots for Upcoming 7 Days */}
          <button
            type="button"
            onClick={handleGenerateNext7DaysSlots}
            disabled={isActionLoading}
            className="btn-primary-green flex items-center gap-2 px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Next 7 Days Slots</span>
          </button>
        </div>
      </div>
    </div>
  );
}
