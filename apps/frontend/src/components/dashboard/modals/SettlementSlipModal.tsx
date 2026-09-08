import React from "react";
import { X, Printer } from "lucide-react";
import { Booking } from "../../../interfaces";

interface SettlementSlipModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const SettlementSlipModal: React.FC<SettlementSlipModalProps> = ({
  booking,
  onClose,
}) => {
  if (!booking) return null;

  const grossKg = booking.actualGrossWeightKg || 5200;
  const tareKg = booking.tareWeightKg || 200;
  const netQuintals = booking.actualWeightQuintals || booking.finalNetWeightQuintals || 50;
  const moisture = booking.moisturePercentage || 11.4;
  const ratePerQtl = booking.crop.includes("Wheat") ? 2300 : 5400;
  const totalPayout = booking.finalPayoutAmount || Math.round(netQuintals * ratePerQtl);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 dark:bg-black text-white dark:text-[#E5E5E5] border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-xs">
              APMC
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white dark:text-[#E5E5E5]">
                Indore APMC Grain Yard
              </h3>
              <p className="text-[11px] text-neutral-400 font-normal">
                Electronic Weighment &amp; Settlement Advice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white dark:hover:text-[#E5E5E5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slip Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Reference Tags */}
          <div className="flex justify-between items-center bg-neutral-50 dark:bg-black p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
            <div>
              <span className="text-[11px] text-neutral-400 uppercase block font-medium">Slip Number</span>
              <span className="font-semibold text-black dark:text-[#E5E5E5]">
                SLIP-{booking.id.replace("BK-", "")}-WGH
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 uppercase block font-medium">Token / Date</span>
              <span className="font-semibold text-[#059669] dark:text-[#5CE65C]">
                {booking.token} • {booking.arrivalDate}
              </span>
            </div>
          </div>

          {/* Farmer & Crop Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-400 uppercase font-medium block">Farmer</span>
              <span className="font-semibold text-neutral-900 dark:text-[#E5E5E5] text-xs">{booking.farmerName}</span>
              <span className="text-neutral-500 dark:text-neutral-400 block text-xs">{booking.farmerPhone}</span>
              <span className="text-xs font-mono text-neutral-400">{booking.farmerId}</span>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-400 uppercase font-medium block">Consignment</span>
              <span className="font-semibold text-neutral-900 dark:text-[#E5E5E5] text-xs">{booking.crop}</span>
              <span className="text-[#059669] dark:text-[#5CE65C] font-semibold block text-xs">{booking.variety || "Standard Grade"}</span>
              <span className="text-xs font-mono text-neutral-500">Truck: {booking.vehicleNumber}</span>
            </div>
          </div>

          {/* Weighment Manifest */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="bg-neutral-100 dark:bg-[#181818] px-3.5 py-2 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
              Certified Weighbridge Scale Measurement
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Loaded Gross Weight:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-[#E5E5E5]">{grossKg} Kg</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Tare Truck Weight:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-[#E5E5E5]">{tareKg} Kg</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Moisture Reading:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-[#E5E5E5]">{moisture}%</span>
              </div>
              <div className="flex justify-between text-[#059669] dark:text-[#5CE65C] font-semibold pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span>Net Deliverable Quantity:</span>
                <span className="font-mono">{netQuintals} Quintals</span>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="p-4 bg-emerald-50/50 dark:bg-neutral-900 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300 text-xs">
              <span>MSP / Mandi Benchmark Rate:</span>
              <span className="font-semibold">₹ {ratePerQtl.toLocaleString("en-IN")} / Qtl</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300 text-xs">
              <span>APMC Market User Cess:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Waived (Promotional Direct Trade)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800 font-bold text-black dark:text-[#E5E5E5] text-sm">
              <span>Total Payout to Farmer DBT:</span>
              <span className="text-[#059669] dark:text-[#5CE65C] text-base">₹ {totalPayout.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-black dark:text-[#E5E5E5]">
                {booking.token}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white">
                Cleared &amp; Settled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
