import React, { useState, useEffect } from "react";
import { Scale, X } from "lucide-react";
import { Booking } from "../../../interfaces";

interface WeighbridgeSettlementModalProps {
  booking: Booking | null;
  onClose: () => void;
  onComplete: (bookingId: string, actualWeightQuintals: number, finalPayoutAmount: number) => void;
}

export const WeighbridgeSettlementModal: React.FC<WeighbridgeSettlementModalProps> = ({
  booking,
  onClose,
  onComplete,
}) => {
  const [grossWeightKg, setGrossWeightKg] = useState<number>(4700);
  const [tareWeightKg, setTareWeightKg] = useState<number>(200);
  const [moisturePercent, setMoisturePercent] = useState<number>(11.5);

  useEffect(() => {
    if (booking) {
      const estimatedKg = (booking.estimatedQuantityQuintals || booking.quantityQuintals || 50) * 100;
      setGrossWeightKg(estimatedKg + 200);
      setTareWeightKg(200);
      setMoisturePercent(11.4);
    }
  }, [booking]);

  if (!booking) return null;

  const netQuintals = Math.max(0, (grossWeightKg - tareWeightKg) / 100);
  const ratePerQuintal = booking.crop.includes("Wheat")
    ? 2300
    : booking.crop.includes("Mustard")
    ? 5400
    : booking.crop.includes("Rice")
    ? 3800
    : 5400;
  const finalPayout = Math.round(netQuintals * ratePerQuintal);

  const handleSettlementSubmit = () => {
    onComplete(booking.id, netQuintals, finalPayout);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-[#E5E5E5]">
            <Scale className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
            <span>Weighbridge Measurement &amp; Final Settlement</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-[#E5E5E5]">
              {booking.farmerName} • {booking.vehicleNumber}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">
              {booking.crop} (Estimated: {booking.estimatedQuantityQuintals} Qtl)
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                Loaded Gross Weight (Kg)
              </label>
              <input
                type="number"
                value={grossWeightKg}
                onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
              />
            </div>
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                Tare Truck Weight (Kg)
              </label>
              <input
                type="number"
                value={tareWeightKg}
                onChange={(e) => setTareWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
              />
            </div>
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                Assayed Moisture (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={moisturePercent}
                onChange={(e) => setMoisturePercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
              />
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="p-3 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-semibold text-[#059669] dark:text-[#5CE65C]">
              <span>Net Agricultural Quintals:</span>
              <span>{netQuintals.toFixed(2)} Qtl</span>
            </div>
            <div className="flex justify-between font-semibold text-black dark:text-[#E5E5E5] text-sm pt-1 border-t border-[#BBF7D0] dark:border-neutral-800">
              <span>Direct Trade Payout:</span>
              <span className="text-[#059669] dark:text-[#5CE65C]">
                ₹ {finalPayout.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSettlementSubmit}
              className="px-5 py-2 font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer shadow-xs"
            >
              Complete &amp; Issue Settlement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
