import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  Navigation,
  RefreshCw,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  Sprout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApprovedMandisApi } from "../../services/farmer.api";
import { FarmerMandiSummary } from "../../interfaces/farmer.interface";

export function FarmerMandiDiscoveryView() {
  const navigate = useNavigate();

  const [mandis, setMandis] = useState<FarmerMandiSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("ALL");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "MAP">("LIST");

  // Fetch farmer location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to default location (Indore / Pune area)
          setUserLocation({ lat: 18.5204, lng: 73.8567 });
        }
      );
    } else {
      setUserLocation({ lat: 18.5204, lng: 73.8567 });
    }
  }, []);

  const loadMandis = async () => {
    setIsLoading(true);
    try {
      const data = await getApprovedMandisApi(
        userLocation?.lat,
        userLocation?.lng,
        searchQuery,
        selectedCrop !== "ALL" ? selectedCrop : undefined
      );
      setMandis(data);
    } catch (err) {
      console.error("Failed to load mandis", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMandis();
  }, [userLocation, selectedCrop]);

  const filteredMandis = mandis.filter((m) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pincode.includes(searchQuery);

    const matchesOpen = !onlyOpen || m.isOpen;

    return matchesSearch && matchesOpen;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0B2D1B] to-[#124027] rounded-3xl p-6 md:p-8 text-white shadow-sm border border-emerald-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct APMC Slot Booking</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Find Mandi &amp; Book Arrival Slot</h1>
            <p className="text-sm text-emerald-200/80 mt-1">
              Select nearby APMC mandis, view real-time crop rates (in KG), and submit direct intake requests.
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-emerald-950/80 p-1.5 rounded-2xl border border-emerald-800/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "LIST"
                  ? "bg-[#C8F52F] text-[#0B2D1B] shadow-sm"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <ListIcon className="w-4 h-4" />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("MAP")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "MAP"
                  ? "bg-[#C8F52F] text-[#0B2D1B] shadow-sm"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search Mandi by name, district, pincode, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-800/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-emerald-400/60 focus:outline-none focus:border-[#C8F52F]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-800/80 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C8F52F]"
            >
              <option value="ALL">All Accepted Crops</option>
              <option value="Tomato">Tomato</option>
              <option value="Wheat">Wheat</option>
              <option value="Mustard">Mustard</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-semibold transition ${
                onlyOpen
                  ? "bg-[#C8F52F] border-[#C8F52F] text-[#0B2D1B]"
                  : "bg-emerald-950/60 border-emerald-800/80 text-emerald-200 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{onlyOpen ? "Open Only" : "All Statuses"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold">Locating nearest APMC mandis...</p>
        </div>
      ) : filteredMandis.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Mandis Match Your Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query, crop selection, or clear the open-only filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCrop("ALL");
              setOnlyOpen(false);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMandis.map((mandi) => {
            const hasSlots = mandi.slots && mandi.slots.length > 0;
            const nextSlot = hasSlots ? mandi.slots![0] : null;

            return (
              <div
                key={mandi.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              mandi.isOpen
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {mandi.isOpen ? "Open for Intake" : "Closed"}
                          </span>
                          {mandi.distanceKm !== null && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                              <Navigation className="w-3 h-3 fill-emerald-600 stroke-none" />
                              <span>{mandi.distanceKm} km away</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-slate-900 mt-2 group-hover:text-emerald-700 transition">
                          {mandi.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {mandi.address}, {mandi.district} – {mandi.pincode}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Crops Accepted & Rate per KG */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Crops Accepted &amp; Today's Rate (per KG)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {mandi.cropRates && mandi.cropRates.length > 0
                          ? mandi.cropRates.map((cr) => (
                              <span
                                key={cr.crop}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                              >
                                <Sprout className="w-3 h-3 text-emerald-600" />
                                <span>{cr.crop}</span>
                                <span className="text-[11px] font-bold text-emerald-700">
                                  (₹{cr.ratePerKg}/kg)
                                </span>
                              </span>
                            ))
                          : mandi.acceptedCrops.map((cropName) => (
                              <span
                                key={cropName}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                              >
                                <Sprout className="w-3 h-3 text-emerald-600" />
                                <span>{cropName}</span>
                                <span className="text-[11px] font-bold text-emerald-700">(₹28/kg)</span>
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Next Available Slot */}
                    <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Next Intake Slot
                          </p>
                          <p className="text-xs font-bold text-slate-800">
                            {nextSlot
                              ? `${nextSlot.date} (${nextSlot.startTime} - ${nextSlot.endTime})`
                              : "Slots available tomorrow"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-1 rounded-lg">
                        {nextSlot ? `${nextSlot.availableBookings} slots left` : "Available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/farmer/mandis/${mandi.id}`)}
                    disabled={!mandi.isOpen}
                    className="w-full py-3 bg-[#0B2D1B] hover:bg-[#124027] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    <span>{mandi.isOpen ? "View Mandi Details & Book" : "Mandi Closed"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
