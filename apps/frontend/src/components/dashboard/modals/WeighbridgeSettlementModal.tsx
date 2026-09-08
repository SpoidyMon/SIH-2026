import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Scale,
  X,
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  CameraOff,
  Lock,
} from "lucide-react";
import { WeighbridgeSettlementModalProps } from "../../../interfaces";
import { parseQrPayload, isValidAgroviaToken } from "../../../utils/qr.util";

export const WeighbridgeSettlementModal: React.FC<WeighbridgeSettlementModalProps> = ({
  booking,
  onClose,
  onComplete,
  isPreVerified = false,
}) => {
  const [grossWeightKg, setGrossWeightKg] = useState<number>(4700);
  const [tareWeightKg, setTareWeightKg] = useState<number>(200);
  const [moisturePercent, setMoisturePercent] = useState<number>(11.5);

  // Mandatory Farmer Verification State (QR Code Only)
  const [isVerified, setIsVerified] = useState<boolean>(isPreVerified);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  // Initialize weights from booking
  useEffect(() => {
    if (booking) {
      const estimatedKg =
        booking.quantityKg ||
        (booking.estimatedQuantityQuintals || booking.quantityQuintals || 50) * 100;
      setGrossWeightKg(estimatedKg + 200);
      setTareWeightKg(200);
      setMoisturePercent(11.4);
      setIsVerified(isPreVerified);
      setVerificationError(null);
    }
  }, [booking, isPreVerified]);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop settlement scanner cleanly:", err);
      } finally {
        isStoppingRef.current = false;
        setIsCameraActive(false);
      }
    }
  }, []);

  // Validate scanned or entered token strictly against this booking and farmer
  const validateToken = useCallback(
    async (rawCode: string) => {
      if (!booking) return;

      const payload = parseQrPayload(rawCode);
      const cleanCode = payload.token.trim().toUpperCase();

      if (!cleanCode) {
        setVerificationError("Unreadable QR code. Please scan farmer's official gate pass.");
        return;
      }

      if (!payload.isAgroviaCode && !isValidAgroviaToken(cleanCode)) {
        setVerificationError("Invalid QR Code: Not a recognized Agrovia gate pass.");
        return;
      }

      const expectedToken = (booking.token || "").trim().toUpperCase();
      const expectedId = (booking.id || "").trim().toUpperCase();

      if (cleanCode !== expectedToken && cleanCode !== expectedId) {
        setVerificationError(
          `Farmer Mismatch! Scanned token "${cleanCode}" does not match farmer ${booking.farmerName}'s token (${booking.token}). Only this farmer's QR code can authorize settlement.`
        );
        return;
      }

      if (payload.farmerId && booking.farmerId && payload.farmerId !== booking.farmerId) {
        setVerificationError(
          `Farmer Mismatch! This QR code belongs to another farmer and cannot settle this booking.`
        );
        return;
      }

      setVerificationError(null);
      setIsVerified(true);
      await stopCamera();
    },
    [booking, stopCamera]
  );

  // Start live camera scanner
  const startCamera = useCallback(async () => {
    if (isVerified) return;
    setVerificationError(null);
    await stopCamera();

    const element = document.getElementById("settlement-qr-reader");
    if (!element) return;

    try {
      const scanner = new Html5Qrcode("settlement-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          validateToken(decodedText);
        },
        () => {
          // Frame decode pass (normal)
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed in settlement modal:", err);
      setIsCameraActive(false);
      const msg =
        err?.name === "NotAllowedError" || String(err).includes("Permission")
          ? "Camera permission denied. Please allow camera access to scan farmer QR code."
          : "Camera not available on this device. Please connect a camera to scan farmer QR code.";
      setVerificationError(msg);
    }
  }, [isVerified, validateToken, stopCamera]);

  // Handle camera lifecycle
  useEffect(() => {
    if (!booking) {
      stopCamera();
      return;
    }

    if (!isVerified) {
      const timer = setTimeout(() => {
        startCamera();
      }, 120);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [booking, isVerified, startCamera, stopCamera]);

  // Clean teardown on modal unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!booking) return null;

  const netWeightKg = Math.max(0, grossWeightKg - tareWeightKg);
  const ratePerKg = booking.crop.includes("Wheat")
    ? 23
    : booking.crop.includes("Mustard")
    ? 54
    : booking.crop.includes("Rice")
    ? 38
    : 54;
  const finalPayout = Math.round(netWeightKg * ratePerKg);
  const netQuintals = Number((netWeightKg / 100).toFixed(2));

  const handleSettlementSubmit = () => {
    if (!isVerified) {
      setVerificationError("Farmer verification is mandatory before completing settlement.");
      return;
    }
    onComplete(booking.id, netQuintals, finalPayout);
    onClose();
  };

  const estimatedDisplayKg =
    booking.quantityKg ||
    (booking.estimatedQuantityQuintals ? booking.estimatedQuantityQuintals * 100 : 5000);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-[#E5E5E5]">
            <Scale className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
            <span>Weighbridge Assay &amp; Farmer Settlement</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 transition cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Booking Summary Card */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-neutral-900 dark:text-[#E5E5E5] text-sm">
                  {booking.farmerName}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                  {booking.vehicleNumber ? `Vehicle: ${booking.vehicleNumber} • ` : ""}
                  {booking.crop} (Estimated: {estimatedDisplayKg.toLocaleString("en-IN")} KG)
                </div>
              </div>
              <div className="text-right font-mono text-xs bg-slate-200/80 dark:bg-neutral-800 px-2 py-0.5 rounded font-semibold text-slate-800 dark:text-neutral-200">
                Token: {booking.token}
              </div>
            </div>
          </div>

          {/* ════ MANDATORY FARMER VERIFICATION GATE (QR CODE ONLY) ════ */}
          {!isVerified ? (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wide">
                    Farmer QR Verification Required
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                  Step 1 of 2
                </span>
              </div>

              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-tight">
                To settle this consignment, scan the farmer's Gate Pass QR code.
              </p>

              {/* Camera Scanner Viewfinder */}
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[240px] h-[240px] bg-black rounded-xl overflow-hidden border border-amber-400/60 shadow-inner flex items-center justify-center">
                  <div id="settlement-qr-reader" className="w-full h-full" />

                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-40 border border-amber-400 rounded-lg relative">
                        <div className="absolute w-full h-0.5 bg-amber-400 animate-pulse shadow-[0_0_6px_#F59E0B]" />
                      </div>
                    </div>
                  )}

                  {!isCameraActive && (
                    <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center text-neutral-300">
                      <CameraOff className="w-8 h-8 text-neutral-500 mb-1.5" />
                      <span className="text-[11px] font-medium text-neutral-400">Viewfinder Idle</span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-2 flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Start Camera</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-2">
                  Point camera at farmer's pass with token: <strong className="font-mono">{booking.token}</strong>
                </span>
              </div>

              {/* Error Message */}
              {verificationError && (
                <div className="p-2.5 bg-red-100/80 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-800 dark:text-red-300 font-medium">
                    {verificationError}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Verified Success Banner */
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                    Farmer Verified Successfully
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Token: {booking.token} • Authorized for Weighbridge Check-in
                  </div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

          {/* ════ STEP 2: WEIGHBRIDGE MEASUREMENTS ════ */}
          <div className={`space-y-3 transition-opacity ${!isVerified ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
              <span>Step 2: Weighbridge Scale Input</span>
              <span>Rate: ₹{ratePerKg}/KG</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                  Gross Weight (KG)
                </label>
                <input
                  type="number"
                  value={grossWeightKg}
                  onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                  disabled={!isVerified}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
                />
              </div>
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                  Tare Truck (KG)
                </label>
                <input
                  type="number"
                  value={tareWeightKg}
                  onChange={(e) => setTareWeightKg(Number(e.target.value))}
                  disabled={!isVerified}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
                />
              </div>
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
                disabled={!isVerified}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg font-mono font-semibold text-black dark:text-[#E5E5E5]"
              />
            </div>
          </div>

          {/* ════ CALCULATION PREVIEW ════ */}
          <div className="p-3 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between font-semibold text-[#059669] dark:text-[#5CE65C]">
              <span>Net Consignment Weight:</span>
              <span className="font-mono">{netWeightKg.toLocaleString("en-IN")} KG</span>
            </div>
            <div className="flex justify-between font-bold text-black dark:text-[#E5E5E5] text-sm pt-1 border-t border-[#BBF7D0] dark:border-neutral-800">
              <span>Direct Trade Payout (DBT):</span>
              <span className="text-[#059669] dark:text-[#5CE65C] font-mono">
                ₹ {finalPayout.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSettlementSubmit}
              disabled={!isVerified}
              className={`px-5 py-2 font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                isVerified
                  ? "bg-[#059669] hover:bg-[#047857] text-white cursor-pointer"
                  : "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
              title={!isVerified ? "Scan farmer QR code above to enable settlement" : ""}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete &amp; Issue Settlement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
