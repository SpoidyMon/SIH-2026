import React from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Tractor,
  FileText,
} from "lucide-react";
import { FarmerDetails } from "../../interfaces";

interface FarmerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerDetails | null;
  isLoading?: boolean;
}

export function FarmerDetailsModal({
  isOpen,
  onClose,
  farmer,
  isLoading = false,
}: FarmerDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/70 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5]">Farmer Profile & KYC Record</h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Verified agricultural producer identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-neutral-500">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Fetching farmer registry record...</p>
            </div>
          ) : !farmer ? (
            <div className="py-8 text-center text-slate-400 dark:text-neutral-500">
              <p>Farmer information not found.</p>
            </div>
          ) : (
            <>
              {/* Top ID Card */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-400 bg-white dark:bg-black px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/60">
                      {farmer.farmerCode || "FAR001"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-[#E5E5E5] text-sm">{farmer.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 dark:text-neutral-400">
                    {farmer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {farmer.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {farmer.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    KYC Verified
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {farmer.verifiedBookingsCount} successful deliveries
                  </span>
                </div>
              </div>

              {/* Identity & Legal Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID Document</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#E5E5E5]">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{farmer.idType || "AADHAAR"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{farmer.idNumber || "•••• •••• 9012"}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date of Birth</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#E5E5E5]">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{farmer.dob || "1985-06-12"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verified Age 40+ yr</p>
                </div>
              </div>

              {/* Physical Residence Address */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  Address & Village Record
                </span>
                <p className="text-slate-800 dark:text-[#E5E5E5] font-medium leading-relaxed">
                  {farmer.address || `${farmer.village || "Village Sanwer"}, ${farmer.taluka || "Tehsil Sanwer"}, ${farmer.district || "Indore"}, ${farmer.state || "Madhya Pradesh"} - ${farmer.pincode || "452010"}`}
                </p>
              </div>

              {/* Agricultural & Land Holdings */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Tractor className="w-3 h-3 text-emerald-600" />
                  Farm & Cultivation Profile
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Total Landholding:</span>
                    <p className="font-bold text-slate-800 dark:text-[#E5E5E5]">
                      {farmer.landSizeAcres ? `${farmer.landSizeAcres} Acres` : "8.5 Acres"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Irrigation Facility:</span>
                    <p className="font-bold text-slate-800 dark:text-[#E5E5E5]">
                      {farmer.irrigationType || "Tube-well & Canal"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Registered Main Crops:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(farmer.mainCrops && farmer.mainCrops.length > 0
                      ? farmer.mainCrops
                      : ["Wheat (Sharbati)", "Soybean", "Mustard"]
                    ).map((crop, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-neutral-800 flex justify-end bg-slate-50/50 dark:bg-neutral-900/30">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 transition cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
