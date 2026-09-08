import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Store, Phone, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { registerMandiThunk, clearAuthError } from "../../store/slices/authSlice";

interface RegisterStep1CredentialsProps {
  onSuccessRegistered: (email: string) => void;
  onSwitchToLogin: () => void;
}

export function RegisterStep1Credentials({
  onSuccessRegistered,
  onSwitchToLogin,
}: RegisterStep1CredentialsProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [mandiName, setMandiName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !mandiName) return;

    try {
      const res = await dispatch(
        registerMandiThunk({
          name: name.trim(),
          mandiName: mandiName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          role: "MANDI_OPERATOR",
        })
      ).unwrap();

      const targetEmail = res?.email || email.trim().toLowerCase();
      onSuccessRegistered(targetEmail);
    } catch {
      // Handled in Redux error state
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Register Mandi</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Step 1 of 3: Account credentials &amp; Mandi details
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300/40 flex items-center justify-center text-emerald-800">
          <Store className="w-5 h-5" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3">
        {/* Name of Mandi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Name of APMC Mandi Yard <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <Store className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={mandiName}
              onChange={(e) => setMandiName(e.target.value)}
              placeholder="e.g. APMC Market Yard Indore"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
              required
            />
          </div>
        </div>

        {/* Operator Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Operator Full Name <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
              required
            />
          </div>
        </div>

        {/* Official Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Official Email Address <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@apmc.gov.in"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
              required
            />
          </div>
        </div>

        {/* Phone Number (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Contact Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
            />
          </div>
        </div>

        {/* Password with Show/Hide Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Security Password <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters (letters & digits)"
              className="w-full pl-10 pr-10 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
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
          className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify OTP & Continue"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-2 text-xs text-slate-500">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => {
              dispatch(clearAuthError());
              onSwitchToLogin();
            }}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Sign In Instead
          </button>
        </div>
      </form>
    </div>
  );
}
