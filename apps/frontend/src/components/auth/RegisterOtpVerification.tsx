import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { verifyOtpThunk } from "../../store/slices/authSlice";
import { authApi } from "../../services/auth.api";

interface RegisterOtpVerificationProps {
  email: string;
  onVerifiedSuccess: () => void;
  onBackToStep1: () => void;
}

export function RegisterOtpVerification({
  email,
  onVerifiedSuccess,
  onBackToStep1,
}: RegisterOtpVerificationProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [otpCode, setOtpCode] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otpCode.trim().length !== 6) return;

    try {
      await dispatch(
        verifyOtpThunk({
          identifier: email,
          code: otpCode.trim(),
          type: "EMAIL_VERIFICATION",
        })
      ).unwrap();

      onVerifiedSuccess();
    } catch {
      // Handled in Redux error state
    }
  };

  const handleResend = async () => {
    try {
      setResendStatus("Dispatching new OTP...");
      const res = await authApi.sendOtp({
        identifier: email,
        type: "EMAIL_VERIFICATION",
      });
      setResendStatus(res.message || "New 6-digit OTP dispatched to email!");
      setTimeout(() => setResendStatus(null), 4500);
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || "Failed to resend code");
      setTimeout(() => setResendStatus(null), 4500);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-300/40 flex items-center justify-center text-emerald-800">
        <Mail className="w-6 h-6 text-emerald-700" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verify Mandi Email</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Enter the 6-digit security code dispatched to <span className="font-semibold text-slate-800">{email}</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resendStatus && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300/40 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{resendStatus}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="• • • • • •"
            autoFocus
            className="w-full text-center text-2xl tracking-[0.6em] font-mono py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/70 text-slate-900 placeholder:text-slate-300 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-10 shadow-2xs transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || otpCode.length !== 6}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Verify &amp; Proceed to Location</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={handleResend}
            className="text-emerald-700 hover:text-emerald-800 hover:underline font-semibold cursor-pointer"
          >
            Resend Code
          </button>
          <button
            type="button"
            onClick={onBackToStep1}
            className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
          >
            Change Email
          </button>
        </div>
      </form>
    </div>
  );
}
