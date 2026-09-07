import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  createSlotThunk,
  deleteSlotThunk,
  applyDefaultPresetsThunk,
} from "../../store/slices/mandiSlice";
import { MandiSlot, CreateSlotPayload } from "../../interfaces";

export function MandiSlotsView() {
  const dispatch = useAppDispatch();
  const { slots, isActionLoading } = useAppSelector((state) => state.mandi);

  const [dateFilter, setDateFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MandiSlot | null>(null);

  // Form State
  const [crop, setCrop] = useState("Wheat (Sharbati)");
  const [date, setDate] = useState("2026-09-01");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("11:30");
  const [maxCapacityQuintals, setMaxCapacityQuintals] = useState<number>(600);
  const [maxFarmersLimit, setMaxFarmersLimit] = useState<number>(25);
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState<number>(15);
  const [bufferTolerancePercentage, setBufferTolerancePercentage] = useState<number>(10);

  const handleOpenCreateModal = () => {
    setCrop("Wheat (Sharbati)");
    setDate("2026-09-01");
    setStartTime("08:00");
    setEndTime("11:30");
    setMaxCapacityQuintals(600);
    setMaxFarmersLimit(25);
    setBufferTimeMinutes(15);
    setBufferTolerancePercentage(10);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (slot: MandiSlot) => {
    setEditingSlot(slot);
    setCrop(slot.crop);
    setDate(slot.slotDate || slot.date || "2026-09-01");
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setMaxCapacityQuintals(slot.maxCapacityQuintals || slot.totalCapacityQuintals || 500);
    setMaxFarmersLimit(slot.maxFarmersLimit || slot.maxFarmers || 20);
    setBufferTimeMinutes(slot.bufferTimeMinutes || slot.bufferMinutes || 15);
    setBufferTolerancePercentage(slot.bufferTolerancePercentage || slot.bufferPercentage || 10);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateSlotPayload = {
      crop,
      date,
      startTime,
      endTime,
      totalCapacityQuintals: Number(maxCapacityQuintals),
      maxFarmers: Number(maxFarmersLimit),
      bufferMinutes: Number(bufferTimeMinutes),
      bufferPercentage: Number(bufferTolerancePercentage),
    };

    dispatch(createSlotThunk(payload));
    setShowCreateModal(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm("Are you sure you want to remove this arrival slot window?")) {
      dispatch(deleteSlotThunk(id));
    }
  };

  const filteredSlots = slots.filter((slot) => {
    if (!dateFilter) return true;
    return slot.slotDate === dateFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ═══ 1. HEADER ROW (MATCHING SCREENSHOT) ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-black text-black dark:text-[#E5E5E5] tracking-tight">
            Manage Mandi Arrival Slots
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
            Configure crop-wise intake capacity, time windows, farmer limits & weighbridge buffers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C] cursor-pointer shadow-2xs [color-scheme:dark]"
            />
          </div>

          {/* Create New Slot Button */}
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary-green flex items-center gap-2 px-4 py-2 text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Slot</span>
          </button>
        </div>
      </div>

      {/* ═══ 2. GRID OF SLOT CARDS (3 COLUMNS) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSlots.map((slot) => {
          const totalCap = slot.maxCapacityQuintals || slot.totalCapacityQuintals || 500;
          const bookedPct = totalCap > 0
            ? Math.round((slot.bookedCapacityQuintals / totalCap) * 100)
            : 0;
          const maxFarmers = slot.maxFarmersLimit || slot.maxFarmers || 20;
          const currentFarmers = slot.currentFarmersBooked ?? slot.bookedFarmers ?? 0;
          const slotDateStr = slot.slotDate || slot.date || "2026-09-01";

          // Progress bar color based on utilization
          const barColor =
            bookedPct > 85 ? "bg-red-500" : bookedPct > 70 ? "bg-amber-500" : "bg-[#5CE65C]";

          return (
            <div
              key={slot.id}
              className="mandi-card p-5 space-y-4 flex flex-col justify-between"
            >
              {/* Top Row: Slot ID + Status */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-black text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800">
                  {slot.id}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
                  OPEN FOR BOOKING
                </span>
              </div>

              {/* Crop Title */}
              <div>
                <h3 className="text-base font-black text-black dark:text-[#E5E5E5]">
                  {slot.crop}
                </h3>
              </div>

              {/* Date & Window Row */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-neutral-800/80 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-bold text-gray-800 dark:text-[#E5E5E5]">{slotDateStr}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">Window</span>
                  <span className="font-bold text-gray-800 dark:text-[#E5E5E5]">{slot.startTime} - {slot.endTime}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-neutral-400 font-semibold">Intake Capacity Booked</span>
                  <span className="font-bold text-black dark:text-[#E5E5E5]">
                    {slot.bookedCapacityQuintals} / {totalCap} Qtl ({bookedPct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(bookedPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Details Metrics */}
              <div className="space-y-1 text-xs text-gray-500 dark:text-neutral-400 pt-1 border-t border-gray-100 dark:border-neutral-800/80">
                <div className="flex justify-between">
                  <span>Farmers: <strong className="text-black dark:text-[#E5E5E5]">{currentFarmers} / {maxFarmers}</strong></span>
                  <span>Available: <strong className="text-emerald-700 dark:text-emerald-400">{Math.max(0, maxFarmers - currentFarmers)} slots</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Buffer Time: <strong className="text-black dark:text-[#E5E5E5]">{slot.bufferTimeMinutes || slot.bufferMinutes || 15} mins</strong></span>
                  <span>Buffer %: <strong className="text-black dark:text-[#E5E5E5]">+{slot.bufferTolerancePercentage || slot.bufferPercentage || 10}% tolerance</strong></span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800/80">
                <button
                  onClick={() => handleOpenEditModal(slot)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-700 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Slot</span>
                </button>
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  title="Remove Arrival Window"
                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ MODAL: CREATE / EDIT ARRIVAL SLOT ═══ */}
      {(showCreateModal || editingSlot) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-xs text-black dark:text-[#E5E5E5]">
                <Calendar className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                <span>{editingSlot ? "Edit Arrival Slot Window" : "Create New Mandi Arrival Slot"}</span>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSlot(null);
                }}
                className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Crop Type & Grade</label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                  >
                    <option value="Wheat (Sharbati)">Wheat (Sharbati)</option>
                    <option value="Mustard (Sarson)">Mustard (Sarson)</option>
                    <option value="Rice (Basmati 1121)">Rice (Basmati 1121)</option>
                    <option value="Soyabean (Yellow)">Soyabean (Yellow)</option>
                    <option value="Gram / Chana">Gram / Chana</option>
                    <option value="Maize (Hybrid)">Maize (Hybrid)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Arrival Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Start Time (Gate Open)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">End Time (Gate Close)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5] [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Max Intake Capacity (Qtl)</label>
                  <input
                    type="number"
                    value={maxCapacityQuintals}
                    onChange={(e) => setMaxCapacityQuintals(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Max Farmers Allowed</label>
                  <input
                    type="number"
                    value={maxFarmersLimit}
                    onChange={(e) => setMaxFarmersLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Weighbridge Buffer (Minutes)</label>
                  <input
                    type="number"
                    value={bufferTimeMinutes}
                    onChange={(e) => setBufferTimeMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-gray-800 dark:text-[#E5E5E5]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Tolerance Margin (%)</label>
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
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSlot(null);
                  }}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 font-bold cursor-pointer"
                >
                  {editingSlot ? "Update Window" : "Publish Arrival Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
