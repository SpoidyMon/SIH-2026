import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Truck,
  Scale,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import { Booking } from "../../interfaces";

export interface NotificationItem {
  id: string;
  type: "arrival" | "weighbridge" | "capacity" | "booking" | "price";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
  actionLabel: string;
  badgeColor: string;
}

interface NotificationDropdownProps {
  currentBookings: Booking[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  currentBookings,
  isOpen,
  onToggle,
  onClose,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive initial operational notifications with dynamic integration of currentBookings
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const defaultItems: NotificationItem[] = [
      {
        id: "notif-arrival-1",
        type: "arrival",
        title: "Gate Pass Arrived",
        description: "Harpreet Kaur (MH-15-DK-9042) arrived at Gate 1 with 50 Qtl Mustard.",
        timestamp: "6 min ago",
        read: false,
        actionUrl: "/mandi/bookings",
        actionLabel: "Verify Pass",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      },
      {
        id: "notif-weighbridge-1",
        type: "weighbridge",
        title: "Weighbridge Scale Ready",
        description: "Baldev Singh's consignment gross weight assayed (5,200 KG). Awaiting tare deduction.",
        timestamp: "18 min ago",
        read: false,
        actionUrl: "/mandi/dashboard",
        actionLabel: "Settle Consignment",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      },
      {
        id: "notif-capacity-1",
        type: "capacity",
        title: "Yard Occupancy Warning",
        description: "Yard A & B reached 77.3% capacity (4,250 / 5,500 Qtl). Buffer allocation advised.",
        timestamp: "42 min ago",
        read: false,
        actionUrl: "/mandi/manageSlot",
        actionLabel: "Manage Slots",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      },
      {
        id: "notif-booking-1",
        type: "booking",
        title: "New Advance Booking",
        description: "Rameshwar Patel booked 40 Qtl Soyabean for tomorrow's 09:00 AM slot.",
        timestamp: "1 hr ago",
        read: true,
        actionUrl: "/mandi/bookings",
        actionLabel: "View Details",
        badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      },
      {
        id: "notif-price-1",
        type: "price",
        title: "Mandate Price Alert",
        description: "Indore APMC today's Wheat modal price updated to ₹2,450/Qtl (+2.1%).",
        timestamp: "2 hr ago",
        read: true,
        actionUrl: "/mandi/dashboard",
        actionLabel: "Market Overview",
        badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      },
    ];

    // If there are real arrived or pending bookings in Redux store, prioritize them
    const arrivedBooking = currentBookings.find((b) => b.status === "ARRIVED");
    if (arrivedBooking) {
      defaultItems.unshift({
        id: `dyn-arrived-${arrivedBooking.id}`,
        type: "arrival",
        title: "Vehicle at Inward Gate",
        description: `${arrivedBooking.farmerName || "Farmer"} with ${arrivedBooking.crop} (${arrivedBooking.token}) checked in.`,
        timestamp: "Just now",
        read: false,
        actionUrl: "/mandi/dashboard",
        actionLabel: "Process Inward",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      });
    }

    return defaultItems;
  });

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleActionClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    onClose();
    navigate(notif.actionUrl);
  };

  // Close on outside click without any backdrop blur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "arrival":
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "weighbridge":
        return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "capacity":
        return <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "booking":
        return <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "price":
        return <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={onToggle}
        title="Notifications"
        className={`relative p-2 rounded-xl transition cursor-pointer ${
          isOpen
            ? "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100"
            : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 ring-2 ring-white dark:ring-[#121212]"></span>
          </span>
        )}
      </button>

      {/* Floating Small Window (Dropdown without Background Blur) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[440px] bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 z-50 text-xs overflow-hidden animate-fade-in flex flex-col max-h-[540px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-neutral-900/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-neutral-100">
                Yard Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                  {unreadCount} New
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-1.5 bg-white dark:bg-[#141414]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === "all"
                  ? "bg-slate-900 dark:bg-neutral-200 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === "unread"
                  ? "bg-slate-900 dark:bg-neutral-200 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Scrollable Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-neutral-800/60 no-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-neutral-500 flex flex-col items-center gap-2">
                <Sparkles className="w-7 h-7 text-slate-300 dark:text-neutral-600" />
                <p className="font-medium text-xs">No notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3.5 transition flex gap-3 cursor-pointer group ${
                    notif.read
                      ? "bg-white dark:bg-[#141414] hover:bg-slate-50/80 dark:hover:bg-neutral-800/40"
                      : "bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                  }`}
                >
                  {/* Icon Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${notif.badgeColor}`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          notif.read
                            ? "font-semibold text-slate-800 dark:text-neutral-200"
                            : "font-bold text-slate-900 dark:text-neutral-100"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                      {notif.description}
                    </p>

                    {/* Quick Action Button */}
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(notif);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                      >
                        <span>{notif.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-neutral-500">
              Live Mandi Operational Feed
            </span>
            <button
              onClick={() => {
                onClose();
                navigate("/mandi/bookings");
              }}
              className="font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition"
            >
              View All Bookings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
