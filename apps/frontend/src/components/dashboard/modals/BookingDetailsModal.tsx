import React, { useState } from "react";
import { ShieldCheck, X, Printer, CheckCircle2, AlertOctagon, QrCode, Phone, User, Calendar, Scale } from "lucide-react";
import { Booking } from "../../../interfaces";

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onAccept?: (bookingId: string) => void;
  onReject?: (bookingId: string, reason?: string) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onAccept,
  onReject,
}) => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!booking) return null;

  const totalKg = booking.quantityKg || (booking.quantityQuintals ? booking.quantityQuintals * 100 : 0);
  const crops = booking.cropsList && Array.isArray(booking.cropsList) && booking.cropsList.length > 0
    ? booking.cropsList
    : [{ crop: booking.crop, quantityKg: totalKg, ratePerKg: 28, estimatedAmount: totalKg * 28 }];

  const handleConfirmReject = () => {
    const reason = rejectionReason.trim() || "Slot capacity reached or criteria not met.";
    onReject?.(booking.id, reason);
    setShowRejectInput(false);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-900 dark:text-[#E5E5E5]">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Consignment Booking Details #{booking.token || booking.id.slice(0, 8)}</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Status & Rejection Reason Banner */}
          {booking.status === "REJECTED" && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-800 dark:text-red-400 block">Booking Application Rejected</span>
                <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                  Reason: {booking.rejectionReason || "Slot capacity reached or criteria not met."}
                </p>
                <span className="text-[10px] text-red-500 mt-1 block">Farmer is blocked from reapplying for this specific slot.</span>
              </div>
            </div>
          )}

          {booking.status === "PENDING" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between">
              <span className="text-amber-800 dark:text-amber-300 font-semibold">
                ⏳ Status: Pending Operator Approval
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">Queue Position #{booking.queueNumber || 1}</span>
            </div>
          )}

          {/* Farmer Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-neutral-900/70 rounded-xl border border-slate-200/80 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-neutral-800 pb-2">
              <span className="font-bold text-slate-900 dark:text-[#E5E5E5] flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Farmer Profile
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                KYC Verified
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block text-[10px]">Name</span>
                <span className="font-semibold text-slate-800 dark:text-[#E5E5E5] text-xs">{booking.farmerName || "Registered Farmer"}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block text-[10px]">Contact Mobile</span>
                <span className="font-semibold text-slate-800 dark:text-[#E5E5E5] text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {booking.farmerPhone || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block text-[10px]">Arrival Slot Window</span>
                <span className="font-semibold text-slate-800 dark:text-[#E5E5E5] text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {booking.slotTimeWindow || "09:00 - 13:00"} ({booking.arrivalDate || "Today"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block text-[10px]">Total Consignment Quantity</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-600" />
                  {totalKg.toLocaleString()} KG
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Crop Breakdown Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 dark:text-[#E5E5E5] block text-xs">
              Crops Breakdown
            </span>
            <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-neutral-900 text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Crop Name</th>
                    <th className="py-2.5 px-3 text-right">Quantity (KG)</th>
                    <th className="py-2.5 px-3 text-right">Rate / KG</th>
                    <th className="py-2.5 px-3 text-right">Est. Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
                  {crops.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-[#E5E5E5]">{c.crop}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{c.quantityKg.toLocaleString()} KG</td>
                      <td className="py-2.5 px-3 text-right text-slate-500 dark:text-neutral-400 font-mono">
                        ₹ {c.ratePerKg || 28} / kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹ {((c.estimatedAmount || c.quantityKg * (c.ratePerKg || 28))).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gate Token Section if Accepted */}
          {(booking.status === "ACCEPTED" || booking.status === "VERIFIED" || booking.status === "COMPLETED") && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Official Gate Token
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-[#E5E5E5] block mt-0.5">
                  {booking.token}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 block">
                  Verified Gate Pass • Authorized for Weighbridge Check-in
                </span>
              </div>
              <div className="px-3 py-2 bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700/60 rounded-lg text-right shrink-0">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">Gate Verification</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">Scan farmer's QR or enter token</span>
              </div>
            </div>
          )}

          {/* Reject Input Sub-form */}
          {showRejectInput && (
            <div className="p-3.5 bg-red-50 dark:bg-black border border-red-200 dark:border-red-900 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-red-800 dark:text-red-400">
                Mandatory Reason for Rejection *
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Slot capacity reached / Produce quality criteria / Maintenance"
                className="w-full p-2 text-xs bg-white dark:bg-neutral-900 border border-red-300 dark:border-red-800 rounded-lg outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-black border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass Slip</span>
          </button>

          <div className="flex items-center gap-2">
            {booking.status === "PENDING" && !showRejectInput && (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900 border border-red-300 dark:border-red-900 rounded-xl cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    onAccept?.(booking.id);
                    onClose();
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Accept &amp; Generate Pass
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

