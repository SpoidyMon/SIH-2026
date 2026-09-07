import React, { useState } from "react";
import {
  ScanLine,
  Truck,
  Scale,
  ShieldCheck,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ArrowUpRight,
  Search,
  Printer,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  verifyGateTokenThunk,
  updateBookingStatusThunk,
  completeBookingThunk,
} from "../../store/slices/mandiSlice";
import { Booking } from "../../interfaces";

export function MandiGateScannerView() {
  const dispatch = useAppDispatch();
  const { currentBookings, isActionLoading } = useAppSelector((state) => state.mandi);

  const [tokenInput, setTokenInput] = useState("");
  const [scannedResult, setScannedResult] = useState<Booking | null>(null);

  // Unloading docks mock status
  const [docks, setDocks] = useState([
    { id: 1, name: "Intake Bay 01 (Wheat Hopper)", status: "OCCUPIED", crop: "Wheat", truck: "HR-26-DK-9042", progress: 65 },
    { id: 2, name: "Intake Bay 02 (Oilseed Pit)", status: "AVAILABLE", crop: "None", truck: "-", progress: 0 },
    { id: 3, name: "Intake Bay 03 (Coarse Grains)", status: "OCCUPIED", crop: "Mustard", truck: "MP-09-AB-4412", progress: 30 },
    { id: 4, name: "Intake Bay 04 (Weighbridge Out)", status: "AVAILABLE", crop: "None", truck: "-", progress: 0 },
  ]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    const query = tokenInput.trim().toUpperCase();
    const found = currentBookings.find((b) => b.token === query || b.id === query);
    if (found) {
      setScannedResult(found);
      dispatch(verifyGateTokenThunk(query));
    } else {
      // Mock lookup if not in state
      const mockBooking: Booking = {
        id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
        token: query,
        farmerId: "usr_farmer_09",
        farmerName: "Harinder Singh",
        farmerPhone: "+91 98765 00112",
        mandiId: "mandi-indore-01",
        mandiName: "Indore APMC Yard",
        slotId: "slot-101",
        crop: "Wheat (Sharbati)",
        variety: "Grade-A Export Quality",
        estimatedQuantityQuintals: 50,
        vehicleNumber: "PB-11-AA-9988",
        arrivalDate: new Date().toISOString().split("T")[0],
        slotTimeWindow: "08:00 - 11:00",
        status: "VERIFIED",
        qrCodeString: `https://agrovia.gov.in/verify?tkn=${query}`,
        createdAt: new Date().toISOString(),
      };
      setScannedResult(mockBooking);
      dispatch(verifyGateTokenThunk(query));
    }
  };

  const handleGrantEntry = (b: Booking) => {
    dispatch(verifyGateTokenThunk(b.token));
    setScannedResult((prev) => (prev ? { ...prev, status: "VERIFIED" } : null));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-3">
        <h1 className="text-xl font-black text-black dark:text-[#E5E5E5] tracking-tight">
          Electronic Gate Token Scanner &amp; Unloading Docks
        </h1>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
          Instant token barcode verification, vehicle dock routing, and weighbridge intake logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick QR / Token Scanner */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-6 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Gate Pass Token Scanner</h2>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-black text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Instant Validation
            </span>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase">
              Enter Token ID or Scan Barcode
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. TKN-7821 or TKN-3190"
                className="w-full pl-10 pr-24 py-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-mono font-bold text-black dark:text-[#E5E5E5] placeholder:text-gray-400 dark:placeholder-neutral-500 uppercase focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="btn-primary-green absolute right-1.5 top-1.5 px-4 py-1.5 text-xs cursor-pointer shadow-xs"
              >
                Verify
              </button>
            </div>
          </form>

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-[#15803D] dark:text-emerald-400 bg-white dark:bg-black px-2.5 py-1 rounded-lg border border-gray-200 dark:border-neutral-800">
                  {scannedResult.token}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    scannedResult.status === "VERIFIED"
                      ? "bg-emerald-50 dark:bg-black border border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400"
                      : "bg-blue-50 dark:bg-black border border-blue-300 dark:border-neutral-700 text-blue-700 dark:text-neutral-300"
                  }`}
                >
                  {scannedResult.status}
                </span>
              </div>

              <div className="bg-white dark:bg-black p-3 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Farmer:</span>
                  <strong className="text-black dark:text-[#E5E5E5]">{scannedResult.farmerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Crop:</span>
                  <strong className="text-black dark:text-[#E5E5E5]">{scannedResult.crop}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Vehicle:</span>
                  <strong className="text-black dark:text-[#E5E5E5] font-mono">{scannedResult.vehicleNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Arrival Window:</span>
                  <strong className="text-black dark:text-[#E5E5E5]">{scannedResult.slotTimeWindow}</strong>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-neutral-800 pt-1 mt-1">
                  <span className="text-gray-500 dark:text-neutral-400">Assigned Hopper Dock:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Bay 01 (Wheat Line)</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGrantEntry(scannedResult)}
                className="btn-primary-green w-full py-2.5 text-xs font-black cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Grant Gate Entry &amp; Print Slip</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Intake Hoppers / Unloading Docks */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-6 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Unloading Dock &amp; Weighbridge Status</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">4 Active Intake Hoppers</span>
          </div>

          <div className="space-y-3">
            {docks.map((dock) => (
              <div
                key={dock.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black dark:text-[#E5E5E5]">{dock.name}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      dock.status === "AVAILABLE"
                        ? "bg-emerald-50 dark:bg-black text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        : "bg-amber-50 dark:bg-black text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-700/60"
                    }`}
                  >
                    {dock.status}
                  </span>
                </div>

                {dock.status !== "AVAILABLE" && (
                  <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400">
                    <span>Crop: <strong className="text-black dark:text-[#E5E5E5]">{dock.crop}</strong></span>
                    <span>Truck: <strong className="text-black dark:text-[#E5E5E5] font-mono">{dock.truck}</strong></span>
                  </div>
                )}

                {dock.progress > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5CE65C] h-full rounded-full transition-all duration-500"
                      style={{ width: `${dock.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
