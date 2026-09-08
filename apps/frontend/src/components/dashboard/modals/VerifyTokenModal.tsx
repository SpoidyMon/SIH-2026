import React, { useState } from "react";
import { QrCode, X } from "lucide-react";

interface VerifyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => void;
}

export const VerifyTokenModal: React.FC<VerifyTokenModalProps> = ({
  isOpen,
  onClose,
  onVerify,
}) => {
  const [tokenInput, setTokenInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    onVerify(tokenInput.trim());
    setTokenInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-[#E5E5E5]">
            <QrCode className="w-4 h-4 text-[#059669] dark:text-[#5CE65C]" />
            <span>Verify Gate Pass / Arrival Token</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase">
              Scan QR or Enter Token ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. TKN-7821 or TKN-3190"
                className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-xl text-sm font-mono text-black dark:text-[#E5E5E5] placeholder:text-neutral-400 focus:outline-none focus:border-[#059669]"
                autoFocus
              />
              <QrCode className="w-4 h-4 text-neutral-400 absolute right-3 top-3.5" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Sample active tokens: <strong className="text-black dark:text-[#E5E5E5] font-mono font-semibold">TKN-7821</strong>, <strong className="text-black dark:text-[#E5E5E5] font-mono font-semibold">TKN-3190</strong>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-xl shadow-xs cursor-pointer"
            >
              Grant Gate Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
