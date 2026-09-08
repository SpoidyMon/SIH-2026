import React, { useState } from "react";
import { MapPin, Navigation, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { updateMandiLocationThunk } from "../../store/slices/mandiSlice";

interface RegisterStep2LocationProps {
  onLocationSaved: () => void;
}

export function RegisterStep2Location({ onLocationSaved }: RegisterStep2LocationProps) {
  const dispatch = useAppDispatch();
  const { isActionLoading } = useAppSelector((state) => state.mandi);

  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState("Indore");
  const [state, setState] = useState("Madhya Pradesh");
  const [latitude, setLatitude] = useState<number>(22.7196);
  const [longitude, setLongitude] = useState<number>(75.8577);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setLocationSuccess(`Current GPS coordinates fetched: ${lat}, ${lng}`);
        setTimeout(() => setLocationSuccess(null), 5000);
      },
      (err) => {
        setIsLocating(false);
        // Default to active APMC coordinates
        setLatitude(22.7196);
        setLongitude(75.8577);
        setLocationError(`Location request failed (${err.message}). Using regional APMC coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !pincode) return;

    setLocationError(null);

    try {
      await dispatch(
        updateMandiLocationThunk({
          address: address.trim(),
          pincode: pincode.trim(),
          district: district.trim(),
          state: state.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
        })
      ).unwrap();

      onLocationSaved();
    } catch (err: any) {
      setLocationError(err || "Failed to update location coordinates");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mandi Location &amp; Map</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Step 2 of 3: Set physical yard coordinates for farmer app discovery
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300/40 flex items-center justify-center text-emerald-800">
          <MapPin className="w-5 h-5" />
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

      <form onSubmit={handleSubmitLocation} className="space-y-3.5">
        {/* Physical Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Physical Yard Address <span className="text-emerald-600">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Sector 4, APMC Market Yard, Sanwer Road"
            className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
            required
          />
        </div>

        {/* Pincode & District */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pincode <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="452001"
              className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
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
              className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
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
            className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-20 shadow-2xs transition"
            required
          />
        </div>

        {/* GPS Coordinates & Fetch Button */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Geo Coordinates (For Farmer Map Discovery)
            </span>
            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Locating..." : "Fetch GPS Location"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isActionLoading}
          className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isActionLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Save Location &amp; Set Operating Slots</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
