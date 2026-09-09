import React, { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  Sprout,
  Edit3,
  Trash2,
  SlidersHorizontal,
  X,
  Save,
  Radio,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchCropRatesThunk,
  updateCropRatesThunk,
} from "../../store/slices/mandiSlice";
import { CropRateItem } from "../../interfaces";

export function MandiCropPricingView() {
  const dispatch = useAppDispatch();
  const { cropRates, isLoading, isActionLoading, profile } = useAppSelector(
    (state) => state.mandi
  );

  // Local working copy of crop rates
  const [localRates, setLocalRates] = useState<CropRateItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCrop, setEditingCrop] = useState<CropRateItem | null>(null);

  // Form states for Add / Edit
  const [cropName, setCropName] = useState<string>("");
  const [variety, setVariety] = useState<string>("");
  const [ratePerKg, setRatePerKg] = useState<number>(25);
  const [minRate, setMinRate] = useState<number>(22);
  const [maxRate, setMaxRate] = useState<number>(28);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Fetch initial rates on mount
  useEffect(() => {
    dispatch(fetchCropRatesThunk());
  }, [dispatch]);

  // Sync Redux state into local editable state
  useEffect(() => {
    if (cropRates && cropRates.length > 0) {
      setLocalRates(cropRates);
      setHasUnsavedChanges(false);
    }
  }, [cropRates]);

  // Handle direct numeric rate adjustment (+ / - or direct input)
  const handleRateStep = (cropName: string, delta: number) => {
    setLocalRates((prev) =>
      prev.map((item) => {
        if (item.crop === cropName) {
          const newRate = Math.max(1, (item.ratePerKg || 0) + delta);
          return {
            ...item,
            ratePerKg: newRate,
            minRate: item.minRate ? Math.min(item.minRate, newRate - 2) : Math.max(1, newRate - 2),
            maxRate: item.maxRate ? Math.max(item.maxRate, newRate + 2) : newRate + 3,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleRateChange = (cropName: string, value: number) => {
    if (isNaN(value) || value <= 0) return;
    setLocalRates((prev) =>
      prev.map((item) => {
        if (item.crop === cropName) {
          return {
            ...item,
            ratePerKg: value,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Toggle active status
  const handleToggleActive = (cropName: string) => {
    setLocalRates((prev) =>
      prev.map((item) => {
        if (item.crop === cropName) {
          return {
            ...item,
            isActive: item.isActive === false ? true : false,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Delete a crop from procurement list
  const handleDeleteCrop = (cropName: string) => {
    if (window.confirm(`Are you sure you want to remove ${cropName} from Mandi procurement?`)) {
      setLocalRates((prev) => prev.filter((item) => item.crop !== cropName));
      setHasUnsavedChanges(true);
    }
  };

  // Save changes to backend
  const handleSaveAll = async () => {
    if (localRates.length === 0) return;
    await dispatch(updateCropRatesThunk({ cropRates: localRates }));
    setHasUnsavedChanges(false);
  };

  // Open Edit Modal
  const openEditModal = (item: CropRateItem) => {
    setEditingCrop(item);
    setCropName(item.crop);
    setVariety(item.variety || "");
    setRatePerKg(item.ratePerKg);
    setMinRate(item.minRate || item.ratePerKg - 2);
    setMaxRate(item.maxRate || item.ratePerKg + 2);
    setTrend(item.trend || "stable");
    setIsActive(item.isActive !== false);
  };

  // Save from modal (either Add or Edit)
  const handleSaveModal = () => {
    if (!cropName.trim()) return;

    if (editingCrop) {
      // Edit existing
      setLocalRates((prev) =>
        prev.map((item) => {
          if (item.crop === editingCrop.crop) {
            return {
              ...item,
              crop: cropName.trim(),
              variety: variety.trim() || undefined,
              ratePerKg: Number(ratePerKg),
              minRate: Number(minRate),
              maxRate: Number(maxRate),
              trend,
              isActive,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );
    } else {
      // Add new
      const newItem: CropRateItem = {
        crop: cropName.trim(),
        variety: variety.trim() || "Standard Grade",
        ratePerKg: Number(ratePerKg),
        minRate: Number(minRate),
        maxRate: Number(maxRate),
        trend,
        isActive,
        unit: "kg",
        updatedAt: new Date().toISOString(),
      };
      setLocalRates((prev) => [newItem, ...prev.filter((c) => c.crop.toLowerCase() !== cropName.trim().toLowerCase())]);
    }

    setHasUnsavedChanges(true);
    setEditingCrop(null);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCropName("");
    setVariety("");
    setRatePerKg(25);
    setMinRate(22);
    setMaxRate(28);
    setTrend("stable");
    setIsActive(true);
  };

  // Filtered crops
  const filteredCrops = useMemo(() => {
    return localRates.filter((item) => {
      const matchesSearch =
        item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.variety && item.variety.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return item.isActive !== false;
      if (statusFilter === "PAUSED") return item.isActive === false;
      return true;
    });
  }, [localRates, searchQuery, statusFilter]);

  // Derived metrics
  const activeCount = localRates.filter((c) => c.isActive !== false).length;
  const avgRate =
    activeCount > 0
      ? Math.round(
          localRates
            .filter((c) => c.isActive !== false)
            .reduce((sum, c) => sum + (Number(c.ratePerKg) || 0), 0) / activeCount
        )
      : 0;

  const topCrop = useMemo(() => {
    if (localRates.length === 0) return null;
    return [...localRates].sort((a, b) => (b.ratePerKg || 0) - (a.ratePerKg || 0))[0];
  }, [localRates]);

  return (
    <div className="space-y-4 w-full max-w-[1700px] mx-auto font-sans px-1 sm:px-2 pb-24">
      {/* ═══ TOP SECTION: HEADER & LIVE APMC METRICS ═══ */}
      <section className="bg-white dark:bg-[#121212] rounded-2xl p-5 shadow-subtle border border-slate-200/80 dark:border-neutral-800 shrink-0">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                Real-time APMC Procurement
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500">•</span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                {profile?.mandiName || "Indore APMC Central Grain Yard"}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#E5E5E5]">
              Crop Procurement Pricing
            </h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
              Configure live default purchase prices for commodities. Updated rates are synced instantly with the Farmer Setu App, gate token intake, and AI voice/chat booking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => dispatch(fetchCropRatesThunk())}
              disabled={isLoading || isActionLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-600 dark:text-neutral-300 transition cursor-pointer"
              title="Refresh latest prices from server"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <button
              onClick={() => {
                resetForm();
                setEditingCrop(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Commodity</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isActionLoading || !hasUnsavedChanges}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                  : "bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 cursor-not-allowed border border-slate-200 dark:border-neutral-700"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isActionLoading ? "Syncing..." : hasUnsavedChanges ? "Save & Broadcast" : "Rates Synced"}</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Real-time KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* KPI 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Procured Crops</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Sprout className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-[#E5E5E5] mt-1.5">
              {activeCount}{" "}
              <span className="text-xs font-normal text-slate-400">/ {localRates.length} active</span>
            </p>
          </div>

          {/* KPI 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Average APMC Rate</span>
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <IndianRupee className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-[#E5E5E5] mt-1.5">
              ₹{avgRate}{" "}
              <span className="text-xs font-normal text-slate-400">/ kg</span>
            </p>
          </div>

          {/* KPI 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Top Valued Crop</span>
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-[#E5E5E5] mt-1.5 truncate">
              {topCrop ? `${topCrop.crop} (₹${topCrop.ratePerKg})` : "N/A"}
            </p>
          </div>

          {/* KPI 4 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-neutral-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium">
              <span>Farmer Sync</span>
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Scale className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Live on Farmer Portal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEARCH & FILTER BAR ═══ */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search crop or variety..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-800 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
            }`}
          >
            All ({localRates.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white"
                : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
            }`}
          >
            Procuring ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("PAUSED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === "PAUSED"
                ? "bg-amber-600 text-white"
                : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
            }`}
          >
            Paused ({localRates.length - activeCount})
          </button>
        </div>
      </div>

      {/* ═══ CROPS PRICING TABLE ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">Commodity / Crop</th>
                <th className="py-3.5 px-4 text-center">Rate per KG</th>
                <th className="py-3.5 px-4">Rate per Quintal</th>
                <th className="py-3.5 px-4">Daily Spread (Min - Max)</th>
                <th className="py-3.5 px-4">Market Trend</th>
                <th className="py-3.5 px-4 text-center">Procurement Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-sm">
              {filteredCrops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                    <Sprout className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">No commodities found</p>
                    <p className="text-xs mt-0.5">Try searching another term or add a new commodity above.</p>
                  </td>
                </tr>
              ) : (
                filteredCrops.map((item) => {
                  const quintalRate = (item.ratePerKg || 0) * 100;
                  const isCurrentActive = item.isActive !== false;

                  return (
                    <tr
                      key={item.crop}
                      className={`hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 transition ${
                        !isCurrentActive ? "opacity-60" : ""
                      }`}
                    >
                      {/* Commodity */}
                      <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {item.crop.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-neutral-100 text-sm block">
                              {item.crop}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-neutral-400 block font-normal">
                              {item.variety || "Standard Grade Produce"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Interactive Rate per KG Stepper */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => handleRateStep(item.crop, -1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm transition shadow-2xs cursor-pointer"
                          >
                            -
                          </button>
                          <div className="flex items-center px-2">
                            <span className="text-xs text-slate-400 dark:text-neutral-500 font-semibold mr-0.5">₹</span>
                            <input
                              type="number"
                              value={item.ratePerKg}
                              onChange={(e) => handleRateChange(item.crop, parseFloat(e.target.value))}
                              className="w-14 text-center font-bold text-slate-900 dark:text-neutral-100 bg-transparent focus:outline-none text-sm"
                            />
                            <span className="text-[11px] text-slate-400 dark:text-neutral-500">/kg</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRateStep(item.crop, 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm transition shadow-2xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Rate per Quintal */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-neutral-100 text-sm block">
                          ₹ {quintalRate.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-400 font-normal block">
                          per 100 KG (Quintal)
                        </span>
                      </td>

                      {/* Spread (Min - Max) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block">
                          ₹{item.minRate || item.ratePerKg - 2} - ₹{item.maxRate || item.ratePerKg + 3} / kg
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-400 font-normal block">
                          Modal Mandi Band
                        </span>
                      </td>

                      {/* Trend */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.trend === "up" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Bullish (Up)</span>
                          </span>
                        ) : item.trend === "down" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Bearish (Down)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                            <Minus className="w-3.5 h-3.5" />
                            <span>Stable</span>
                          </span>
                        )}
                      </td>

                      {/* Procurement Toggle */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.crop)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                            isCurrentActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                          }`}
                        >
                          {isCurrentActive ? "Active Buying" : "Intake Paused"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                            title="Edit details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCrop(item.crop)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Remove commodity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ FLOATING UNSAVED BROADCAST BANNER ═══ */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 z-40 p-4 rounded-2xl bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-700 dark:border-neutral-300 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
            <div>
              <p className="text-xs sm:text-sm font-bold">You have unsaved procurement price updates</p>
              <p className="text-[11px] opacity-80">Click Save &amp; Broadcast to push real-time rates to farmers and the AI booking engine.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLocalRates(cropRates);
                setHasUnsavedChanges(false);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/20 transition cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isActionLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition cursor-pointer"
            >
              {isActionLoading ? "Broadcasting..." : "Save & Broadcast to Farmers"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ ADD / EDIT COMMODITY MODAL ═══ */}
      {(isAddModalOpen || editingCrop) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-neutral-100">
                  {editingCrop ? `Configure ${editingCrop.crop} Rate` : "Add New Mandi Commodity"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCrop(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Crop Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Commodity Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wheat, Mustard, Soybean, Onion"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Variety / Grade */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Variety / APMC Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharbati Lokwan, Grade-A, Hybrid"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Rate per KG */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    Procurement Rate (₹ / KG) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      value={ratePerKg}
                      onChange={(e) => setRatePerKg(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    Equivalent Quintal (₹)
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 font-semibold">
                    ₹ {(ratePerKg * 100).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Min & Max Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    Min Rate (₹ / KG)
                  </label>
                  <input
                    type="number"
                    value={minRate}
                    onChange={(e) => setMinRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    Max Rate (₹ / KG)
                  </label>
                  <input
                    type="number"
                    value={maxRate}
                    onChange={(e) => setMaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Market Trend */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Today's Price Trend
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrend("up")}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1 transition cursor-pointer ${
                      trend === "up"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                        : "border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrend("stable")}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1 transition cursor-pointer ${
                      trend === "stable"
                        ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
                        : "border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Stable</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrend("down")}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1 transition cursor-pointer ${
                      trend === "down"
                        ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                        : "border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Down</span>
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                <span className="font-semibold text-slate-700 dark:text-neutral-300">
                  Accept intake for this crop
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCrop(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
              >
                {editingCrop ? "Apply Update" : "Add to Procurement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
