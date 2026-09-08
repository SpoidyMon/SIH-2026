import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, KeyRound, CheckCircle2, Sprout } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { MandiRegisterWizard } from "./MandiRegisterWizard";
import { authApi } from "../../services/auth.api";
import { useAppDispatch } from "../../store";
import { completeOnboarding, cancelOnboarding } from "../../store/slices/authSlice";

interface AuthPageProps {
  initialMode?: "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">(() => {
    if (initialMode) return initialMode;
    if (location.pathname === "/register") return "REGISTER";
    return "LOGIN";
  });

  const { otpRequiredForEmail, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("REGISTER");
    } else if (location.pathname === "/login") {
      setMode("LOGIN");
    }
  }, [location.pathname]);

  // Auto-navigate to incomplete registration wizard if login rejected due to incomplete onboarding or missing verification
  useEffect(() => {
    if (otpRequiredForEmail && (error?.includes("incomplete") || error?.includes("verified"))) {
      setMode("REGISTER");
      navigate(`/register?step=location&email=${encodeURIComponent(otpRequiredForEmail)}`);
    }
  }, [otpRequiredForEmail, error, navigate]);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message || "If registered, a password recovery link has been dispatched.");
    } catch (err: any) {
      setForgotMsg(err.response?.data?.message || "Failed to request reset.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const switchToLogin = () => {
    dispatch(cancelOnboarding());
    setMode("LOGIN");
    navigate("/login");
  };

  const switchToRegister = () => {
    setMode("REGISTER");
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Top Navbar / Header */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Mandi Setu Portal</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              APMC Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Official APMC Market Yard Gateway</span>
        </div>
      </header>

      {/* Center Auth / Onboarding Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className={`w-full ${mode === "REGISTER" ? "max-w-4xl" : "max-w-lg"} bg-white border border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-sm transition-all duration-300`}>
          {mode === "FORGOT_PASSWORD" ? (
            /* Forgot Password Screen */
            <div className="space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Password Recovery</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your registered APMC Mandi operator email address to receive reset instructions.
                </p>
              </div>

              {forgotMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300/40 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Operator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="operator@apmc.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isForgotLoading ? "Sending Instructions..." : "Send Recovery Link"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : mode === "REGISTER" ? (
            /* 3-Step Mandi Registration Wizard */
            <MandiRegisterWizard
              onSwitchToLogin={switchToLogin}
              onFinishRegistration={() => {
                dispatch(completeOnboarding());
                navigate("/mandi/dashboard");
              }}
            />
          ) : (
            /* Mandi Operator Login Form */
            <LoginForm
              onSwitchToRegister={switchToRegister}
              onSwitchToForgotPassword={() => setMode("FORGOT_PASSWORD")}
            />
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="h-12 px-6 sm:px-10 flex items-center justify-between border-t border-slate-200/80 text-xs text-slate-500 bg-white">
        <span>© 2026 Mandi Setu Network</span>
        <span>Electronic APMC Operations Gateway</span>
      </footer>
    </div>
  );
}
