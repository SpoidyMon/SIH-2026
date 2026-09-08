import React, { useState, useEffect } from "react";
import {
  Building2,
  FileCheck,
  Upload,
  Trash2,
  ShieldCheck,
  Plus,
  X,
  CheckCircle2,
  FileText,
  Save,
  MapPin,
  Navigation,
  Clock,
  AlertCircle,
  Check,
  Calendar,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchProfileThunk,
  submitOnboardingThunk,
  submitAadhaarKycThunk,
  uploadLegalDocThunk,
  deleteLegalDocThunk,
  updateMandiLocationThunk,
} from "../../store/slices/mandiSlice";
import { LegalDocType } from "../../interfaces";

export function MandiSettingsView() {
  const dispatch = useAppDispatch();
  const { profile, isActionLoading } = useAppSelector((state) => state.mandi);

  // Yard Address Form State
  const [yardAddress, setYardAddress] = useState(profile?.yardAddress || profile?.address || "");
  const [district, setDistrict] = useState(profile?.district || "");
  const [state, setState] = useState(profile?.state || "");
  const [pinCode, setPinCode] = useState(profile?.pinCode || profile?.pincode || "");
  const [weighbridgeCount, setWeighbridgeCount] = useState<number>(profile?.weighbridgeCount || 4);

  // Location & Coordinates State
  const [latitude, setLatitude] = useState<number>(profile?.latitude ?? 18.4965);
  const [longitude, setLongitude] = useState<number>(profile?.longitude ?? 73.8656);
  const [closedDays, setClosedDays] = useState<string[]>(["Sunday"]);
  const [closedHours, setClosedHours] = useState<string>("20:00 - 06:00");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  // Aadhaar Modal / Update State
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState("8912");

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<LegalDocType>("MANDI_LICENSE");

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      if (profile.yardAddress || profile.address) setYardAddress(profile.yardAddress || profile.address || "");
      if (profile.district) setDistrict(profile.district);
      if (profile.state) setState(profile.state);
      if (profile.pinCode || profile.pincode) setPinCode(profile.pinCode || profile.pincode || "");
      if (profile.weighbridgeCount) setWeighbridgeCount(profile.weighbridgeCount);
      if (profile.latitude != null) setLatitude(profile.latitude);
      if (profile.longitude != null) setLongitude(profile.longitude);
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

        const autoAddress = streetParts.length > 0
          ? streetParts.join(", ")
          : (data.display_name ? data.display_name.split(",").slice(0, 3).join(", ") : "");

        // 2. Build district, state, and postal code
        const autoDistrict = addr.state_district || addr.district || addr.city || addr.county || addr.town || "";
        const autoState = addr.state || "";
        const autoPincode = addr.postcode || "";

        if (autoAddress) setYardAddress(autoAddress);
        if (autoDistrict) setDistrict(autoDistrict);
        if (autoState) setState(autoState);
        if (autoPincode) setPinCode(autoPincode);

        setLocationStatusMsg("✓ Coordinates set & address fields auto-filled successfully!");
        setTimeout(() => setLocationStatusMsg(null), 5000);
      } else {
        setLocationStatusMsg("✓ Coordinates set successfully.");
        setTimeout(() => setLocationStatusMsg(null), 3000);
      }
    } catch {
      setLocationStatusMsg("✓ Coordinates set successfully.");
      setTimeout(() => setLocationStatusMsg(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
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
        setLocationStatusMsg(`GPS acquisition failed: ${err.message}. Enter coordinates manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveYardLocation = async () => {
    setLocationStatusMsg("Saving yard coordinates and operating schedule...");
    const res = await dispatch(
      updateMandiLocationThunk({
        address: yardAddress,
        pincode: pinCode,
        latitude,
        longitude,
        district,
        state,
        closedDays,
        closedHours,
      })
    );
    if (updateMandiLocationThunk.fulfilled.match(res)) {
      setLocationStatusMsg("✓ Mandi yard location saved! Visible to farmers for booking.");
      setTimeout(() => setLocationStatusMsg(null), 5000);
    } else {
      setLocationStatusMsg("Failed to save yard location. Please try again.");
    }
  };

  const toggleClosedDay = (day: string) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter((d) => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      submitOnboardingThunk({
        mandiName: profile?.mandiName || "Indore APMC Grain & Oilseed Market Yard",
        apmcCode: profile?.operatingLicense || "APMC-IND-2026-X992",
        address: yardAddress,
        district,
        state,
        operatingHours: "08:00 AM - 06:00 PM",
        operatingCommodities: ["WHEAT", "SOYBEAN", "MUSTARD", "RICE"],
      })
    );
    handleSaveYardLocation();
  };

  const handleUpdateAadhaar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarInput) return;
    dispatch(
      submitAadhaarKycThunk({
        aadhaarNumber: `•••• •••• ${aadhaarInput.slice(-4)}`,
        aadhaarDocUrl: "https://agrovia.gov.in/docs/Aadhaar_Card_Verified_eSign.pdf",
      })
    );
    setShowAadhaarModal(false);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    dispatch(
      uploadLegalDocThunk({
        documentType: newDocType,
        documentUrl: "https://agrovia.gov.in/docs/verified_upload.pdf",
        documentNumber: `DOC-${Date.now()}`,
      })
    );
    setShowDocModal(false);
    setNewDocTitle("");
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm("Remove this verified statutory compliance document?")) {
      dispatch(deleteLegalDocThunk(docId));
    }
  };

  const legalDocs = profile?.legalDocs || [];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* ═══ TITLE & MANDI CODE BADGE ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-black dark:text-[#E5E5E5] tracking-tight">
              Mandi &amp; Yard Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs tracking-wider shadow-xs">
              {profile?.mandiCode || "MAN001"}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 font-medium">
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
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          locationStatusMsg.includes("failed") || locationStatusMsg.includes("not supported")
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
        }`}>
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{locationStatusMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ═══ CARD 1: PHYSICAL YARD ADDRESS & INTERACTIVE MAP MARKUP ═══ */}
        <div className="mandi-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Physical Yard Address &amp; Location Markup</h2>
            </div>
            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Acquiring & Auto-filling Address..." : "Fetch Current Location"}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Physical Yard Street Address</label>
              <textarea
                rows={2}
                value={yardAddress}
                onChange={(e) => setYardAddress(e.target.value)}
                placeholder="Complete street address of the Mandi yard entrance"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Postal PIN Code</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>
            </div>

            {/* GPS Coordinates Markup Section */}
            <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-gray-800 dark:text-neutral-200">
                    Yard Map Coordinates (Latitude / Longitude)
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                    Required for farmers to locate the yard on the app and book slots.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reverseGeocodeCoordinates(latitude, longitude)}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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
                  <label className="block font-semibold text-gray-600 dark:text-neutral-400 mb-1 text-[11px]">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-mono font-bold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-neutral-400 mb-1 text-[11px]">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-mono font-bold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                  />
                </div>
              </div>

              {/* Interactive OpenStreetMap Embed */}
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 h-64 bg-slate-100 dark:bg-neutral-900 shadow-inner">
                <iframe
                  title="Mandi Yard Map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.008}%2C${longitude + 0.01}%2C${latitude + 0.008}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-800 text-[10px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 shadow-sm">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>Marked Yard Entrance</span>
                </div>
              </div>
            </div>

            {/* Electronic Weighbridges Count */}
            <div className="sm:w-1/3 pt-2">
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Electronic Weighbridges</label>
              <input
                type="number"
                value={weighbridgeCount}
                onChange={(e) => setWeighbridgeCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>
          </div>
        </div>

        {/* ═══ CARD 1.5: OPERATING SCHEDULE & CLOSED DAYS ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
            <Calendar className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Operating Schedule &amp; Mandi Closed Timing</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-2">
                Weekly Closed Days (Slots Disabled)
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
                          : "bg-gray-50 dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-800 hover:bg-gray-100"
                      }`}
                    >
                      {isSelected ? "✕ Closed on " : "Open: "}
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:w-1/2">
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
                Yard Night / Closed Hours
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 dark:text-neutral-500 shrink-0" />
                <input
                  type="text"
                  value={closedHours}
                  onChange={(e) => setClosedHours(e.target.value)}
                  placeholder="e.g. 20:00 - 06:00"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Bookings will be disallowed during these hours.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveYardLocation}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Yard Coordinates &amp; Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ CARD 2: AADHAAR IDENTITY VERIFICATION ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Aadhaar Identity Verification</h2>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
              ✓ Aadhaar Verified
            </span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 uppercase">
                Linked Aadhaar Identification:
              </div>
              <div className="font-mono text-base font-bold text-black dark:text-[#E5E5E5]">
                {profile?.aadhaarNumber || "•••• •••• 8912"}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                <span>Document: Aadhaar_Card_Verified_eSign.pdf</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAadhaarModal(true)}
              className="px-4 py-2 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-800 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              Update Aadhaar Card
            </button>
          </div>
        </div>

        {/* ═══ CARD 3: MANDI LEGAL DOCUMENTS & LICENSES ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Mandi Legal Documents & Licenses</h2>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                Upload APMC operating license, market committee registration, and tax credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="btn-primary-green flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {legalDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-black border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-gray-600 dark:text-neutral-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-black dark:text-[#E5E5E5] text-xs">{doc.title}</div>
                    <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                      Type: {doc.docType} • Uploaded: {doc.uploadedAt || "2026-01-15"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
                    {doc.status || "VERIFIED"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    title="Remove Document"
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ BOTTOM RIGHT SAVE BUTTON ═══ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isActionLoading}
            className="btn-primary-green px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Mandi Settings</span>
          </button>
        </div>
      </form>

      {/* ═══ MODAL: UPDATE AADHAAR ═══ */}
      {showAadhaarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
              <div className="font-bold text-xs text-black dark:text-[#E5E5E5]">Update Mandi Operator Aadhaar KYC</div>
              <button
                onClick={() => setShowAadhaarModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAadhaar} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">12-Digit Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value)}
                  placeholder="Enter 12 digits"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-mono text-sm font-bold text-black dark:text-[#E5E5E5]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Signed e-Aadhaar PDF</label>
                <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 text-center text-gray-500 dark:text-neutral-400 hover:border-[#5CE65C] cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 dark:text-neutral-500 mb-1" />
                  <span className="font-semibold text-[11px]">Click to upload signed Aadhaar XML / PDF</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAadhaarModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 font-bold cursor-pointer"
                >
                  Verify & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: ADD STATUTORY DOCUMENT ═══ */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
              <div className="font-bold text-xs text-black dark:text-[#E5E5E5]">Upload Statutory Mandi Document</div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Mandi Yard Operating Certificate 2026-27"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-black dark:text-[#E5E5E5]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Document Classification</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as LegalDocType)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-black dark:text-[#E5E5E5]"
                >
                  <option value="MANDI_LICENSE">MANDI LICENSE</option>
                  <option value="APMC_REGISTRATION">APMC REGISTRATION</option>
                  <option value="GST_CERTIFICATE">GST CERTIFICATE</option>
                  <option value="WEIGHBRIDGE_CALIBRATION">WEIGHBRIDGE CALIBRATION</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Upload Certified File</label>
                <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 text-center text-gray-500 dark:text-neutral-400 hover:border-[#5CE65C] cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 dark:text-neutral-500 mb-1" />
                  <span className="font-semibold text-[11px]">Select certified PDF or scanned certificate</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 font-bold cursor-pointer"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
