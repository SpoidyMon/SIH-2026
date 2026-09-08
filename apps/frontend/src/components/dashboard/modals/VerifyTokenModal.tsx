import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  X,
  Camera,
  Upload,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CameraOff,
} from "lucide-react";
import { VerifyTokenModalProps } from "../../../interfaces";
import { extractTokenFromQrData } from "../../../utils/qr.util";

type VerificationMode = "camera" | "upload" | "manual";

export const VerifyTokenModal: React.FC<VerifyTokenModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  initialToken = "",
}) => {
  const [activeTab, setActiveTab] = useState<VerificationMode>("camera");
  const [manualToken, setManualToken] = useState(initialToken);
  const [detectedToken, setDetectedToken] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef(false);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Failed to cleanly stop camera scanner", err);
      } finally {
        isStoppingRef.current = false;
        setIsCameraActive(false);
      }
    }
  }, []);

  // Handle successful QR read
  const handleDecodedCode = useCallback(
    async (decodedText: string) => {
      const cleanToken = extractTokenFromQrData(decodedText);
      if (!cleanToken) return;

      setDetectedToken(cleanToken);
      setIsProcessing(true);
      await stopCamera();

      // Short delay for visual confirmation before firing onVerify
      setTimeout(() => {
        onVerify(cleanToken);
        setIsProcessing(false);
        setDetectedToken(null);
        setManualToken("");
        onClose();
      }, 650);
    },
    [onVerify, onClose, stopCamera]
  );

  // Start camera scanner
  const startCamera = useCallback(async () => {
    setScannerError(null);
    setDetectedToken(null);

    // Stop any existing instance
    await stopCamera();

    const element = document.getElementById("mandi-qr-reader");
    if (!element) return;

    try {
      const scanner = new Html5Qrcode("mandi-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        () => {
          // Frame decode failure (normal when scanning empty space)
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setIsCameraActive(false);
      const errMsg =
        err?.name === "NotAllowedError" || String(err).includes("Permission")
          ? "Camera permission was denied. Please allow camera access in your browser or use Manual/Upload options."
          : err?.name === "NotFoundError" || String(err).includes("NotFound")
          ? "No camera device detected on this system. Please use Image Upload or Manual Entry."
          : "Unable to access camera. Please check browser permissions or switch to File Upload / Manual entry.";
      setScannerError(errMsg);
    }
  }, [handleDecodedCode, stopCamera]);

  // Lifecycle when modal opens/closes or active tab changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedToken(null);
      setScannerError(null);
      setIsProcessing(false);
      return;
    }

    if (activeTab === "camera") {
      // Small timeout to allow DOM element to render
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Reset initial token when opened
  useEffect(() => {
    if (isOpen && initialToken) {
      setManualToken(initialToken);
    }
  }, [isOpen, initialToken]);

  // Handle Image File Upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError(null);
    setIsProcessing(true);

    try {
      // Temporary instance for file decoding
      const fileScanner = new Html5Qrcode("mandi-qr-reader-file-temp");
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();

      if (decodedText) {
        handleDecodedCode(decodedText);
      } else {
        setScannerError("No readable QR code found in the selected image.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      setScannerError("Could not detect a valid QR code in this image. Please try another image or manual entry.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Manual Form Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualToken.trim();
    if (!clean) return;
    onVerify(clean);
    setManualToken("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-[#E5E5E5]">
            <QrCode className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
            <span>Mandi Gate Arrival Verification</span>
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

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/40 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "camera"
                ? "bg-white dark:bg-[#181818] text-[#059669] dark:text-[#5CE65C] shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-[#181818] text-[#059669] dark:text-[#5CE65C] shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-white dark:bg-[#181818] text-[#059669] dark:text-[#5CE65C] shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Enter Token</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 flex flex-col justify-center">
          {/* 1. Camera Mode */}
          {activeTab === "camera" && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[280px] h-[280px] bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner flex items-center justify-center">
                {/* HTML5 QR Container */}
                <div id="mandi-qr-reader" className="w-full h-full" />

                {/* Overlaid Viewfinder Target */}
                {isCameraActive && !detectedToken && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-xl relative flex items-center justify-center">
                      <div className="absolute w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />
                    </div>
                  </div>
                )}

                {/* Success Scan Overlay */}
                {detectedToken && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      QR Code Detected!
                    </span>
                    <span className="text-lg font-mono font-bold text-white mt-1">
                      {detectedToken}
                    </span>
                    <span className="text-[11px] text-emerald-200/80 mt-1">
                      Verifying gate arrival authorization...
                    </span>
                  </div>
                )}

                {/* Camera Inactive / Error Overlay */}
                {!isCameraActive && !detectedToken && (
                  <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center text-neutral-300">
                    <CameraOff className="w-10 h-10 text-neutral-500 mb-2" />
                    <p className="text-xs font-semibold text-neutral-300">Camera Viewfinder Idle</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {scannerError && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">{scannerError}</p>
                </div>
              )}

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mt-3">
                Align the farmer's Gate Pass QR code inside the frame to scan automatically.
              </p>
            </div>
          )}

          {/* 2. Image File Upload Mode */}
          {activeTab === "upload" && (
            <div className="flex flex-col items-center">
              {/* Hidden temp element for file scanner */}
              <div id="mandi-qr-reader-file-temp" className="hidden" />

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-file-input"
              />

              <label
                htmlFor="qr-file-input"
                className="w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-neutral-50/50 dark:bg-neutral-900/30 transition p-4 text-center"
              >
                {detectedToken ? (
                  <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-10 h-10 mb-1" />
                    <span className="text-xs font-bold uppercase">Decoded: {detectedToken}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-[#E5E5E5]">
                        Click to select or drag QR Image
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Supports PNG, JPG, or Screenshots
                      </p>
                    </div>
                  </>
                )}
              </label>

              {scannerError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2 text-left w-full">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{scannerError}</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Manual Token Mode */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase">
                  Arrival Token Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="e.g. 8SEP-10AM-001 or TKN-7821"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-xl text-sm font-mono text-black dark:text-[#E5E5E5] placeholder:text-neutral-400 focus:outline-none focus:border-[#059669]"
                    autoFocus
                  />
                  <QrCode className="w-4 h-4 text-neutral-400 absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
                  Enter the 8-12 character token printed on the farmer's slip or SMS.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualToken.trim() || isProcessing}
                  className="px-5 py-2 text-xs font-semibold bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Verify Gate Entry
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
