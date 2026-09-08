import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Check,
  AlertCircle,
  Calendar,
  ChevronLeft,
  Sprout,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { getApprovedMandisApi, createFarmerBookingApi } from "../../services/farmer.api";
import { FarmerMandiSummary, CropBookingItem } from "../../interfaces/farmer.interface";

function isSlotExpired(dateStr?: string, endTimeStr?: string, startTimeStr?: string): boolean {
  if (!dateStr) return false;

  const now = new Date();
  let targetDate = new Date();
  const dLower = dateStr.trim().toLowerCase();
  if (dLower === "today") {
    // keep current date
  } else if (dLower === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  if (slotDateOnly < todayOnly) return true;
  if (slotDateOnly > todayOnly) return false;

  const timeToCheck = endTimeStr || startTimeStr;
  if (!timeToCheck) return false;

  let hours = 0;
  let minutes = 0;
  const match = timeToCheck.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  const slotEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  return now.getTime() > slotEndTime.getTime();
}

export function FarmerMandiDetailView() {
  const { mandiId } = useParams<{ mandiId: string }>();
  const navigate = useNavigate();

  const [mandi, setMandi] = useState<FarmerMandiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedCrops, setSelectedCrops] = useState<CropBookingItem[]>([
    { crop: "Tomato", quantityKg: 100, ratePerKg: 24, estimatedAmount: 2400 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadMandiDetails() {
      setIsLoading(true);
      try {
        const mandis = await getApprovedMandisApi();
        const found = mandis.find((m) => m.id === mandiId);
        if (found) {
          setMandi(found);
          if (found.slots && found.slots.length > 0) {
            const validSlot = found.slots.find(
              (s) => !s.isExpired && !isSlotExpired(s.date, s.endTime, s.startTime)
            );
            setSelectedSlotId(validSlot ? validSlot.id : found.slots[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load mandi detail", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMandiDetails();
  }, [mandiId]);

  const availableCropRates: Record<string, number> = {
    Tomato: 24,
    Wheat: 28,
    Mustard: 52,
    Onion: 19,
    Potato: 22,
  };

  const selectedSlot = mandi?.slots?.find((s) => s.id === selectedSlotId);

  // Compute crops strictly available for the selected slot
  const slotAvailableCrops = useMemo(() => {
    if (!selectedSlot) return (mandi?.acceptedCrops || ["Wheat", "Mustard"]).map((c) => ({ crop: c, ratePerKg: availableCropRates[c] || 25 }));

    const list: Array<{ crop: string; ratePerKg: number }> = [];
    if (selectedSlot.allowedCrops && Array.isArray(selectedSlot.allowedCrops)) {
      (selectedSlot.allowedCrops as any[]).forEach((item) => {
        if (item?.crop) {
          list.push({
            crop: item.crop,
            ratePerKg: Number(item.ratePerKg) || availableCropRates[item.crop] || 25,
          });
        }
      });
    } else if (selectedSlot.crop) {
      selectedSlot.crop.split(",").forEach((c) => {
        const name = c.trim();
        list.push({
          crop: name,
          ratePerKg: availableCropRates[name] || 25,
        });
      });
    }

    if (list.length === 0) {
      return (mandi?.acceptedCrops || ["Wheat", "Mustard"]).map((c) => ({
        crop: c,
        ratePerKg: availableCropRates[c] || 25,
      }));
    }

    return list;
  }, [selectedSlot, mandi]);

  // Sync selected crops when slot changes
  useEffect(() => {
    if (slotAvailableCrops.length > 0) {
      const firstCrop = slotAvailableCrops[0];
      setSelectedCrops([
        {
          crop: firstCrop.crop,
          quantityKg: 100,
          ratePerKg: firstCrop.ratePerKg,
          estimatedAmount: 100 * firstCrop.ratePerKg,
        },
      ]);
    }
  }, [selectedSlotId]);

  const handleAddCropRow = () => {
    const defaultCrop = slotAvailableCrops[0] || { crop: "Wheat", ratePerKg: 28 };
    setSelectedCrops((prev) => [
      ...prev,
      { crop: defaultCrop.crop, quantityKg: 100, ratePerKg: defaultCrop.ratePerKg, estimatedAmount: 100 * defaultCrop.ratePerKg },
    ]);
  };

  const handleRemoveCropRow = (index: number) => {
    if (selectedCrops.length <= 1) return;
    setSelectedCrops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCropRow = (index: number, field: keyof CropBookingItem, value: any) => {
    setSelectedCrops((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (field === "crop") {
        const found = slotAvailableCrops.find((c) => c.crop === value);
        current.ratePerKg = found ? found.ratePerKg : availableCropRates[value] || 25;
      }
      if (field === "quantityKg" || field === "crop") {
        const qty = Number(current.quantityKg) || 0;
        const rate = current.ratePerKg || 25;
        current.estimatedAmount = qty * rate;
      }

      updated[index] = current;
      return updated;
    });
  };

  const estimatedTotalValue = selectedCrops.reduce(
    (sum, c) => sum + (c.estimatedAmount || c.quantityKg * (c.ratePerKg || 25)),
    0
  );

  const handleSubmitBookingRequest = async () => {
    if (!selectedSlotId || !mandi) {
      setErrorMsg("Please select an available intake slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createFarmerBookingApi({
        mandiProfileId: mandi.id,
        slotId: selectedSlotId,
        cropsList: selectedCrops,
      });

      // Redirect to Farmer Bookings view
      navigate("/farmer/bookings");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit booking request.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (isLoading || !mandi) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs font-semibold">
        Loading Mandi details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/farmer/mandis")}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to All Mandis</span>
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  mandi.isOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {mandi.isOpen ? "Mandi Open for Intake" : "Mandi Closed"}
              </span>
              {mandi.distanceKm !== null && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
                  {mandi.distanceKm} km away from your location
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{mandi.name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {mandi.address}, {mandi.district}, {mandi.state} – {mandi.pincode}
              </span>
            </p>
          </div>
        </div>

        {/* Crop Rates Table (KG) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Official APMC Crop Rates &amp; Intake Limits
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Crop Name</th>
                  <th className="py-3 px-4 text-right">Official Rate (per KG)</th>
                  <th className="py-3 px-4 text-right">Intake Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(mandi.cropRates && mandi.cropRates.length > 0
                  ? mandi.cropRates
                  : mandi.acceptedCrops.map((c) => ({
                      crop: c,
                      ratePerKg: availableCropRates[c] || 25,
                      availableKg: 1000,
                    }))
                ).map((item) => (
                  <tr key={item.crop} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600" />
                      <span>{item.crop}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ₹{item.ratePerKg} / kg
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {item.availableKg.toLocaleString("en-IN")} KG / slot
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 1: Select Date & Slot */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>1. Select Date &amp; Intake Slot</span>
        </h2>

        {(() => {
          const activeSlots = (mandi.slots || []).filter(
            (slot) => !slot.isExpired && !isSlotExpired(slot.date, slot.endTime, slot.startTime)
          );

          if (activeSlots.length === 0) {
            return (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>All arrival slots for today have passed. Please check back for upcoming slots.</span>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSlots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                const isFull = slot.availableBookings <= 0;

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      if (!isFull) setSelectedSlotId(slot.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all select-none ${
                      isFull
                        ? "bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer"
                        : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">{slot.date}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isFull ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isFull ? "Fully Booked" : `${slot.availableBookings} slots left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Step 2: Multi-Crop Input (KG Only) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <span>2. Select Crops &amp; Quantity (in KG)</span>
          </h2>
          <button
            type="button"
            onClick={handleAddCropRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Crop</span>
          </button>
        </div>

        <div className="space-y-3">
          {selectedCrops.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Crop</label>
                <select
                  value={item.crop}
                  onChange={(e) => handleUpdateCropRow(idx, "crop", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {slotAvailableCrops.map((opt) => (
                    <option key={opt.crop} value={opt.crop}>
                      {opt.crop} (₹{opt.ratePerKg}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity (in KG)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={item.quantityKg}
                  onChange={(e) => handleUpdateCropRow(idx, "quantityKg", Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-3 text-right">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Value</label>
                <p className="text-xs font-extrabold text-emerald-700 py-2">
                  ₹{(item.estimatedAmount || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="sm:col-span-1 text-right">
                {selectedCrops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCropRow(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Estimated Summary Footer */}
        <div className="p-4 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-emerald-300 font-semibold">Total Estimated Value (Subject to Weighment)</p>
            <h3 className="text-2xl font-black text-[#C8F52F]">
              ₹{estimatedTotalValue.toLocaleString("en-IN")}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-[#C8F52F] hover:bg-[#bbf01a] text-[#0B2D1B] font-extrabold rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-sm cursor-pointer"
          >
            <span>Proceed to Request Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal (Explaining Request vs QR) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Confirm Booking Request</h3>
                <p className="text-xs text-slate-500">Review your multi-crop details before submitting</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Mandi:</span>
                <span className="font-bold">{mandi.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Slot:</span>
                <span className="font-bold">
                  {selectedSlot?.date} ({selectedSlot?.startTime} - {selectedSlot?.endTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Crops:</span>
                <span className="font-bold">
                  {selectedCrops.map((c) => `${c.crop} (${c.quantityKg} KG)`).join(", ")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-100 pt-2">
                <span>Expected Value:</span>
                <span>₹{estimatedTotalValue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Crucial Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Policy Notice:</strong> Submitting this form issues a <strong>Booking Request</strong>. Your official <strong>Token Number</strong> &amp; <strong>QR Code</strong> will be generated <em>only after the Mandi Operator reviews and accepts your request</em>.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBookingRequest}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Booking Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
