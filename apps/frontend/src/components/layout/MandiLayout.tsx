import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  ShieldCheck,
  Settings,
  RotateCw,
  Sun,
  Moon,
  ChevronDown,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  X,
  LogOut,
  User,
  Scale,
  LayoutDashboard,
  QrCode,
  Bell,
  Users,
  Ticket,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchDashboardStatsThunk,
  fetchProfileThunk,
  fetchCurrentBookingsThunk,
  fetchPreviousBookingsThunk,
  fetchSlotsThunk,
  clearMandiSuccess,
  clearMandiError,
} from "../../store/slices/mandiSlice";
import { logoutThunk } from "../../store/slices/authSlice";
import { apiClient } from "../../services/apiClient";

/** Maps URL path segments to the internal nav key used for active-state styling */
function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/mandi/manageSlot") || pathname.startsWith("/mandi/slots")) return "slots";
  if (pathname.startsWith("/mandi/GateScanner") || pathname.startsWith("/mandi/scanner")) return "scanner";
  if (pathname.startsWith("/mandi/bookings")) return "bookings";
  if (pathname.startsWith("/mandi/farmers")) return "farmers";
  if (pathname.startsWith("/mandi/verification")) return "verification";
  if (pathname.startsWith("/mandi/history")) return "history";
  if (pathname.startsWith("/mandi/settings")) return "settings";
  if (pathname.startsWith("/mandi/rating")) return "rating";
  return "dashboard";
}

