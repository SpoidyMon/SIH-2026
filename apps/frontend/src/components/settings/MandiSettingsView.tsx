import React, { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  MapPin,
  Navigation,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Store,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchProfileThunk,
  submitOnboardingThunk,
  updateMandiLocationThunk,
} from "../../store/slices/mandiSlice";

export function MandiSettingsView() {
  const dispatch = useAppDispatch();
  const { profile, isActionLoading } = useAppSelector((state) => state.mandi);

  // Mandi Identity
  const [mandiName, setMandiName] = useState(profile?.mandiName || "");
  const [apmcCode, setApmcCode] = useState(profile?.apmcCode || profile?.operatingLicense || "");

  // Yard Address & Location
  const [yardAddress, setYardAddress] = useState(profile?.yardAddress || profile?.address || "");
  const [district, setDistrict] = useState(profile?.district || "");
  const [state, setState] = useState(profile?.state || "");
  const [pinCode, setPinCode] = useState(profile?.pinCode || profile?.pincode || "");
  const [latitude, setLatitude] = useState<number>(profile?.latitude ?? 22.7196);
  const [longitude, setLongitude] = useState<number>(profile?.longitude ?? 75.8577);

  // Schedule & Timing
  const [operatingHours, setOperatingHours] = useState(profile?.operatingHours || "08:00 AM - 06:00 PM (Mon-Sat)");
  const [closedDays, setClosedDays] = useState<string[]>(profile?.closedDays && profile?.closedDays.length > 0 ? profile.closedDays : ["Sunday"]);
  const [closedHours, setClosedHours] = useState<string>(profile?.closedHours || "20:00 - 06:00");

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      if (profile.mandiName) setMandiName(profile.mandiName);
      if (profile.apmcCode || profile.operatingLicense) setApmcCode(profile.apmcCode || profile.operatingLicense || "");
      if (profile.yardAddress || profile.address) setYardAddress(profile.yardAddress || profile.address || "");
      if (profile.district) setDistrict(profile.district);
      if (profile.state) setState(profile.state);
      if (profile.pinCode || profile.pincode) setPinCode(profile.pinCode || profile.pincode || "");
      if (profile.latitude != null) setLatitude(profile.latitude);
      if (profile.longitude != null) setLongitude(profile.longitude);
      if (profile.operatingHours) setOperatingHours(profile.operatingHours);
      if (profile.closedDays && profile.closedDays.length > 0) setClosedDays(profile.closedDays);
      if (profile.closedHours) setClosedHours(profile.closedHours);
    }
  }, [profile]);

  /**
   * Reverse-geocodes GPS coordinates using OpenStreetMap Nominatim API
   * and auto-fills street address, district, state, and postal PIN code.
   */
  const reverseGeocodeCoordinates = async (lat: number, lon: number) => {
    try {
      setIsLocating(true);
      setStatusType("info");
      setLocationStatusMsg("Resolving street address, district, state & postal code from coordinates...");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        // 1. Build physical street address
        const streetParts = [
          addr.building || addr.amenity || addr.office || addr.commercial,
          addr.road,
          addr.suburb || addr.neighbourhood || addr.industrial,
        ].filter(Boolean);

        const autoAddress =
          streetParts.length > 0
            ? streetParts.join(", ")
            : data.display_name
            ? data.display_name.split(",").slice(0, 3).join(", ")
            : "";

        // 2. Build district, state, and postal code
        const autoDistrict = addr.state_district || addr.district || addr.city || addr.county || addr.town || "";
        const autoState = addr.state || "";
        const autoPincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

        if (autoAddress) setYardAddress(autoAddress);
        if (autoDistrict) setDistrict(autoDistrict);
        if (autoState) setState(autoState);
        if (autoPincode) setPinCode(autoPincode);

        setStatusType("success");
        setLocationStatusMsg("✓ Coordinates set & address fields auto-filled successfully!");
        setTimeout(() => setLocationStatusMsg(null), 5000);
      } else {
        setStatusType("success");
        setLocationStatusMsg("✓ Coordinates set successfully.");
        setTimeout(() => setLocationStatusMsg(null), 3000);
      }
    } catch {
      setStatusType("success");
      setLocationStatusMsg("✓ Coordinates set successfully.");
      setTimeout(() => setLocationStatusMsg(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusType("error");
      setLocationStatusMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setStatusType("info");
    setLocationStatusMsg("Acquiring GPS fix from browser...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);
        await reverseGeocodeCoordinates(lat, lon);
      },
      (err) => {
        setIsLocating(false);
        setStatusType("error");
        setLocationStatusMsg(`GPS acquisition failed: ${err.message}. Enter coordinates manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleClosedDay = (day: string) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter((d) => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yardAddress.trim() || !pinCode.trim()) {
      setStatusType("error");
      setLocationStatusMsg("Physical yard address and postal PIN code are required.");
      return;
    }

    setStatusType("info");
    setLocationStatusMsg("Saving Mandi profile, location coordinates & operating schedule...");

    try {
      // 1. Update location coordinates and operating schedule
      await dispatch(
        updateMandiLocationThunk({
          address: yardAddress.trim(),
          pincode: pinCode.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          district: district.trim(),
          state: state.trim(),
          operatingHours,
          closedDays,
          closedHours,
        })
      ).unwrap();

      // 2. Update general profile fields
      await dispatch(
        submitOnboardingThunk({
          mandiName: mandiName.trim() || profile?.mandiName || "APMC Market Yard",
          apmcCode: apmcCode.trim() || profile?.apmcCode || "APMC-IND-2026",
          address: yardAddress.trim(),
          district: district.trim(),
          state: state.trim(),
          operatingHours,
          pincode: pinCode.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          closedDays,
          closedHours,
          operatingCommodities: (profile as any)?.acceptedCrops || ["Wheat", "Soyabean", "Mustard", "Chana"],
        })
      ).unwrap();

      await dispatch(fetchProfileThunk());

      setStatusType("success");
      setLocationStatusMsg("✓ Mandi yard settings, coordinates & operating schedule saved successfully!");
      setTimeout(() => setLocationStatusMsg(null), 5000);
    } catch (err: any) {
      setStatusType("error");
      setLocationStatusMsg(typeof err === "string" ? err : err?.message || "Failed to save settings. Please try again.");
    }
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* ═══ TITLE & MANDI CODE BADGE ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
              Mandi &amp; Yard Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs tracking-wider shadow-xs">
              {profile?.mandiCode || "MAN001"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-medium">
            APMC accreditation, physical yard coordinate markup, and operating schedule.
          </p>
        </div>

        {/* Visibility Status on Farmer App */}
        <div className="flex items-center gap-2">
          {profile?.isLocationSet ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Visible on Farmer App</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Location Not Set • Hidden from Farmers</span>
            </div>
          )}
        </div>
      </div>

      {locationStatusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
            statusType === "error"
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
              : statusType === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
              : "bg-slate-50 dark:bg-neutral-900/60 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800"
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{locationStatusMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ═══ CARD 1: MANDI PROFILE & APMC ACCREDITATION ═══ */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-3">
            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5]">APMC Mandi Yard Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Official Mandi Yard Name</label>
              <input
                type="text"
                value={mandiName}
                onChange={(e) => setMandiName(e.target.value)}
                placeholder="e.g. APMC Market Yard Indore"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">APMC License / Registration Code</label>
              <input
                type="text"
                value={apmcCode}
                onChange={(e) => setApmcCode(e.target.value)}
                placeholder="e.g. APMC-IND-2026-X992"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
              />
            </div>
          </div>
        </div>

        {/* ═══ CARD 2: PHYSICAL YARD ADDRESS & INTERACTIVE MAP MARKUP ═══ */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5]">Physical Yard Address &amp; Location Markup</h2>
            </div>
            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Acquiring & Auto-filling Address..." : "Fetch GPS Location"}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Physical Yard Street Address</label>
              <textarea
                rows={2}
                value={yardAddress}
                onChange={(e) => setYardAddress(e.target.value)}
                placeholder="Complete street address of the Mandi yard entrance"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Indore"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Madhya Pradesh"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Postal PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="452001"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                />
              </div>
            </div>

            {/* GPS Coordinates Markup Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-[#E5E5E5]">
                    Yard Map Coordinates (Latitude / Longitude)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Farmers use these coordinates on the mobile app for navigation and slot arrival.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reverseGeocodeCoordinates(latitude, longitude)}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Auto-fill address, district, state and PIN code from current coordinates"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Auto-Fill Address</span>
                  </button>
                  <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-neutral-400 mb-1 text-[11px]">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-neutral-400 mb-1 text-[11px]">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                  />
                </div>
              </div>

              {/* Interactive OpenStreetMap Embed */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 h-56 bg-slate-100 dark:bg-neutral-900 shadow-inner">
                <iframe
                  title="Mandi Yard Map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.008}%2C${longitude + 0.01}%2C${latitude + 0.008}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                  className="w-full h-full border-0 dark:invert-[0.92] dark:hue-rotate-180 dark:contrast-125 transition-all"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700 text-[10px] font-bold text-slate-700 dark:text-neutral-200 flex items-center gap-1.5 shadow-2xs">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>Marked Yard Entrance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CARD 3: OPERATING SCHEDULE & CLOSED DAYS ═══ */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-3">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5]">Operating Schedule &amp; Mandi Timing</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-2">
                Weekly Closed Days (Slots Disabled for Farmers)
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = closedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleClosedDay(day)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        isSelected
                          ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                          : "bg-slate-50 dark:bg-neutral-900/60 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {isSelected ? "✕ Closed on " : "Open: "}
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Daily Operating Hours
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="e.g. 08:00 AM - 06:00 PM (Mon-Sat)"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Yard Night / Closed Hours
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={closedHours}
                    onChange={(e) => setClosedHours(e.target.value)}
                    placeholder="e.g. 20:00 - 06:00"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">Farmer arrival booking slots will be disallowed during these hours.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM SAVE BUTTON ═══ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isActionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Mandi Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

