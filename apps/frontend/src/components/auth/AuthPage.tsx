import React, { useState } from "react";
import { Store, ShieldCheck, Mail, Lock, Phone, User, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { loginMandiThunk, registerMandiThunk, verifyOtpThunk, setOtpEmail, clearAuthError } from "../../store/slices/authSlice";
import { authApi } from "../../services/auth.api";

export function AuthPage() {
  const dispatch = useAppDispatch();
  const { isLoading, error, otpRequiredForEmail } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    dispatch(loginMandiThunk({ identifier, password }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    dispatch(
      registerMandiThunk({
        name,
        email,
        phone: phone || undefined,
        password,
        role: "MANDI_OPERATOR",
      })
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpRequiredForEmail || !otpCode) return;
    dispatch(
      verifyOtpThunk({
        identifier: otpRequiredForEmail,
        code: otpCode.trim(),
        type: "EMAIL_VERIFICATION",
      })
    );
  };

  const handleResendOtp = async () => {
    if (!otpRequiredForEmail) return;
    try {
      setResendStatus("Sending new OTP...");
      const res = await authApi.sendOtp({
        identifier: otpRequiredForEmail,
        type: "EMAIL_VERIFICATION",
      });
      setResendStatus(res.message || "OTP resent successfully!");
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      setForgotMsg("Dispatching password reset instructions...");
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message || "If registered, a reset link has been dispatched.");
    } catch (err: any) {
      setForgotMsg(err.response?.data?.message || "Failed to request reset.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0D1F12] flex flex-col justify-between">
      {/* Top Simple Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-[#E5EAE5] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5CE65C] flex items-center justify-center text-[#0D1F12] font-black text-xl shadow-xs">
            M
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#0D1F12]">Agrovia Mandi</span>
            <span className="ml-2.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDFDF0] text-[#14532D] border border-[#5CE65C]/30">
              APMC Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#526655]">
          <ShieldCheck className="w-4 h-4 text-[#5CE65C]" />
          <span>Official APMC Market Yard Gateway</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="w-full max-w-md bg-white border border-[#E5EAE5] p-8 sm:p-10 rounded-3xl shadow-sm">
          {/* 1. OTP Verification Screen */}
          {otpRequiredForEmail ? (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDFDF0] border border-[#5CE65C]/40 flex items-center justify-center text-[#14532D] mb-4">
                <Mail className="w-6 h-6 text-[#14532D]" />
              </div>
              <h2 className="text-2xl font-black text-[#0D1F12] mb-1">Verify Mandi Email</h2>
              <p className="text-xs text-[#526655] mb-6">
                Enter the 6-digit OTP code dispatched to <span className="font-bold text-[#0D1F12]">{otpRequiredForEmail}</span>.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus && (
                <div className="mb-4 p-3 rounded-xl bg-[#EDFDF0] border border-[#5CE65C]/40 text-[#14532D] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#14532D]" />
                  <span>{resendStatus}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] uppercase tracking-wider mb-2">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3.5 border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] focus:border-transparent bg-[#F9FAF9]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3.5 px-4 bg-[#5CE65C] hover:bg-[#4ED64E] text-[#0D1F12] font-black rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Enter Mandi Cockpit"}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#14532D] hover:underline font-bold"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(setOtpEmail(null))}
                    className="text-[#526655] hover:text-[#0D1F12]"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : mode === "FORGOT_PASSWORD" ? (
            /* 2. Forgot Password Screen */
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F9FAF9] border border-[#E5EAE5] flex items-center justify-center text-[#0D1F12] mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-[#0D1F12] mb-1">Password Recovery</h2>
              <p className="text-xs text-[#526655] mb-6">
                Enter your registered APMC Mandi operator email address to receive reset instructions.
              </p>

              {forgotMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#EDFDF0] border border-[#5CE65C]/40 text-[#14532D] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1.5">Official Operator Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#526655]" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="mandi.approved@agrimarket.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#5CE65C] hover:bg-[#4ED64E] text-[#0D1F12] font-black rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Send Recovery Link
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("LOGIN");
                      setForgotMsg(null);
                    }}
                    className="text-xs text-[#526655] hover:text-[#0D1F12] font-bold"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : mode === "REGISTER" ? (
            /* 3. Mandi Operator Registration */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0D1F12]">Register APMC Mandi</h2>
                  <p className="text-xs text-[#526655] mt-0.5">Create your market yard operator account</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EDFDF0] border border-[#5CE65C]/30 flex items-center justify-center text-[#14532D]">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1">Operator Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-[#526655]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Suresh Patel"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1">Official Mandi Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#526655]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@apmc.gov.in"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#526655]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#526655]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters (letters & numbers)"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-[#5CE65C] hover:bg-[#4ED64E] text-[#0D1F12] font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Register Mandi Account"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2 text-xs text-[#526655]">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearAuthError());
                      setMode("LOGIN");
                    }}
                    className="font-bold text-[#0D1F12] hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 4. Mandi Operator Login */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0D1F12]">Mandi Sign In</h2>
                  <p className="text-xs text-[#526655] mt-0.5">Enter credentials to open APMC cockpit</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EDFDF0] border border-[#5CE65C]/30 flex items-center justify-center text-[#14532D]">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0D1F12] mb-1.5">Email Address or Phone</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#526655]" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="mandi.approved@agrimarket.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0D1F12]">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode("FORGOT_PASSWORD")}
                      className="text-xs text-[#14532D] hover:underline font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#526655]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#E5EAE5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5CE65C] bg-[#F9FAF9]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#5CE65C] hover:bg-[#4ED64E] text-[#0D1F12] font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign In to Mandi Cockpit"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("mandi.approved@agrimarket.gov.in");
                      setPassword("Password@123");
                      dispatch(loginMandiThunk({ identifier: "mandi.approved@agrimarket.gov.in", password: "Password@123" }));
                    }}
                    className="w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Store className="w-4 h-4 text-[#15803D]" />
                    <span>Quick Demo: Sign In as Indore APMC (Rupesh Sharma)</span>
                  </button>
                </div>

                <div className="text-center pt-1 text-xs text-[#526655]">
                  Need an APMC yard account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearAuthError());
                      setMode("REGISTER");
                    }}
                    className="font-bold text-[#0D1F12] hover:underline cursor-pointer"
                  >
                    Register New Mandi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="h-14 px-8 flex items-center justify-between border-t border-[#E5EAE5] text-xs text-[#526655] bg-white">
        <span>© 2026 Agrovia Mandi Network</span>
        <span>Electronic APMC Operations Gateway</span>
      </footer>
    </div>
  );
}
