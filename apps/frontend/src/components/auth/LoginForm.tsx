import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw, AlertCircle, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { loginMandiThunk, clearAuthError } from "../../store/slices/authSlice";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    dispatch(loginMandiThunk({ identifier, password }));
  };

  const handleQuickDemo = () => {
    setIdentifier("mandi.approved@agrimarket.gov.in");
    setPassword("Password@123");
    dispatch(
      loginMandiThunk({
        identifier: "mandi.approved@agrimarket.gov.in",
        password: "Password@123",
      })
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mandi Sign In</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Enter credentials to open your APMC market yard portal
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-300/40 flex items-center justify-center text-emerald-800">
          <Store className="w-5 h-5" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email or Phone Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Official Email Address or Phone
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="operator@mandisetu.gov.in"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
              required
            />
          </div>
        </div>

        {/* Password Input with Show/Hide Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-semibold cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your security password"
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign In to Mandi Portal"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Quick Demo: Sign In as Indore APMC (Rupesh Sharma)</span>
          </button>
        </div>

        <div className="text-center pt-1 text-xs text-slate-500">
          Need an APMC yard account?{" "}
          <button
            type="button"
            onClick={() => {
              dispatch(clearAuthError());
              onSwitchToRegister();
            }}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Register New Mandi
          </button>
        </div>
      </form>
    </div>
  );
}
