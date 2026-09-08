import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  CalendarCheck,
  TrendingUp,
  Sprout,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAppSelector } from "../../store";

export function FarmerDashboardView() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B2D1B] via-[#124027] to-[#1a5736] rounded-3xl p-6 md:p-8 text-white shadow-sm border border-emerald-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8F52F]/20 text-[#C8F52F] text-xs font-semibold mb-3 border border-[#C8F52F]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct APMC Market Access</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Farmer"}!
            </h1>
            <p className="text-sm text-emerald-200/80 mt-1">
              Book arrival slots at nearby APMC Mandis, track intake status, and access direct weighment settlements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/farmer/mandis")}
            className="px-6 py-3 bg-[#C8F52F] hover:bg-[#bbf01a] text-[#0B2D1B] font-extrabold rounded-2xl flex items-center justify-center gap-2 transition text-xs shadow-sm cursor-pointer shrink-0"
          >
            <Store className="w-4 h-4" />
            <span>Book Mandi Slot Now</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nearby Mandis</p>
            <h3 className="text-xl font-extrabold text-slate-900">8 APMCs</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Bookings</p>
            <h3 className="text-xl font-extrabold text-slate-900">1 Pending</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Tomato Rate</p>
            <h3 className="text-xl font-extrabold text-slate-900">₹24 / kg</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KYC Status</p>
            <h3 className="text-xl font-extrabold text-emerald-700">Verified</h3>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Find Mandi &amp; Book Arrival</h3>
            <p className="text-xs text-slate-500 mt-1">
              Locate open mandis near you, filter by crops accepted, and select convenient intake time slots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/farmer/mandis")}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Explore Mandis</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Track My Arrival Bookings</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check if your booking request was accepted, view gate QR codes, or review final settlement payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/farmer/bookings")}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800"
          >
            <span>View Bookings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
