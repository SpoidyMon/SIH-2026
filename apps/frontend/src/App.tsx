import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store";
import { checkAuthSessionThunk } from "./store/slices/authSlice";
import { AuthPage } from "./components/auth/AuthPage";

// Mandi Operator Components
import { MandiLayout } from "./components/layout/MandiLayout";
import { MandiDashboardView } from "./components/dashboard/MandiDashboardView";
import { MandiSlotsView } from "./components/slots/MandiSlotsView";
import { MandiGateScannerView } from "./components/gate/MandiGateScannerView";
import { MandiHistoryView } from "./components/history/MandiHistoryView";
import { MandiSettingsView } from "./components/settings/MandiSettingsView";
import { MandiRatingView } from "./components/rating/MandiRatingView";
import { MandiVerificationStatusView } from "./components/verification/MandiVerificationStatusView";
import { MandiFarmersView } from "./components/farmers/MandiFarmersView";
import { MandiBookingsView } from "./components/bookings/MandiBookingsView";
import { MandiCropPricingView } from "./components/pricing/MandiCropPricingView";

// Farmer Components
import { FarmerLayout } from "./components/layout/FarmerLayout";
import { FarmerDashboardView } from "./components/farmers/FarmerDashboardView";
import { FarmerMandiDiscoveryView } from "./components/farmers/FarmerMandiDiscoveryView";
import { FarmerMandiDetailView } from "./components/farmers/FarmerMandiDetailView";
import { FarmerBookingsView } from "./components/farmers/FarmerBookingsView";

import { RefreshCw } from "lucide-react";

export function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthSessionThunk());
  }, [dispatch]);

  // Loading Splash Screen while checking initial token session
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFCFA] text-[#0B2D1B]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B2D1B] text-[#C8F52F] flex items-center justify-center font-bold text-xl shadow-md">
            A
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6C5F]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#059669]" />
            <span>Initializing Agrovia Mandi Setu...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated or unverified -> Show Auth Portal
  if (!isAuthenticated || !user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage initialMode="LOGIN" />} />
        <Route path="/register" element={<AuthPage initialMode="REGISTER" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Role-Based Router
  const isFarmer = user.role === "FARMER";

  if (isFarmer) {
    return (
      <Routes>
        <Route element={<FarmerLayout />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboardView />} />
          <Route path="/farmer/mandis" element={<FarmerMandiDiscoveryView />} />
          <Route path="/farmer/mandis/:mandiId" element={<FarmerMandiDetailView />} />
          <Route path="/farmer/bookings" element={<FarmerBookingsView />} />
          <Route path="/farmer/notifications" element={<FarmerBookingsView />} />
          <Route path="/farmer/profile" element={<FarmerDashboardView />} />
          <Route path="/farmer/settings" element={<FarmerDashboardView />} />
        </Route>
        <Route path="*" element={<Navigate to="/farmer/dashboard" replace />} />
      </Routes>
    );
  }

  // Mandi Operator Cockpit Router
  return (
    <Routes>
      <Route element={<MandiLayout />}>
        <Route path="/mandi/dashboard" element={<MandiDashboardView />} />
        <Route path="/mandi/bookings" element={<MandiBookingsView />} />
        <Route path="/mandi/manageSlot" element={<MandiSlotsView />} />
        <Route path="/mandi/crop-prices" element={<MandiCropPricingView />} />
        <Route path="/mandi/prices" element={<Navigate to="/mandi/crop-prices" replace />} />
        <Route path="/mandi/GateScanner" element={<MandiGateScannerView />} />
        <Route path="/mandi/verification" element={<MandiVerificationStatusView />} />
        <Route path="/mandi/farmers" element={<MandiFarmersView />} />
        <Route path="/mandi/history" element={<MandiHistoryView />} />
        <Route path="/mandi/settings" element={<MandiSettingsView />} />
        <Route path="/mandi/rating" element={<MandiRatingView />} />
      </Route>
      <Route path="*" element={<Navigate to="/mandi/dashboard" replace />} />
    </Routes>
  );
}
