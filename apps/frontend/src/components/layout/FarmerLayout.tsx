import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  CalendarCheck,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sprout,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { logoutThunk } from "../../store/slices/authSlice";

export function FarmerLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/farmer/dashboard" },
    { label: "Find Mandi / Book Slot", icon: Store, path: "/farmer/mandis" },
    { label: "My Bookings", icon: CalendarCheck, path: "/farmer/bookings" },
    {
      label: "Accepted Bookings",
      icon: CheckCircle2,
      path: "/farmer/bookings?status=ACCEPTED",
      matchQuery: "ACCEPTED",
    },
    {
      label: "Completed Bookings",
      icon: CheckCheck,
      path: "/farmer/bookings?status=COMPLETED",
      matchQuery: "COMPLETED",
    },
    {
      label: "Rejected Bookings",
      icon: XCircle,
      path: "/farmer/bookings?status=REJECTED",
      matchQuery: "REJECTED",
    },
    { label: "Notifications", icon: Bell, path: "/farmer/notifications" },
    { label: "Profile", icon: User, path: "/farmer/profile" },
    { label: "Settings", icon: Settings, path: "/farmer/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#0B2D1B] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C8F52F] text-[#0B2D1B] flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Mandi Setu</h1>
            <p className="text-[10px] text-emerald-300 font-medium">Farmer Direct Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-200 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B2D1B] text-white flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static md:inset-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="hidden md:flex items-center gap-3 p-5 border-b border-emerald-900/60">
            <div className="w-10 h-10 rounded-2xl bg-[#C8F52F] text-[#0B2D1B] flex items-center justify-center font-bold text-xl shadow-md">
              S
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide">Mandi Setu</h1>
              <p className="text-xs text-emerald-400 font-medium">Farmer Direct Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Main Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isQueryActive = item.matchQuery
                ? location.search.includes(`status=${item.matchQuery}`)
                : location.pathname === item.path && !location.search;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isQueryActive
                      ? "bg-[#C8F52F] text-[#0B2D1B] shadow-sm font-bold"
                      : "text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-emerald-900/60 bg-emerald-950/40">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || "F"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Farmer Account"}</p>
              <p className="text-[10px] text-emerald-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
