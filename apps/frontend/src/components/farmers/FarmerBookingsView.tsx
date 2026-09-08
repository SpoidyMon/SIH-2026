import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Clock,
  QrCode,
  AlertCircle,
  MapPin,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { getFarmerBookingsApi } from "../../services/farmer.api";
import { FarmerBookingRecord, BookingStatusType } from "../../interfaces/farmer.interface";

export function FarmerBookingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeStatusFilter = searchParams.get("status") as BookingStatusType | null;

  const [bookings, setBookings] = useState<FarmerBookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await getFarmerBookingsApi();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch farmer bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (!activeStatusFilter) return true;
    return b.status === activeStatusFilter;
  });

  const getStatusBadge = (status: BookingStatusType) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Approval</span>
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accepted (Token &amp; QR Ready)</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Settled &amp; Completed</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Mandi Arrival Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track intake approval status, view official gate tokens, and review final crop weighment settlements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/farmer/mandis")}
          className="px-4 py-2.5 bg-[#0B2D1B] hover:bg-[#124027] text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <CalendarCheck className="w-4 h-4 text-[#C8F52F]" />
          <span>Book New Slot</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Bookings", query: null },
          { label: "Pending Approval", query: "PENDING" },
          { label: "Accepted", query: "ACCEPTED" },
          { label: "Completed & Settled", query: "COMPLETED" },
          { label: "Rejected", query: "REJECTED" },
        ].map((tab) => {
          const isActive = activeStatusFilter === tab.query;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                if (tab.query) {
                  setSearchParams({ status: tab.query });
                } else {
                  setSearchParams({});
                }
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? "bg-[#0B2D1B] text-[#C8F52F] border-[#0B2D1B] shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading booking records...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Bookings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any bookings matching this filter.
          </p>
          <button
            type="button"
            onClick={() => navigate("/farmer/mandis")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
          >
            Find a Mandi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === "PENDING";
            const isAccepted = b.status === "ACCEPTED";
            const isCompleted = b.status === "COMPLETED";
            const isRejected = b.status === "REJECTED";

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {b.token ? `Token: ${b.token}` : `Request ID: #BKG-${b.id.slice(-6)}`}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">
                      {b.mandiProfile?.name || "APMC Mandi Yard"}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-500">
                    <p className="font-bold text-slate-800">
                      Slot: {b.slot?.date} ({b.slot?.startTime} - {b.slot?.endTime})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Submitted: {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Crops List in KG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Crops Included (in KG)
                    </label>
                    <div className="space-y-1.5">
                      {b.cropsList && Array.isArray(b.cropsList) && b.cropsList.length > 0 ? (
                        b.cropsList.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold"
                          >
                            <span className="flex items-center gap-2">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{c.crop}</span>
                            </span>
                            <span className="font-bold text-slate-900">{c.quantityKg} KG</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{b.crop}</span>
                          </span>
                          <span className="font-bold text-slate-900">{b.quantityKg || b.quantityQuintals * 100} KG</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status Specific Details */}
                  <div className="space-y-3">
                    {/* PENDING State */}
                    {isPending && (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Info className="w-4 h-4 text-amber-600" />
                          <span>Request Under Review by Mandi</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Your request has been delivered to the Mandi Intake Office. Once approved, your official gate pass <strong>Token Number</strong> and <strong>QR Code</strong> will appear right here.
                        </p>
                      </div>
                    )}

                    {/* ACCEPTED State (QR Code Card) */}
                    {isAccepted && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-800">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Approved Token: {b.token || "MND-042"}</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-1">
                            Present this QR code at the Mandi Security Gate on your slot day.
                          </p>
                        </div>

                        <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-emerald-300 shadow-sm flex items-center justify-center shrink-0">
                          <QrCode className="w-full h-full text-slate-900" />
                        </div>
                      </div>
                    )}

                    {/* REJECTED State */}
                    {isRejected && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-red-700">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Booking Request Rejected</span>
                        </div>
                        <p className="text-xs font-semibold text-red-800">
                          Reason: {b.rejectionReason || "Slot capacity reached or invalid crop details."}
                        </p>
                        <p className="text-[11px] text-red-600">
                          Per APMC policy, you cannot re-apply for this specific slot. Please choose another date or slot.
                        </p>
                      </div>
                    )}

                    {/* COMPLETED State (Settlement Summary) */}
                    {isCompleted && (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>Final Weighment Settlement</span>
                          <span className="text-blue-700">Completed</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 flex justify-between pt-1 border-t border-blue-200/60">
                          <span>Final Payout Amount:</span>
                          <span className="text-emerald-700">₹{(b.estimatedPayout || 8400).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
