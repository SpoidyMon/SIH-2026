import React, { useEffect } from "react";
import { Star, ShieldCheck, Clock, MessageSquare } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchRatingThunk } from "../../store/slices/mandiSlice";

export function MandiRatingView() {
  const dispatch = useAppDispatch();
  const { ratingData, profile, stats } = useAppSelector((state) => state.mandi);

  useEffect(() => {
    dispatch(fetchRatingThunk());
  }, [dispatch]);

  const rating = ratingData?.averageRating ?? 4.8;
  const totalReviews = ratingData?.totalReviews ?? 86;
  const gatePrecision = 98.4;
  const waitMinutes = 12;

  const reviews = ratingData?.reviews || [
    {
      id: "1",
      farmerName: "Baldev Singh",
      rating: 5,
      comment: "Gate entry was instantaneous with the digital QR pass. Automated weighbridge slip printed in under 5 minutes.",
      createdAt: "2026-08-30",
    },
    {
      id: "2",
      farmerName: "Rameshwar Patel",
      rating: 4,
      comment: "Fast moisture grading and transparent lot booking on Sanwer Road intake line.",
      createdAt: "2026-08-29",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* 1. Header */}
      <div className="border-b border-gray-200 pb-3">
        <h1 className="text-xl font-black text-black tracking-tight">
          Yard Ratings & Quality Score
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">
          Monitor your APMC Mandi quality score, gate on-time turnaround precision, and direct feedback from farmers.
        </p>
      </div>

      {/* 2. Top Rating Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="mandi-card p-6 flex flex-col items-center text-center justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 mx-auto border border-amber-200">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-4xl font-black text-black">{rating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 text-amber-500 my-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 font-bold mt-2">
            Based on {totalReviews} Verified Farmer Reviews
          </div>
        </div>

        <div className="mandi-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500">Gate Turnaround Precision</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#15803D] flex items-center justify-center border border-[#BBF7D0]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black">{gatePrecision}%</div>
          <div className="text-xs text-[#15803D] font-bold mt-2">Top 5% of State APMC Yards</div>
        </div>

        <div className="mandi-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500">Avg. Gate Wait Time</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black">{waitMinutes} Mins</div>
          <div className="text-xs text-gray-500 font-medium mt-2">From Entry Gate to Weighbridge</div>
        </div>
      </div>

      {/* 3. Farmer Reviews Stream */}
      <div className="mandi-card p-6">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
          <MessageSquare className="w-4 h-4 text-[#15803D]" />
          <h2 className="text-sm font-bold text-black">Recent Farmer Testimonials & Reviews</h2>
        </div>

        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-black">{rev.farmerName}</div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{rev.comment}</p>
              <div className="text-[10px] text-gray-400 font-medium">{rev.createdAt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
