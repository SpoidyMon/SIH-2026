import React, { useState } from "react";
import { Check, Calendar, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { completeMandiOnboardingThunk } from "../../store/slices/authSlice";
import { DayOfWeek, CreateSlotPayload } from "../../interfaces";
import { LocationData } from "./RegisterStep2Location";
import { TIME_OPTIONS, to24Hour, getNextDateForDay } from "../../utils/timeFormat";

const DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface RegisterStep3SlotsProps {
  email: string;
  locationData: LocationData;
  onCompleteOnboarding: () => void;
}

export function RegisterStep3Slots({
  email,
  locationData,
  onCompleteOnboarding,
}: RegisterStep3SlotsProps) {
  const dispatch = useAppDispatch();
  const { isLoading: isActionLoading } = useAppSelector((state) => state.auth);

  const [activeDays, setActiveDays] = useState<Record<DayOfWeek, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: false,
  });

  const [startTime, setStartTime] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [capacity, setCapacity] = useState(50000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const handleFinishOnboarding = async () => {
    setErrorMsg(null);
    const enabledDays = DAYS.filter((d) => activeDays[d]);

    if (enabledDays.length === 0) {
      setErrorMsg("Please enable at least one operating day for farmer intake.");
      return;
    }

    const closedDays = DAYS.filter((d) => !activeDays[d]);
    const slotsToGenerate: CreateSlotPayload[] = [];

    enabledDays.forEach((dayName) => {
      const slotDate = getNextDateForDay(dayName);
      slotsToGenerate.push({
        crop: "Wheat, Mustard, Soybean",
        allowedCrops: [
          { crop: "Wheat", isFixed: false },
          { crop: "Mustard", isFixed: false },
          { crop: "Soybean", isFixed: false },
        ],
        date: slotDate,
        startTime: to24Hour(startTime),
        endTime: to24Hour(endTime),
        totalCapacityQuintals: Number((capacity / 100).toFixed(1)),
        totalCapacityKg: Number(capacity),
        maxFarmers: 10,
        bufferMinutes: 15,
        bufferPercentage: 10,
      });
    });

    try {
      await dispatch(
        completeMandiOnboardingThunk({
          email: email.trim().toLowerCase(),
          address: locationData.address,
          pincode: locationData.pincode,
          district: locationData.district,
          state: locationData.state,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          operatingHours: `${startTime} - ${endTime}`,
          closedDays,
          closedHours: "20:00 - 06:00",
          capacity: Number(capacity),
          slots: slotsToGenerate,
        })
      ).unwrap();

      onCompleteOnboarding();
    } catch (err: any) {
      setErrorMsg(err || "Failed to initialize operating slots and complete onboarding.");
    }
  };


  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Weekly Operating Slots</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Step 3 of 3: Configure weekly intake schedule &amp; arrival capacity
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300/40 flex items-center justify-center text-emerald-800">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operating Hours & Capacity bar */}
      <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Open Time</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Close Time</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Intake Capacity (in KG)</label>
          <input
            type="number"
            step="1000"
            min="1000"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>
      </div>

      {/* 7 Days of the Week List */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Select Operating Days (Turn On / Off)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DAYS.map((day) => {
            const isEnabled = activeDays[day];
            return (
              <div
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
                  isEnabled
                    ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                    : "bg-slate-50/50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition ${
                      isEnabled ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                    }`}
                  >
                    {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold">{day}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {isEnabled ? "Open" : "Closed"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleFinishOnboarding}
        disabled={isActionLoading}
        className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
      >
        {isActionLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Complete Setup &amp; Launch Mandi Portal</span>
          </>
        )}
      </button>
    </div>
  );
}
