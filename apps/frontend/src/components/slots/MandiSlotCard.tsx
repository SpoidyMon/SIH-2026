import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { MandiSlot } from "../../interfaces";

interface MandiSlotCardProps {
  slot: MandiSlot;
  onEdit: (slot: MandiSlot) => void;
  onDelete: (id: string) => void;
}

export const MandiSlotCard = React.memo(function MandiSlotCard({
  slot,
  onEdit,
  onDelete,
}: MandiSlotCardProps) {
  const totalCap = slot.maxCapacityQuintals || slot.totalCapacityQuintals || 500;
  const bookedPct = totalCap > 0
    ? Math.round((slot.bookedCapacityQuintals / totalCap) * 100)
    : 0;
  const maxFarmers = slot.maxFarmersLimit || slot.maxFarmers || 7;
  const currentFarmers = slot.currentFarmersBooked ?? slot.bookedFarmers ?? 0;
  const slotDateStr = slot.slotDate || slot.date || "";

  // Progress bar color based on utilization
  const barColor =
    bookedPct > 85 ? "bg-red-500" : bookedPct > 70 ? "bg-amber-500" : "bg-[#5CE65C]";

  return (
    <div className="mandi-card p-5 space-y-4 flex flex-col justify-between">
      {/* Top Row: Slot ID + Status */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-black text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800">
          {slot.id}
        </span>
        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
          OPEN FOR BOOKING
        </span>
      </div>

      {/* Crop Title */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-[#E5E5E5] line-clamp-1">
          {slot.crop}
        </h3>
        {/* Multi-Crop Badges */}
        {slot.allowedCrops && slot.allowedCrops.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {slot.allowedCrops.map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                {item.crop}: {item.isFixed ? `${item.quantityQuintals ?? 1} Qtl` : "Flexible Qty"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Date & Window Row */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-neutral-800/80 rounded-xl text-xs">
        <div>
          <span className="text-gray-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
            Arrival Date
          </span>
          <span className="font-bold text-gray-800 dark:text-[#E5E5E5]">{slotDateStr}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-neutral-500 block text-[10px] uppercase font-bold">
            Gate Window
          </span>
          <span className="font-bold text-gray-800 dark:text-[#E5E5E5]">
            {slot.startTime} - {slot.endTime}
          </span>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-neutral-400 font-semibold">
            Intake Capacity Booked
          </span>
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
          <span>
            Farmers Allowed:{" "}
            <strong className="text-black dark:text-[#E5E5E5]">
              {currentFarmers} / {maxFarmers}
            </strong>
          </span>
          <span>
            Available:{" "}
            <strong className="text-emerald-700 dark:text-emerald-400">
              {Math.max(0, maxFarmers - currentFarmers)} slots
            </strong>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            Buffer Time:{" "}
            <strong className="text-black dark:text-[#E5E5E5]">
              {slot.bufferTimeMinutes || slot.bufferMinutes || 15} mins
            </strong>
          </span>
          <span>
            Tolerance:{" "}
            <strong className="text-black dark:text-[#E5E5E5]">
              +{slot.bufferTolerancePercentage || slot.bufferPercentage || 10}%
            </strong>
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800/80">
        <button
          onClick={() => onEdit(slot)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-700 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Slot</span>
        </button>
        <button
          onClick={() => onDelete(slot.id)}
          title="Remove Arrival Window"
          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
