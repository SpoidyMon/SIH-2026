import React from "react";
import { ShieldCheck, X, Printer } from "lucide-react";
import { Booking } from "../../../interfaces";

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
}) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-[#E5E5E5]">
            <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
            <span>Electronic Gate Pass #{booking.token}</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block text-xs">Farmer</span>
              <span className="font-semibold text-black dark:text-[#E5E5E5] text-sm">{booking.farmerName}</span>
              <span className="text-neutral-500 dark:text-neutral-400 block">{booking.farmerPhone}</span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block text-xs">Vehicle Reference</span>
              <span className="font-mono font-semibold text-black dark:text-[#E5E5E5] text-sm">{booking.vehicleNumber}</span>
              <span className="text-neutral-500 dark:text-neutral-400 block">{booking.mandiName}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Crop & Variety</span>
              <span className="font-semibold text-neutral-900 dark:text-[#E5E5E5]">{booking.crop} ({booking.variety})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Allocated Arrival Window</span>
              <span className="font-semibold text-neutral-900 dark:text-[#E5E5E5]">{booking.arrivalDate} | {booking.slotTimeWindow}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Estimated Lot Weight</span>
              <span className="font-semibold text-neutral-900 dark:text-[#E5E5E5]">{booking.estimatedQuantityQuintals} Quintals</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Booking Status</span>
              <span className="font-semibold uppercase text-[#059669] dark:text-[#5CE65C]">{booking.status}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
