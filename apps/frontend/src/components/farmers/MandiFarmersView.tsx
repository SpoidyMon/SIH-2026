import React, { useState } from "react";
import { Users, Search, Phone, MapPin, CheckCircle2, ShieldCheck, ChevronRight, FileText, ArrowUpRight } from "lucide-react";

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

const mockFarmers: FarmerRecord[] = [
  {
    id: "usr_farmer_01",
    name: "Baldev Singh",
    phone: "+91 98765 43210",
    village: "Sanwer Khurd",
    district: "Indore",
    landAcres: 14.5,
    kycStatus: "VERIFIED",
    primaryCrops: ["Wheat (Sharbati)", "Mustard"],
    totalConsignments: 12,
    totalQuintalsSupplied: 580,
    lastArrival: "2026-08-31",
  },
  {
    id: "usr_farmer_02",
    name: "Ramesh Patel",
    phone: "+91 94250 11223",
    village: "Depalpur",
    district: "Indore",
    landAcres: 8.2,
    kycStatus: "VERIFIED",
    primaryCrops: ["Mustard", "Soyabean"],
    totalConsignments: 8,
    totalQuintalsSupplied: 360,
    lastArrival: "2026-08-31",
  },
  {
    id: "usr_farmer_03",
    name: "Harpreet Kaur",
    phone: "+91 98140 77889",
    village: "Betma",
    district: "Indore",
    landAcres: 22.0,
    kycStatus: "VERIFIED",
    primaryCrops: ["Basmati Rice", "Wheat"],
    totalConsignments: 19,
    totalQuintalsSupplied: 1240,
    lastArrival: "2026-08-31",
  },
  {
    id: "usr_farmer_04",
    name: "Devendra Yadav",
    phone: "+91 99881 22334",
    village: "Mhow Gaon",
    district: "Indore",
    landAcres: 16.0,
    kycStatus: "VERIFIED",
    primaryCrops: ["Soyabean", "Wheat"],
    totalConsignments: 15,
    totalQuintalsSupplied: 890,
    lastArrival: "2026-08-31",
  },
  {
    id: "usr_farmer_05",
    name: "Jagdish Verma",
    phone: "+91 94250 88991",
    village: "Rau",
    district: "Indore",
    landAcres: 6.5,
    kycStatus: "VERIFIED",
    primaryCrops: ["Wheat (Lokwan)"],
    totalConsignments: 6,
    totalQuintalsSupplied: 245,
    lastArrival: "2026-08-29",
  },
];

export function MandiFarmersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);

  const filteredFarmers = mockFarmers.filter(
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
            Farmer Registry & Directory
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
            Verified agricultural producers registered with Indore Central APMC Mandi.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-full text-xs font-bold text-[#059669] dark:text-[#5CE65C]">
          <Users className="w-3.5 h-3.5" />
          <span>Total Registered: 1,480 Farmers</span>
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

      {/* Farmers Table */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="mandi-table">
            <thead>
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  FARMER
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  LOCATION & LAND
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  PRIMARY CROPS
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  TOTAL DELIVERIES
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  KYC STATUS
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60 transition-colors">
                  <td className="px-5 py-4 align-middle">
                    <div className="font-bold text-gray-900 dark:text-[#E5E5E5] text-sm">{farmer.name}</div>
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
                    <div className="text-xs text-neutral-400">{farmer.landAcres} Acres Registered</div>
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
                    <div className="text-sm font-extrabold text-gray-900 dark:text-[#E5E5E5]">
                      {farmer.totalQuintalsSupplied} Qtl
                    </div>
                    <div className="text-xs text-neutral-400">{farmer.totalConsignments} Consignments</div>
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

      {/* Farmer Ledger Detail Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-neutral-800">
              <div className="font-bold text-sm text-gray-900 dark:text-[#E5E5E5]">
                Farmer Consolidated Profile: {selectedFarmer.name}
              </div>
              <button onClick={() => setSelectedFarmer(null)} className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Farmer ID</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-[#E5E5E5] text-sm">{selectedFarmer.id}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Registered Contact</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">{selectedFarmer.phone}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Village / Tehsil</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">{selectedFarmer.village}, {selectedFarmer.district}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Registered Acreage</span>
                  <span className="font-bold text-gray-900 dark:text-[#E5E5E5]">{selectedFarmer.landAcres} Acres</span>
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
