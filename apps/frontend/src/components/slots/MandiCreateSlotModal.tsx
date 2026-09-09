import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, AlertCircle, X } from "lucide-react";
import { MandiSlot, CreateSlotPayload, SlotCropItem } from "../../interfaces";

interface MandiCreateSlotModalProps {
  isOpen: boolean;
  editingSlot: MandiSlot | null;
  onClose: () => void;
  onSave: (payload: CreateSlotPayload) => void;
  closedDays?: string[];
  isActionLoading?: boolean;
}

export function MandiCreateSlotModal({
  isOpen,
  editingSlot,
  onClose,
  onSave,
  closedDays = [],
  isActionLoading = false,
}: MandiCreateSlotModalProps) {
  const [crop, setCrop] = useState("Tomato");
  const [allowedCrops, setAllowedCrops] = useState<SlotCropItem[]>([
    { crop: "Tomato", quantityQuintals: 1, isFixed: true },
    { crop: "Onion", quantityQuintals: undefined, isFixed: false },
  ]);
  const [date, setDate] = useState("2026-09-08");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("11:30");
  const [maxCapacityQuintals, setMaxCapacityQuintals] = useState<number>(500);
  const [maxFarmersLimit, setMaxFarmersLimit] = useState<number>(7);
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState<number>(15);
  const [bufferTolerancePercentage, setBufferTolerancePercentage] = useState<number>(10);

  useEffect(() => {
    if (editingSlot) {
      setCrop(editingSlot.crop);
      if (editingSlot.allowedCrops && editingSlot.allowedCrops.length > 0) {
        setAllowedCrops(editingSlot.allowedCrops);
      } else {
        setAllowedCrops([{ crop: editingSlot.crop, quantityQuintals: 10, isFixed: true }]);
      }
      setDate(editingSlot.slotDate || editingSlot.date || "2026-09-08");
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      setMaxCapacityQuintals(
        editingSlot.maxCapacityQuintals || editingSlot.totalCapacityQuintals || 500
      );
      setMaxFarmersLimit(editingSlot.maxFarmersLimit || editingSlot.maxFarmers || 7);
      setBufferTimeMinutes(editingSlot.bufferTimeMinutes || editingSlot.bufferMinutes || 15);
      setBufferTolerancePercentage(
        editingSlot.bufferTolerancePercentage || editingSlot.bufferPercentage || 10
      );
    } else {
      setCrop("Tomato");
      setAllowedCrops([
        { crop: "Tomato", quantityQuintals: 1, isFixed: true },
        { crop: "Onion", quantityQuintals: undefined, isFixed: false },
      ]);
      setDate("2026-09-08");
      setStartTime("08:00");
      setEndTime("11:30");
      setMaxCapacityQuintals(500);
      setMaxFarmersLimit(7);
      setBufferTimeMinutes(15);
      setBufferTolerancePercentage(10);
    }
  }, [editingSlot, isOpen]);

  if (!isOpen) return null;

  const handleAddCropItem = () => {
    setAllowedCrops([...allowedCrops, { crop: "Wheat", quantityQuintals: 5, isFixed: true }]);
  };

  const handleRemoveCropItem = (index: number) => {
    if (allowedCrops.length <= 1) return;
    setAllowedCrops(allowedCrops.filter((_, i) => i !== index));
  };

  const handleUpdateCropItem = (index: number, updates: Partial<SlotCropItem>) => {
    setAllowedCrops(
      allowedCrops.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", { weekday: "long" });
  };

  const isSelectedDateClosed = Boolean(closedDays.includes(getDayName(date)) || closedDays.includes(date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainCrop = allowedCrops.map((c) => c.crop).join(", ") || crop;
    onSave({
      crop: mainCrop,
      allowedCrops,
      date,
      startTime,
      endTime,
      totalCapacityQuintals: Number(maxCapacityQuintals),
      maxFarmers: Number(maxFarmersLimit),
      bufferMinutes: Number(bufferTimeMinutes),
      bufferPercentage: Number(bufferTolerancePercentage),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up my-8">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-xs text-black dark:text-[#E5E5E5]">
            <Calendar className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <span>{editingSlot ? "Edit Arrival Slot Window" : "Create New Mandi Arrival Slot"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Closed day warning */}
          {isSelectedDateClosed && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Warning: <strong>{getDayName(date)}</strong> is marked as a weekly closed day on
                your yard schedule!
              </span>
            </div>
          )}

          {/* Date & Time Window */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Arrival Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Gate Open
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Gate Close
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                required
              />
            </div>
          </div>

          {/* Multi-Crop Configuration */}
          <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-neutral-900/60 rounded-xl border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-gray-800 dark:text-neutral-200">
                  Crop Intake &amp; Quantity (Multi-Crop Support)
                </label>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                  e.g. Tomato 100kg (1 Qtl), Onion: Not fixed / flexible
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCropItem}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Crop</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {allowedCrops.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.crop}
                      onChange={(e) => handleUpdateCropItem(index, { crop: e.target.value })}
                      placeholder="e.g. Tomato, Onion, Wheat..."
                      className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg font-bold text-xs text-gray-900 dark:text-[#E5E5E5]"
                      required
                    />
                    {allowedCrops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCropItem(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={!item.isFixed}
                        onChange={(e) =>
                          handleUpdateCropItem(index, {
                            isFixed: !e.target.checked,
                            quantityQuintals: e.target.checked
                              ? undefined
                              : item.quantityQuintals || 1,
                          })
                        }
                        className="rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Flexible / Not Fixed Quantity</span>
                    </label>

                    {item.isFixed && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-semibold">Max:</span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={item.quantityQuintals ?? 1}
                          onChange={(e) =>
                            handleUpdateCropItem(index, {
                              quantityQuintals: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-16 px-2 py-1 bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded text-center font-bold text-xs"
                        />
                        <span className="font-semibold text-gray-500">Qtl (100kg)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Max Intake Capacity (Qtl)
              </label>
              <input
                type="number"
                value={maxCapacityQuintals}
                onChange={(e) => setMaxCapacityQuintals(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Max Farmers Limit
              </label>
              <input
                type="number"
                value={maxFarmersLimit}
                onChange={(e) => setMaxFarmersLimit(Number(e.target.value))}
                placeholder="e.g. 7"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Weighbridge Buffer (Mins)
              </label>
              <input
                type="number"
                value={bufferTimeMinutes}
                onChange={(e) => setBufferTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">
                Tolerance Margin (%)
              </label>
              <input
                type="number"
                value={bufferTolerancePercentage}
                onChange={(e) => setBufferTolerancePercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="btn-primary-green px-5 py-2 font-bold cursor-pointer disabled:opacity-50"
            >
              {editingSlot ? "Update Window" : "Publish Arrival Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
