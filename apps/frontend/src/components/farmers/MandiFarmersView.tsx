import React, { useState, useEffect } from "react";
import { Users, Search, Phone, ShieldCheck, RefreshCw, AlertCircle, Eye, X } from "lucide-react";
import { mandiApi } from "../../services/mandi.api";

interface FarmerRecord {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  landAcres: number;
  kycStatus: "VERIFIED" | "PENDING";
  primaryCrops: string[];
  totalConsignments: number;
  totalQuintalsSupplied: number;
  lastArrival: string;
}

export function MandiFarmersView() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    mandiApi
      .getFarmers()
      .then((res) => {
        if (isMounted && res.success && res.data?.farmers) {
          setFarmers(res.data.farmers);
        }
      })
      .catch(() => {
        if (isMounted) setFarmers([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.phone.includes(searchTerm) ||
      f.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E5E5E5] tracking-tight">
            Farmer Registry &amp; Directory
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
            Verified agricultural producers registered with this APMC Mandi Yard.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-full text-xs font-bold text-[#059669] dark:text-[#5CE65C]">
          <Users className="w-3.5 h-3.5" />
          <span>Total Registered: {farmers.length} Farmers</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by farmer name, mobile number, ID, or village..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-[#E5E5E5] placeholder:text-neutral-400 focus:outline-none focus:border-[#059669]"
          />
        </div>
      </div>

      {/* Farmers Table or Loading / Empty */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#059669]" />
          <span className="text-xs text-neutral-500">Loading farmer directory from database...</span>
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-neutral-400" />
          <div className="font-bold text-sm text-gray-800 dark:text-gray-200">No Farmers Found</div>
          <p className="text-xs text-neutral-500 max-w-sm">
            {searchTerm
              ? "No farmer records match your current search query."
              : "No registered farmers currently linked with this APMC yard."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="mandi-table w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/60 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-left">
                  <th className="px-5 py-3.5">FARMER</th>
                  <th className="px-5 py-3.5">LOCATION &amp; LAND</th>
                  <th className="px-5 py-3.5">PRIMARY CROPS</th>
                  <th className="px-5 py-3.5">TOTAL DELIVERIES</th>
                  <th className="px-5 py-3.5">KYC STATUS</th>
                  <th className="px-6 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {filteredFarmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60 transition-colors"
                  >
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-gray-900 dark:text-[#E5E5E5] text-sm">
                        {farmer.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{farmer.phone}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-neutral-400">{farmer.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {farmer.village}, {farmer.district}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {farmer.landAcres} Acres Registered
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {farmer.primaryCrops.map((crop) => (
                          <span
                            key={crop}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-black text-[#059669] dark:text-[#5CE65C] border border-emerald-200 dark:border-emerald-800/60"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="text-sm font-semibold text-gray-900 dark:text-[#E5E5E5]">
                        {farmer.totalQuintalsSupplied} Qtl
                      </div>
                      <div className="text-xs text-neutral-400">
                        {farmer.totalConsignments} Consignments
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-black text-[#059669] dark:text-[#5CE65C] border border-emerald-300 dark:border-emerald-700/60">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{farmer.kycStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <button
                        onClick={() => setSelectedFarmer(farmer)}
                        className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-2xs transition-all cursor-pointer"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Farmer Detail Drawer / Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-[#171717] border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-[#E5E5E5] text-sm">
                <Users className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
                <span>Farmer Ledger Profile: {selectedFarmer.name}</span>
              </div>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Farmer ID</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-[#E5E5E5] text-sm">
                    {selectedFarmer.id}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Registered Contact</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">
                    {selectedFarmer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Village / Tehsil</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">
                    {selectedFarmer.village}, {selectedFarmer.district}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Registered Acreage</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">
                    {selectedFarmer.landAcres} Acres
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-[#059669] dark:text-[#5CE65C]">
                  <span>Total Produce Delivered:</span>
                  <span>{selectedFarmer.totalQuintalsSupplied} Quintals</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Completed Consignments:</span>
                  <span>{selectedFarmer.totalConsignments} Successful Deliveries</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Last Intake Date:</span>
                  <span>{selectedFarmer.lastArrival}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedFarmer(null)}
                  className="px-5 py-2 font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
