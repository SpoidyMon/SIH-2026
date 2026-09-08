import React, { useState, useMemo } from "react";
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
  AlertTriangle,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  verifyGateTokenThunk,
  updateBookingStatusThunk,
  completeBookingThunk,
  clearQueueAlert,
  fetchFarmerDetailsThunk,
} from "../../store/slices/mandiSlice";
import { Booking } from "../../interfaces";
import { FarmerDetailsModal } from "../common/FarmerDetailsModal";

export function MandiGateScannerView() {
  const dispatch = useAppDispatch();
  const { currentBookings, queueAlertMessage, selectedFarmerDetails, isActionLoading } = useAppSelector(
    (state) => state.mandi
  );

  const [tokenInput, setTokenInput] = useState("");
  const [scannedResult, setScannedResult] = useState<Booking | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Unloading bays dynamically computed from live verified bookings
  const verifiedBookings = useMemo(
    () => currentBookings.filter((b) => b.status === "VERIFIED" || b.status === "ARRIVED"),
    [currentBookings]
  );

  const docks = useMemo(() => {
    const bays = [
      { id: 1, name: "Intake Bay 01 (Wheat Hopper)" },
      { id: 2, name: "Intake Bay 02 (Oilseed Pit)" },
      { id: 3, name: "Intake Bay 03 (Coarse Grains & Pulses)" },
      { id: 4, name: "Intake Bay 04 (Weighbridge Out)" },
    ];

    return bays.map((bay, idx) => {
      const activeBooking = verifiedBookings[idx];
      if (activeBooking) {
        return {
          id: bay.id,
          name: bay.name,
          status: "OCCUPIED" as const,
          crop: activeBooking.crop,
          truck: activeBooking.vehicleNumber || `Vehicle #${activeBooking.token}`,
          progress: 50,
        };
      }
      return {
        id: bay.id,
        name: bay.name,
        status: "AVAILABLE" as const,
        crop: "None",
        truck: "-",
        progress: 0,
      };
    });
  }, [verifiedBookings]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setScanError(null);
    const query = tokenInput.trim().toUpperCase();
    const found = currentBookings.find((b) => b.token.toUpperCase() === query || b.id.toUpperCase() === query);

    if (found) {
      setScannedResult(found);
      dispatch(verifyGateTokenThunk(query));
    } else {
      dispatch(verifyGateTokenThunk(query))
        .unwrap()
        .then((res: any) => {
          if (res?.booking) {
            setScannedResult(res.booking);
          }
        })
        .catch((err: any) => {
          setScannedResult(null);
          setScanError(typeof err === "string" ? err : "Token not found in active bookings");
        });
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

          {/* FCFS Queue Order Warning */}
          {queueAlertMessage && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-fade-in shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>FCFS Queue Order Notice</span>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(clearQueueAlert())}
                  className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed">
                {queueAlertMessage}
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => dispatch(clearQueueAlert())}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition shadow-2xs"
                >
                  Acknowledge &amp; Override
                </button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium">{scanError}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanError(null)}
                className="text-red-500 hover:text-red-800 dark:hover:text-red-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                placeholder="e.g. 8SEP-10AM-001 or MAN-TKN"
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
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Bay 01 (Intake Line)</strong>
                </div>
              </div>

              {/* View Farmer KYC Profile Button */}
              <button
                type="button"
                onClick={() => {
                  if (scannedResult.farmerId) {
                    dispatch(fetchFarmerDetailsThunk(scannedResult.farmerId));
                    setShowFarmerModal(true);
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inspect Farmer Profile &amp; KYC</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>

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

      {/* Farmer KYC & Profile Inspector Modal */}
      <FarmerDetailsModal
        isOpen={showFarmerModal}
        onClose={() => setShowFarmerModal(false)}
        farmer={selectedFarmerDetails}
      />
    </div>
  );
}
