import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  CalendarCheck,
  LayoutGrid,
  CalendarDays,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  createSlotThunk,
  deleteSlotThunk,
  fetchSlotsThunk,
  fetchCommoditiesThunk,
} from "../../store/slices/mandiSlice";
import { MandiSlot, CreateSlotPayload } from "../../interfaces";
import { MandiWeeklyAvailability } from "./MandiWeeklyAvailability";
import { MandiInteractiveCalendar } from "./MandiInteractiveCalendar";
import { MandiOperatingScheduleCard } from "./MandiOperatingScheduleCard";
import { MandiSlotCard } from "./MandiSlotCard";
import { MandiCreateSlotModal } from "./MandiCreateSlotModal";

type SlotTab = "availability" | "calendar" | "operating_rules";

export function MandiSlotsView() {
  const dispatch = useAppDispatch();
  const { slots, profile, isActionLoading } = useAppSelector((state) => state.mandi);

  const [activeTab, setActiveTab] = useState<SlotTab>("availability");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MandiSlot | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string>("2026-09-08");

  useEffect(() => {
    dispatch(fetchSlotsThunk());
    dispatch(fetchCommoditiesThunk());
  }, [dispatch]);

  const handleOpenCreateModal = useCallback((presetDate?: string) => {
    setEditingSlot(null);
    if (presetDate) {
      setDefaultModalDate(presetDate);
    } else if (dateFilter) {
      setDefaultModalDate(dateFilter);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDefaultModalDate(today);
    }
    setShowCreateModal(true);
  }, [dateFilter]);

  const handleOpenEditModal = useCallback((slot: MandiSlot) => {
    setEditingSlot(slot);
    setShowCreateModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingSlot(null);
  }, []);

  const handleSaveSlot = useCallback(
    (payload: CreateSlotPayload) => {
      dispatch(createSlotThunk(payload));
      setShowCreateModal(false);
      setEditingSlot(null);
    },
    [dispatch]
  );

  const handleDeleteSlot = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to remove this arrival slot window?")) {
        dispatch(deleteSlotThunk(id));
      }
    },
    [dispatch]
  );

  const filteredSlots = useMemo(() => {
    if (!dateFilter) return slots;
    return slots.filter((slot) => {
      const slotDate = slot.slotDate || slot.date;
      return slotDate === dateFilter;
    });
  }, [slots, dateFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12 font-sans">
      {/* ═══ HEADER & VIEW SWITCHER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#E5E5E5] tracking-tight">
            Manage Mandi Arrival Slots &amp; Availability
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
            Configure weekly schedules, interactive yard calendar, arrival capacities &amp; weighbridge buffers.
          </p>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-black p-1 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("availability")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "availability"
                ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-2xs border border-gray-200/60 dark:border-neutral-700"
                : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Weekly Availability</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-2xs border border-gray-200/60 dark:border-neutral-700"
                : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operating_rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "operating_rules"
                ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-2xs border border-gray-200/60 dark:border-neutral-700"
                : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Yard Rules &amp; Closed Days</span>
          </button>
        </div>
      </div>

      {/* ═══ TAB 1: WEEKLY AVAILABILITY (SCREENSHOT MATCHING SCHEDULER) ═══ */}
      {activeTab === "availability" && (
        <section className="space-y-4 animate-fade-in">
          <MandiWeeklyAvailability />
        </section>
      )}

      {/* ═══ TAB 2: INTERACTIVE LIVE MONTHLY CALENDAR ═══ */}
      {activeTab === "calendar" && (
        <section className="space-y-4 animate-fade-in">
          <MandiInteractiveCalendar
            slots={slots}
            selectedDate={dateFilter}
            onSelectDate={(date) => setDateFilter(date)}
            onOpenCreateModalForDate={(date) => handleOpenCreateModal(date)}
            closedDays={profile?.closedDays}
            closedHours={profile?.closedHours}
          />
        </section>
      )}

      {/* ═══ TAB 3: OPERATING SCHEDULE & CLOSED DAYS (FROM SETTINGS) ═══ */}
      {activeTab === "operating_rules" && (
        <section className="space-y-4 animate-fade-in">
          <MandiOperatingScheduleCard />
        </section>
      )}

      {/* ═══ SECTION: LIVE ACTIVE ARRIVAL SLOTS LIST & CAPACITY GRID ═══ */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#E5E5E5] tracking-tight flex items-center gap-2">
              <span>Live Arrival Windows &amp; Capacity</span>
              {dateFilter && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold font-mono">
                  {dateFilter}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
              Showing {filteredSlots.length} arrival {filteredSlots.length === 1 ? "window" : "windows"} configured in the database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Date Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
                Filter Date:
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C] cursor-pointer shadow-2xs [color-scheme:dark]"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Create Custom Slot */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="btn-primary-green flex items-center gap-2 px-3.5 py-1.5 text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Slot</span>
            </button>
          </div>
        </div>

        {/* Slots Grid */}
        {filteredSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSlots.map((slot) => (
              <MandiSlotCard
                key={slot.id}
                slot={slot}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteSlot}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-gray-50/50 dark:bg-neutral-900/30 border border-dashed border-gray-300 dark:border-neutral-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-[#E5E5E5]">
              {dateFilter
                ? `No Arrival Slots Scheduled for ${dateFilter}`
                : "No Active Arrival Slots Found"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
              Use the Availability scheduler to generate weekly slots, click dates on the Interactive Calendar, or create a custom single slot.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => handleOpenCreateModal()}
                className="btn-primary-green px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Create Slot for {dateFilter || "Today"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ MODAL: CREATE / EDIT ARRIVAL SLOT ═══ */}
      <MandiCreateSlotModal
        isOpen={showCreateModal}
        editingSlot={editingSlot}
        onClose={handleCloseModal}
        onSave={handleSaveSlot}
        closedDays={profile?.closedDays}
        isActionLoading={isActionLoading}
      />
    </div>
  );
}
