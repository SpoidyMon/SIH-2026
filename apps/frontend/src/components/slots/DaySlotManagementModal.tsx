import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Clock,
  Users,
  Search,
  Check,
  Sparkles,
  Copy,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { DayOfWeek, DayMandiConfig, CustomSlotItem } from "../../interfaces";

interface DaySlotManagementModalProps {
  isOpen: boolean;
  day: DayOfWeek;
  config: DayMandiConfig;
  availableCommodities: string[];
  defaultInstructions: string;
  onClose: () => void;
  onSaveDayConfig: (day: DayOfWeek, updatedConfig: DayMandiConfig, saveAsDefaultInstructions?: boolean) => void;
  onApplyToAllDays: (sourceDay: DayOfWeek) => void;
}

export const DaySlotManagementModal: React.FC<DaySlotManagementModalProps> = ({
  isOpen,
  day,
  config,
  availableCommodities,
  defaultInstructions,
  onClose,
  onSaveDayConfig,
  onApplyToAllDays,
}) => {
  // Initialize slots
  const [slots, setSlots] = useState<CustomSlotItem[]>(() => {
    if (config.customSlots && config.customSlots.length > 0) {
      return config.customSlots;
    }
    // Default initial slot for this day
    return [
      {
        id: "slot-1",
        name: "Slot 1 (Morning Shift)",
        startTime: "09:00",
        endTime: "13:30",
        maxFarmers: config.maxFarmers || 15,
        crops: [
          { crop: "Wheat", quantityKg: 5000, ratePerKg: 28 },
          { crop: "Mustard", quantityKg: 3000, ratePerKg: 54 },
        ],
        instructions: config.defaultInstructions || defaultInstructions || "Entry through Gate 2. Standard moisture test required.",
      },
    ];
  });

  const [activeSlotId, setActiveSlotId] = useState<string>(slots[0]?.id || "slot-1");
  const [cropSearchQuery, setCropSearchQuery] = useState("");
  const [customCropsList, setCustomCropsList] = useState<string[]>([]);
  const [saveDefaultInstructions, setSaveDefaultInstructions] = useState(false);

  // Active slot being edited
  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];

  // Combined searchable crops
  const allSearchableCrops = useMemo(() => {
    const combined = new Set([...availableCommodities, ...customCropsList, "Wheat", "Mustard", "Soybean", "Tomato", "Onion", "Potato", "Cotton", "Rice", "Gram"]);
    return Array.from(combined);
  }, [availableCommodities, customCropsList]);

  const filteredCrops = useMemo(() => {
    if (!cropSearchQuery.trim()) return allSearchableCrops.slice(0, 10);
    const q = cropSearchQuery.toLowerCase().trim();
    return allSearchableCrops.filter((c) => c.toLowerCase().includes(q));
  }, [allSearchableCrops, cropSearchQuery]);

  if (!isOpen || !activeSlot) return null;

  const handleAddSlot = () => {
    const nextSlotNum = slots.length + 1;
    const newSlot: CustomSlotItem = {
      id: `slot-${Date.now()}`,
      name: `Slot ${nextSlotNum} (Afternoon)`,
      startTime: nextSlotNum === 2 ? "14:00" : "17:00",
      endTime: nextSlotNum === 2 ? "17:30" : "20:00",
      maxFarmers: 10,
      crops: [
        { crop: "Wheat", quantityKg: 4000, ratePerKg: 28 },
      ],
      instructions: saveDefaultInstructions ? (activeSlot.instructions || defaultInstructions) : defaultInstructions,
    };
    setSlots((prev) => [...prev, newSlot]);
    setActiveSlotId(newSlot.id);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (slots.length <= 1) return;
    const remaining = slots.filter((s) => s.id !== slotId);
    setSlots(remaining);
    setActiveSlotId(remaining[0].id);
  };

  const updateActiveSlotField = (field: keyof CustomSlotItem, value: any) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === activeSlot.id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddCropToSlot = (cropName: string) => {
    if (activeSlot.crops.some((c) => c.crop.toLowerCase() === cropName.toLowerCase())) {
      return;
    }
    const updatedCrops = [...activeSlot.crops, { crop: cropName, quantityKg: 1000, ratePerKg: 25 }];
    updateActiveSlotField("crops", updatedCrops);
    setCropSearchQuery("");
  };

  const handleCreateCustomCrop = () => {
    if (!cropSearchQuery.trim()) return;
    const trimmed = cropSearchQuery.trim();
    if (!customCropsList.includes(trimmed)) {
      setCustomCropsList((prev) => [...prev, trimmed]);
    }
    handleAddCropToSlot(trimmed);
  };

  const handleRemoveCropFromSlot = (cropName: string) => {
    if (activeSlot.crops.length <= 1) return;
    const updated = activeSlot.crops.filter((c) => c.crop !== cropName);
    updateActiveSlotField("crops", updated);
  };

  const handleUpdateCropQuantity = (cropName: string, quantityKg: number) => {
    const updated = activeSlot.crops.map((c) =>
      c.crop === cropName ? { ...c, quantityKg: Math.max(0, quantityKg) } : c
    );
    updateActiveSlotField("crops", updated);
  };

  const handleUpdateCropRate = (cropName: string, ratePerKg: number) => {
    const updated = activeSlot.crops.map((c) =>
      c.crop === cropName ? { ...c, ratePerKg: Math.max(0, ratePerKg) } : c
    );
    updateActiveSlotField("crops", updated);
  };

  const handleSave = () => {
    const totalKg = slots.reduce(
      (sum, s) => sum + s.crops.reduce((cSum, c) => cSum + (c.quantityKg || 0), 0),
      0
    );
    const updatedConfig: DayMandiConfig = {
      ...config,
      enabled: true,
      customSlots: slots,
      totalCapacityKg: totalKg,
      capacityQuintals: Math.round(totalKg / 100),
      defaultInstructions: activeSlot.instructions,
    };
    onSaveDayConfig(day, updatedConfig, saveDefaultInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-black border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#E5E5E5] flex items-center gap-2">
              <span>Manage Arrival Slots for {day}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                {slots.length} {slots.length === 1 ? "Slot" : "Slots"} Configured
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
              Configure custom arrival windows, allowed crops, intake limits in KG, and rate per KG.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Slots Tabs + Right Slot Detail */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Left: Slot Tabs List */}
          <div className="w-full md:w-56 shrink-0 space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Arrival Slots
              </span>
              <button
                onClick={handleAddSlot}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {slots.map((s, index) => {
                const isActive = s.id === activeSlot.id;
                const slotTotalKg = s.crops.reduce((acc, c) => acc + (c.quantityKg || 0), 0);

                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlotId(s.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-slate-900 dark:text-[#E5E5E5] shadow-xs"
                        : "bg-slate-50/70 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">
                        Slot {index + 1}: {s.startTime} - {s.endTime}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block mt-0.5 font-medium">
                        👥 {s.maxFarmers} farmers • 📦 {slotTotalKg.toLocaleString()} KG
                      </span>
                    </div>
                    {slots.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlot(s.id);
                        }}
                        title="Delete Slot"
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Slot Editor */}
          <div className="flex-1 space-y-4">
            {/* Slot Time & Farmer Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 dark:bg-neutral-900/50 rounded-xl border border-slate-200 dark:border-neutral-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Start Time (24h)
                </label>
                <input
                  type="time"
                  value={activeSlot.startTime}
                  onChange={(e) => updateActiveSlotField("startTime", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-[#E5E5E5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  End Time (24h)
                </label>
                <input
                  type="time"
                  value={activeSlot.endTime}
                  onChange={(e) => updateActiveSlotField("endTime", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-[#E5E5E5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  Max Farmers
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={activeSlot.maxFarmers}
                  onChange={(e) => updateActiveSlotField("maxFarmers", Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-[#E5E5E5]"
                />
              </div>
            </div>

            {/* Crops Selection with KG and Rate / KG */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-[#E5E5E5] flex items-center gap-1.5">
                  <span>Crops &amp; Intake Capacity in KG</span>
                </label>
                <span className="text-[11px] text-slate-400 dark:text-neutral-400">
                  Total Capacity:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {activeSlot.crops.reduce((acc, c) => acc + (c.quantityKg || 0), 0).toLocaleString()} KG
                  </strong>
                </span>
              </div>

              {/* Crop Search & Add custom crop input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cropSearchQuery}
                      onChange={(e) => setCropSearchQuery(e.target.value)}
                      placeholder="Search crop or type custom crop name..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl outline-none text-slate-800 dark:text-[#E5E5E5]"
                    />
                  </div>
                  {cropSearchQuery.trim() && !allSearchableCrops.some((c) => c.toLowerCase() === cropSearchQuery.trim().toLowerCase()) && (
                    <button
                      onClick={handleCreateCustomCrop}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-800 dark:bg-neutral-700 text-white rounded-xl hover:bg-black cursor-pointer shrink-0"
                    >
                      + Add Custom "{cropSearchQuery.trim()}"
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {cropSearchQuery.trim() && filteredCrops.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1.5 flex flex-wrap gap-1">
                    {filteredCrops.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleAddCropToSlot(c)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-neutral-800 dark:hover:bg-emerald-950 text-slate-800 dark:text-neutral-200 cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Configured Crops Table */}
              <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-neutral-900 text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Crop Name</th>
                      <th className="py-2.5 px-3">Target Capacity (KG)</th>
                      <th className="py-2.5 px-3">Rate (₹ / KG)</th>
                      <th className="py-2.5 px-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {activeSlot.crops.map((c) => (
                      <tr key={c.crop} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-[#E5E5E5]">{c.crop}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="10"
                              step="50"
                              value={c.quantityKg}
                              onChange={(e) => handleUpdateCropQuantity(c.crop, Number(e.target.value))}
                              className="w-24 px-2 py-1 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg outline-none font-bold text-slate-900 dark:text-[#E5E5E5]"
                            />
                            <span className="text-[11px] text-slate-400">KG</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={c.ratePerKg}
                              onChange={(e) => handleUpdateCropRate(c.crop, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg outline-none font-bold text-emerald-600 dark:text-emerald-400 font-mono"
                            />
                            <span className="text-[11px] text-slate-400">/kg</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveCropFromSlot(c.crop)}
                            disabled={activeSlot.crops.length <= 1}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gate Arrival Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-[#E5E5E5] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Slot Gate Arrival Instructions (Optional)</span>
              </label>
              <textarea
                rows={2}
                value={activeSlot.instructions || ""}
                onChange={(e) => updateActiveSlotField("instructions", e.target.value)}
                placeholder="e.g. Bring moisture certificate. Weighbridge lane 2 reserved."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl outline-none text-slate-800 dark:text-[#E5E5E5]"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={saveDefaultInstructions}
                  onChange={(e) => setSaveDefaultInstructions(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 dark:text-neutral-400">
                  Save these instructions as default for all slots and upcoming days
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onApplyToAllDays(day);
              handleSave();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Apply {day}'s Slots to All Active Days</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
            >
              Save {day} Slots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