export function MandiLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAppSelector((state) => state.auth);
  const { stats, profile, successMessage, error, currentBookings, slots } = useAppSelector(
    (state) => state.mandi
  );

  const activeNavTab = getActiveTab(location.pathname);

  const [backendOnline, setBackendOnline] = useState<boolean | null>(true);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);

  const checkHealth = () => {
    setBackendOnline(null);
    apiClient
      .get("/health")
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  };

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkTheme]);

  useEffect(() => {
    dispatch(fetchDashboardStatsThunk());
    dispatch(fetchProfileThunk());
    dispatch(fetchCurrentBookingsThunk());
    dispatch(fetchPreviousBookingsThunk());
    dispatch(fetchSlotsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearMandiSuccess()), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const pendingBookingsCount = currentBookings.filter((b) => b.status === "PENDING").length;
  const activeSlotsCount = slots.length;

  const operatorName = user?.name || "Mandi Operator";
  const operatorRole = user?.role === "MANDI_OPERATOR" ? "Mandi Yard Operator" : "Operator";
  const mandiName = profile?.mandiName || stats?.mandiName || "APMC Mandi Yard";

  const [showBayModal, setShowBayModal] = useState<boolean>(false);

  return (
    <div className={`h-screen w-full flex flex-col ${isDarkTheme ? "bg-[#0a0a0a] text-neutral-100" : "bg-[#edeef2] text-slate-800"} font-sans antialiased overflow-hidden`}>
      {/* ═══ TOP NAVBAR ═══ */}
      <header className="w-full bg-white dark:bg-[#121212] border-b border-slate-200/80 dark:border-neutral-800 px-6 py-3 flex items-center justify-between gap-4 z-10 shrink-0 shadow-2xs">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm bg-emerald-600">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight leading-none">Mandi Setu Portal</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] tracking-wide uppercase">MANDI OPERATOR</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-neutral-400 font-medium mt-0.5">SIH 2026 • Real-time Slot &amp; Arrival Management</span>
          </div>
        </div>

        {/* Right Header Actions (Health, Quick Actions, Theme Switcher, Profile) */}
        <div className="flex items-center gap-3">
          {/* Quick Scanner Icon Button */}
          <button
            onClick={() => navigate("/mandi/GateScanner")}
            title="Open Gate Token Scanner"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Notification Bell */}
          <button
            title="Notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
          >
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-[#121212]"></span>
            <Bell className="w-5 h-5" />
          </button>

          {/* Light / Dark Theme Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
            <button
              onClick={() => setIsDarkTheme(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                !isDarkTheme
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-neutral-400"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setIsDarkTheme(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                isDarkTheme
                  ? "bg-neutral-800 text-neutral-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-neutral-300" />
              <span>Dark</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block"></div>

          {/* Profile Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs uppercase">
                {operatorName.split(" ").map((n) => n[0]).join("").slice(0, 2) || "MO"}
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <p className="font-semibold text-slate-800 dark:text-[#E5E5E5]">{operatorName}</p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-400">{mandiName}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 ml-0.5" />
            </button>

            {/* Dropdown Menu: Clean and only with Settings & Logout */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#121212] rounded-xl shadow-elevated border border-slate-200 dark:border-neutral-800 py-1.5 z-50 text-xs animate-fade-in">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-neutral-800">
                  <p className="font-bold text-slate-900 dark:text-[#E5E5E5]">{mandiName}</p>
                  <p className="text-slate-500 dark:text-neutral-400 text-[11px] truncate mt-0.5">{user?.email || "operator@mandisetu.gov.in"}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    {profile?.mandiCode || "APMC Verified"}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/mandi/settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-[#E5E5E5] hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer text-left font-medium transition"
                  >
                    <Settings className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch(logoutThunk());
                      setShowProfileDropdown(false);
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer text-left font-semibold transition"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ BODY LAYOUT ═══ */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden p-4 sm:p-5">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="w-64 bg-white dark:bg-[#121212] rounded-2xl shadow-subtle border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between p-3.5 shrink-0 select-none">
          {/* Top Section */}
          <div className="space-y-6">
            <nav className="space-y-1 text-sm font-medium" data-purpose="primary-sidebar-nav">
              {/* Dashboard */}
              <button
                onClick={() => navigate("/mandi/dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "dashboard"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </span>
                <span>Dashboard</span>
                <span className="ml-auto text-[11px] bg-slate-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md font-bold text-slate-700 dark:text-neutral-300">
                  {currentBookings.length}
                </span>
              </button>

              {/* Bookings */}
              <button
                onClick={() => navigate("/mandi/bookings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "bookings"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </span>
                <span>Bookings</span>
                {pendingBookingsCount > 0 ? (
                  <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded-md font-semibold">
                    {pendingBookingsCount} Active
                  </span>
                ) : (
                  <span className="ml-auto text-[11px] bg-slate-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md font-bold text-slate-700 dark:text-neutral-300">
                    {currentBookings.length}
                  </span>
                )}
              </button>

              {/* Manage slots */}
              <button
                onClick={() => navigate("/mandi/manageSlot")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "slots"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </span>
                <span>Manage slots</span>
                <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 dark:bg-black border dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md font-semibold">
                  {slots.length > 0 ? `${slots.length} Open` : "Open"}
                </span>
              </button>

              {/* Gate QR Scanner */}
              <button
                onClick={() => navigate("/mandi/GateScanner")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "scanner"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </span>
                <span>Gate QR Scanner</span>
              </button>

              {/* Verification Status */}
              <button
                onClick={() => navigate("/mandi/verification")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "verification"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span>Verification Status</span>
              </button>

              {/* Farmer Database */}
              <button
                onClick={() => navigate("/mandi/farmers")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                  activeNavTab === "farmers"
                    ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </span>
                <span>Farmer Database</span>
              </button>

            </nav>
          </div>

          {/* Bottom Sidebar Section */}
          <div className="space-y-3">
            {/* Yard Capacity Notice Card */}
            <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-black border border-emerald-400 dark:border-neutral-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-[#E5E5E5]">Yard Capacity</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded">77.3% Full</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                4,250 of 5,500 Quintals occupied across Yard A &amp; B.
              </p>
              <div className="w-full bg-slate-200 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: "77.3%" }}></div>
              </div>
              <button
                onClick={() => setShowBayModal(true)}
                className="mt-3 w-full py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-800 dark:text-[#E5E5E5] text-xs font-semibold rounded-lg border border-slate-200 dark:border-neutral-800 shadow-xs transition text-center block cursor-pointer"
              >
                Manage Bay Allocation
              </button>
            </div>

            {/* Mandi Settings Link */}
            <button
              onClick={() => navigate("/mandi/settings")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition cursor-pointer text-left ${
                activeNavTab === "settings"
                  ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-[#E5E5E5] font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Mandi Settings</span>
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto space-y-4 pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => dispatch(clearMandiSuccess())}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => dispatch(clearMandiError())}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      {/* ═══ MODAL: MANAGE BAY ALLOCATION ═══ */}
      {showBayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-[#E5E5E5]">
                <Scale className="w-4 h-4 text-[#059669]" />
                <span>Mandi Yard Bay Allocation & Staging</span>
              </div>
              <button
                onClick={() => setShowBayModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#F0FDF4] dark:bg-black border border-[#BBF7D0] dark:border-emerald-800/60 rounded-xl">
                <div className="font-bold text-[#059669]">Overall Yard Utilization: 77.3%</div>
                <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">4,250 of 5,500 Quintals occupied across Yard A & B.</div>
              </div>

              {/* Yard Bays List */}
              <div className="space-y-2.5">
                <div className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
                  Configured Intake Bays
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black space-y-1">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                      <span>Bay A1 (Wheat)</span>
                      <span className="text-emerald-600">85%</span>
                    </div>
                    <div className="text-[11px] text-gray-500">Capacity: 1,500 Qtl (Occupied: 1,275 Qtl)</div>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black space-y-1">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                      <span>Bay A2 (Mustard)</span>
                      <span className="text-emerald-600">72%</span>
                    </div>
                    <div className="text-[11px] text-gray-500">Capacity: 1,200 Qtl (Occupied: 864 Qtl)</div>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black space-y-1">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                      <span>Bay B1 (Basmati Rice)</span>
                      <span className="text-emerald-600">68%</span>
                    </div>
                    <div className="text-[11px] text-gray-500">Capacity: 1,500 Qtl (Occupied: 1,020 Qtl)</div>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black space-y-1">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                      <span>Bay B2 (Soyabean)</span>
                      <span className="text-amber-600">84%</span>
                    </div>
                    <div className="text-[11px] text-gray-500">Capacity: 1,300 Qtl (Occupied: 1,091 Qtl)</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBayModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowBayModal(false)}
                  className="px-5 py-2 font-bold bg-[#059669] hover:bg-[#047857] text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Save Bay Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
