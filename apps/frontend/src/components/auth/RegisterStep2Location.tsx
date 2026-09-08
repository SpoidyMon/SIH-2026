import React, { useState } from "react";
import { MapPin, Navigation, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Map } from "lucide-react";

export interface LocationData {
  address: string;
  pincode: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface RegisterStep2LocationProps {
  initialData?: Partial<LocationData>;
  onLocationSaved: (data: LocationData) => void;
}

export function RegisterStep2Location({ initialData, onLocationSaved }: RegisterStep2LocationProps) {
  const [address, setAddress] = useState(initialData?.address || "");
  const [pincode, setPincode] = useState(initialData?.pincode || "");
  const [district, setDistrict] = useState(initialData?.district || "Indore");
  const [state, setState] = useState(initialData?.state || "Madhya Pradesh");
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? 22.7196);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? 75.8577);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * Reverse-geocodes GPS coordinates using OpenStreetMap Nominatim API
   * and auto-fills physical street address, district, state, and postal PIN code.
   */
  const reverseGeocodeCoordinates = async (lat: number, lon: number) => {
    try {
      setIsLocating(true);
      setLocationError(null);
      setLocationSuccess("Resolving yard address, district, state & pincode from coordinates...");
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

        // 2. Build district, state, and postal PIN code
        const autoDistrict =
          addr.state_district || addr.district || addr.city || addr.county || addr.town || "";
        const autoState = addr.state || "";
        const autoPincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

        if (autoAddress) setAddress(autoAddress);
        if (autoDistrict) setDistrict(autoDistrict);
        if (autoState) setState(autoState);
        if (autoPincode) setPincode(autoPincode);

        setLocationSuccess("✓ Address, district, state & postal PIN code auto-filled from map location!");
        setTimeout(() => setLocationSuccess(null), 5000);
      } else {
        setLocationSuccess("✓ Coordinates updated.");
        setTimeout(() => setLocationSuccess(null), 3000);
      }
    } catch {
      setLocationSuccess("✓ Coordinates updated.");
      setTimeout(() => setLocationSuccess(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess("Acquiring GPS fix from device...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        await reverseGeocodeCoordinates(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        setLatitude(22.7196);
        setLongitude(75.8577);
        setLocationError(`GPS fix failed (${err.message}). Enter coordinates manually or adjust on map.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !pincode.trim()) {
      setLocationError("Please provide yard address and 6-digit postal PIN code.");
      return;
    }

    setLocationError(null);
    onLocationSaved({
      address: address.trim(),
      pincode: pincode.trim(),
      district: district.trim(),
      state: state.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-600" />
            <span>Mandi Location &amp; Geo-Coordinates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Step 2 of 3: Mark your APMC yard location on the interactive map for farmer app discovery
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => reverseGeocodeCoordinates(latitude, longitude)}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Auto-fill address, district, state and PIN code from current coordinates"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Fill Address</span>
          </button>
          <button
            type="button"
            onClick={handleFetchCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "Fetch GPS Location"}</span>
          </button>
        </div>
      </div>

      {locationError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {locationSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300/40 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{locationSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSubmitLocation} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Location Details Form */}
        <div className="lg:col-span-5 space-y-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
          {/* Physical Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Yard Address <span className="text-emerald-600">*</span>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Sector 4, APMC Market Yard, Sanwer Road"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 shadow-2xs transition"
              required
            />
          </div>

          {/* Pincode & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal PIN Code <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="452001"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Indore"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition"
                required
              />
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Madhya Pradesh"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition"
              required
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
          >
            <span>Save Location &amp; Set Operating Slots</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: BIG Interactive OpenStreetMap */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Interactive APMC Yard Map Preview</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Live OpenStreetMap
            </span>
          </div>

          {/* Large Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 h-[380px] bg-slate-100 shadow-md group">
            <iframe
              title="Mandi Yard Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.012}%2C${latitude - 0.009}%2C${longitude + 0.012}%2C${latitude + 0.009}&layer=mapnik&marker=${latitude}%2C${longitude}`}
              className="w-full h-full border-0"
              loading="lazy"
            />

            {/* Coordinates Floating Badge */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">APMC Yard Main Entrance</p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">
                    {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Active Pin
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
