import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  MandiDashboardStats,
  MandiProfile,
  MandiSlot,
  Booking,
  MandiRatingData,
  CreateSlotPayload,
  OnboardingPayload,
  AadhaarKycPayload,
  LegalDocPayload,
  CompleteBookingPayload,
} from "../../interfaces";
import { mandiApi } from "../../services/mandi.api";

export interface MandiState {
  stats: MandiDashboardStats | null;
  profile: MandiProfile | null;
  slots: MandiSlot[];
  currentBookings: Booking[];
  previousBookings: Booking[];
  previousBookingsTotal: number;
  ratingData: MandiRatingData | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  successMessage: string | null;
  activeNavTab: "dashboard" | "slots" | "scanner" | "verification" | "farmers" | "history" | "settings" | "rating" | "bayAllocation";
}

const defaultInitialStats: MandiDashboardStats = {
  mandiId: "mandi-indore-01",
  mandiName: "Indore APMC Grain & Oilseed Market Yard",
  approvalStatus: "APPROVED",
  activeSlotsCount: 2,
  todayArrivalsCount: 1,
  todayTotalQuintals: 135,
  verifiedCount: 1,
  pendingCount: 1,
  completedCount: 2,
  capacityPercentage: 36.1,
  completedTodayPayouts: 324500,
};

const defaultInitialProfile: MandiProfile = {
  id: "mandi-indore-01",
  userId: "usr-operator-01",
  mandiName: "Indore APMC Grain & Oilseed Market Yard",
  operatingLicense: "APMC-IND-2026-X992",
  state: "Madhya Pradesh",
  district: "Indore",
  yardAddress: "Plot No. 44, Industrial Area, Bypass Highway",
  pinCode: "452010",
  weighbridgeCount: 4,
  approvalStatus: "APPROVED",
  aadhaarVerified: true,
  aadhaarNumber: "•••• •••• 8912",
  rejectionReason: null,
  rating: 4.8,
  totalReviews: 86,
  createdAt: "2026-01-15T08:00:00Z",
  updatedAt: "2026-08-31T10:00:00Z",
  legalDocs: [
    {
      id: "doc-1",
      mandiId: "mandi-indore-01",
      title: "APMC Mandi Yard License 2026-27",
      docType: "MANDI_LICENSE",
      documentType: "MANDI_LICENSE",
      fileUrl: "https://example.com/docs/apmc_license.pdf",
      documentUrl: "https://example.com/docs/apmc_license.pdf",
      status: "VERIFIED",
      verified: true,
      uploadedAt: "2026-01-15",
      createdAt: "2026-01-15",
    },
    {
      id: "doc-2",
      mandiId: "mandi-indore-01",
      title: "State Mandi Board APMC Registration",
      docType: "APMC_REGISTRATION",
      documentType: "APMC_REGISTRATION",
      fileUrl: "https://example.com/docs/state_registration.pdf",
      documentUrl: "https://example.com/docs/state_registration.pdf",
      status: "VERIFIED",
      verified: true,
      uploadedAt: "2026-02-10",
      createdAt: "2026-02-10",
    },
    {
      id: "doc-3",
      mandiId: "mandi-indore-01",
      title: "GST Compliance & Tax Exemption",
      docType: "GST_CERTIFICATE",
      documentType: "GST_CERTIFICATE",
      fileUrl: "https://example.com/docs/gst_certificate.pdf",
      documentUrl: "https://example.com/docs/gst_certificate.pdf",
      status: "VERIFIED",
      verified: true,
      uploadedAt: "2026-03-01",
      createdAt: "2026-03-01",
    },
  ],
};

const defaultInitialSlots: MandiSlot[] = [
  {
    id: "slot-179",
    mandiId: "mandi-indore-01",
    crop: "Wheat (Sharbati)",
    date: "2026-09-01",
    slotDate: "2026-09-01",
    startTime: "08:00",
    endTime: "11:30",
    totalCapacityQuintals: 600,
    maxCapacityQuintals: 600,
    bookedCapacityQuintals: 0,
    maxFarmers: 25,
    maxFarmersLimit: 25,
    bookedFarmers: 0,
    currentFarmersBooked: 0,
    bufferMinutes: 15,
    bufferTimeMinutes: 15,
    bufferPercentage: 10,
    bufferTolerancePercentage: 10,
    status: "OPEN",
    createdAt: "2026-08-30",
  },
  {
    id: "slot-735",
    mandiId: "mandi-indore-01",
    crop: "Mustard (Sarson)",
    date: "2026-09-01",
    slotDate: "2026-09-01",
    startTime: "12:00",
    endTime: "15:30",
    totalCapacityQuintals: 400,
    maxCapacityQuintals: 400,
    bookedCapacityQuintals: 0,
    maxFarmers: 18,
    maxFarmersLimit: 18,
    bookedFarmers: 0,
    currentFarmersBooked: 0,
    bufferMinutes: 20,
    bufferTimeMinutes: 20,
    bufferPercentage: 10,
    bufferTolerancePercentage: 10,
    status: "OPEN",
    createdAt: "2026-08-30",
  },
  {
    id: "slot-101",
    mandiId: "mandi-indore-01",
    crop: "Wheat (Sharbati)",
    date: "2026-08-31",
    slotDate: "2026-08-31",
    startTime: "08:00",
    endTime: "11:00",
    totalCapacityQuintals: 500,
    maxCapacityQuintals: 500,
    bookedCapacityQuintals: 380,
    maxFarmers: 20,
    maxFarmersLimit: 20,
    bookedFarmers: 15,
    currentFarmersBooked: 15,
    bufferMinutes: 15,
    bufferTimeMinutes: 15,
    bufferPercentage: 10,
    bufferTolerancePercentage: 10,
    status: "OPEN",
    createdAt: "2026-08-25",
  },
  {
    id: "slot-102",
    mandiId: "mandi-indore-01",
    crop: "Mustard (Sarson)",
    date: "2026-08-31",
    slotDate: "2026-08-31",
    startTime: "11:30",
    endTime: "14:30",
    totalCapacityQuintals: 350,
    maxCapacityQuintals: 350,
    bookedCapacityQuintals: 310,
    maxFarmers: 15,
    maxFarmersLimit: 15,
    bookedFarmers: 13,
    currentFarmersBooked: 13,
    bufferMinutes: 20,
    bufferTimeMinutes: 20,
    bufferPercentage: 15,
    bufferTolerancePercentage: 15,
    status: "OPEN",
    createdAt: "2026-08-25",
  },
  {
    id: "slot-103",
    mandiId: "mandi-indore-01",
    crop: "Rice (Basmati 1121)",
    date: "2026-09-01",
    slotDate: "2026-09-01",
    startTime: "09:00",
    endTime: "13:00",
    totalCapacityQuintals: 600,
    maxCapacityQuintals: 600,
    bookedCapacityQuintals: 240,
    maxFarmers: 25,
    maxFarmersLimit: 25,
    bookedFarmers: 10,
    currentFarmersBooked: 10,
    bufferMinutes: 30,
    bufferTimeMinutes: 30,
    bufferPercentage: 10,
    bufferTolerancePercentage: 10,
    status: "OPEN",
    createdAt: "2026-08-26",
  },
  {
    id: "slot-104",
    mandiId: "mandi-indore-01",
    crop: "Soyabean (Yellow)",
    date: "2026-09-01",
    slotDate: "2026-09-01",
    startTime: "13:30",
    endTime: "17:00",
    totalCapacityQuintals: 400,
    maxCapacityQuintals: 400,
    bookedCapacityQuintals: 100,
    maxFarmers: 18,
    maxFarmersLimit: 18,
    bookedFarmers: 4,
    currentFarmersBooked: 4,
    bufferMinutes: 15,
    bufferTimeMinutes: 15,
    bufferPercentage: 5,
    bufferTolerancePercentage: 5,
    status: "OPEN",
    createdAt: "2026-08-26",
  },
];

const defaultInitialBookings: Booking[] = [
  {
    id: "BK-98421",
    token: "TKN-7821",
    farmerId: "usr_farmer_01",
    farmerName: "Baldev Singh",
    farmerPhone: "+91 98765 43210",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-101",
    crop: "Wheat (Sharbati)",
    variety: "Grade-A Export Quality",
    estimatedQuantityQuintals: 45,
    quantityQuintals: 45,
    vehicleNumber: "HR-26-DK-9042",
    arrivalDate: "2026-08-31",
    slotTimeWindow: "08:00 - 11:00",
    status: "PENDING",
    qrCodeString: "https://agrovia.gov.in/verify?tkn=TKN-7821",
    createdAt: "2026-08-28T09:30:00Z",
  },
  {
    id: "BK-98418",
    token: "TKN-3190",
    farmerId: "usr_farmer_02",
    farmerName: "Ramesh Patel",
    farmerPhone: "+91 94250 11223",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-102",
    crop: "Mustard (Black Bold)",
    variety: "Grade-B Certified",
    estimatedQuantityQuintals: 60,
    quantityQuintals: 60,
    vehicleNumber: "MP-09-AB-4412",
    arrivalDate: "2026-08-31",
    slotTimeWindow: "09:30 - 12:30",
    status: "ACCEPTED",
    qrCodeString: "https://agrovia.gov.in/verify?tkn=TKN-3190",
    createdAt: "2026-08-29T11:15:00Z",
  },
  {
    id: "BK-98402",
    token: "TKN-5542",
    farmerId: "usr_farmer_03",
    farmerName: "Harpreet Kaur",
    farmerPhone: "+91 98140 77889",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-103",
    crop: "Basmati Rice (1121 Pusa)",
    variety: "Premium Long Grain",
    estimatedQuantityQuintals: 80,
    quantityQuintals: 80,
    vehicleNumber: "PB-10-CZ-2201",
    arrivalDate: "2026-08-31",
    slotTimeWindow: "07:00 - 10:00",
    status: "VERIFIED",
    qrCodeString: "https://agrovia.gov.in/verify?tkn=TKN-5542",
    gateEntryTimestamp: "2026-08-31T07:15:00Z",
    createdAt: "2026-08-28T14:45:00Z",
  },
  {
    id: "BK-98390",
    token: "TKN-1092",
    farmerId: "usr_farmer_04",
    farmerName: "Devendra Yadav",
    farmerPhone: "+91 99881 22334",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-104",
    crop: "Soyabean (Yellow-JS 335)",
    variety: "Oilseed Special",
    estimatedQuantityQuintals: 110,
    quantityQuintals: 110,
    vehicleNumber: "MP-13-CA-3030",
    arrivalDate: "2026-08-31",
    slotTimeWindow: "06:00 - 09:00",
    status: "COMPLETED",
    actualGrossWeightKg: 11200,
    tareWeightKg: 200,
    finalNetWeightQuintals: 110,
    moisturePercentage: 11.4,
    finalPayoutAmount: 594000,
    qrCodeString: "https://agrovia.gov.in/verify?tkn=TKN-1092",
    completedAt: "2026-08-31T08:50:00Z",
    createdAt: "2026-08-27T10:00:00Z",
  },
];

const defaultInitialPreviousBookings: Booking[] = [
  {
    id: "BK-98301",
    token: "TKN-1092",
    farmerId: "usr_farmer_04",
    farmerName: "Gurpreet Singh",
    farmerPhone: "+91 98111 22334",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-098",
    crop: "Rice (Basmati)",
    variety: "1121 Premium",
    estimatedQuantityQuintals: 80,
    vehicleNumber: "PB-02-AX-1120",
    arrivalDate: "2026-08-30",
    slotTimeWindow: "08:00 - 11:00",
    status: "COMPLETED",
    actualGrossWeightKg: 8200,
    tareWeightKg: 200,
    finalNetWeightQuintals: 80,
    moisturePercentage: 11.8,
    finalPayoutAmount: 245000,
    createdAt: "2026-08-27T10:00:00Z",
  },
  {
    id: "BK-98299",
    token: "TKN-1088",
    farmerId: "usr_farmer_05",
    farmerName: "Jagdish Verma",
    farmerPhone: "+91 94250 88991",
    mandiId: "mandi-indore-01",
    mandiName: "Indore APMC Grain & Oilseed Market Yard",
    slotId: "slot-097",
    crop: "Wheat",
    variety: "Lokwan",
    estimatedQuantityQuintals: 55,
    vehicleNumber: "MP-13-CA-3030",
    arrivalDate: "2026-08-29",
    slotTimeWindow: "12:00 - 15:00",
    status: "COMPLETED",
    actualGrossWeightKg: 5650,
    tareWeightKg: 150,
    finalNetWeightQuintals: 55,
    moisturePercentage: 12.1,
    finalPayoutAmount: 126500,
    createdAt: "2026-08-26T11:00:00Z",
  },
];

const initialState: MandiState = {
  stats: defaultInitialStats,
  profile: defaultInitialProfile,
  slots: defaultInitialSlots,
  currentBookings: defaultInitialBookings,
  previousBookings: defaultInitialPreviousBookings,
  previousBookingsTotal: 2,
  ratingData: {
    rating: 4.8,
    averageRating: 4.8,
    totalReviews: 86,
    gatePrecisionPercentage: 98.4,
    averageGateWaitMinutes: 12,
    breakdown: { 5: 68, 4: 14, 3: 3, 2: 1, 1: 0 },
    reviews: [
      {
        id: "rev-1",
        farmerName: "Baldev Singh",
        rating: 5,
        comment: "Excellent electronic weighbridge entry. No delay at Gate 2.",
        date: "2026-08-30",
        crop: "Wheat (Sharbati)",
        createdAt: "2026-08-30",
      },
      {
        id: "rev-2",
        farmerName: "Rameshwar Patel",
        rating: 4,
        comment: "Fast moisture grading and transparent lot booking.",
        date: "2026-08-29",
        crop: "Mustard (Sarson)",
        createdAt: "2026-08-29",
      },
    ],
  },
  isLoading: false,
  isActionLoading: false,
  error: null,
  successMessage: null,
  activeNavTab: "dashboard",
};

// Async Thunks
export const fetchDashboardStatsThunk = createAsyncThunk(
  "mandi/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getDashboardStats();
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to load dashboard stats");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading dashboard");
    }
  }
);

export const fetchProfileThunk = createAsyncThunk(
  "mandi/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getProfile();
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return rejectWithValue(response.message || "Failed to fetch profile");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error fetching profile");
    }
  }
);

export const submitOnboardingThunk = createAsyncThunk(
  "mandi/submitOnboarding",
  async (payload: OnboardingPayload, { rejectWithValue }) => {
    try {
      const response = await mandiApi.submitOnboarding(payload);
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return rejectWithValue(response.message || "Onboarding failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error submitting onboarding");
    }
  }
);

export const submitAadhaarKycThunk = createAsyncThunk(
  "mandi/submitAadhaarKyc",
  async (payload: AadhaarKycPayload, { rejectWithValue }) => {
    try {
      const response = await mandiApi.submitAadhaarKyc(payload);
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return rejectWithValue(response.message || "KYC submission failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error submitting Aadhaar KYC");
    }
  }
);

export const uploadLegalDocThunk = createAsyncThunk(
  "mandi/uploadLegalDoc",
  async (payload: LegalDocPayload, { rejectWithValue }) => {
    try {
      const response = await mandiApi.uploadLegalDoc(payload);
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return rejectWithValue(response.message || "Document upload failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error uploading document");
    }
  }
);

export const deleteLegalDocThunk = createAsyncThunk(
  "mandi/deleteLegalDoc",
  async (docId: string, { rejectWithValue }) => {
    try {
      const response = await mandiApi.deleteLegalDoc(docId);
      if (response.success) {
        return docId;
      }
      return rejectWithValue(response.message || "Document deletion failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error deleting document");
    }
  }
);

export const fetchSlotsThunk = createAsyncThunk(
  "mandi/fetchSlots",
  async (params: { date?: string; crop?: string; isActive?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getSlots(params);
      if (response.success && response.data?.slots) {
        return response.data.slots;
      }
      return rejectWithValue(response.message || "Failed to load slots");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading arrival slots");
    }
  }
);

export const createSlotThunk = createAsyncThunk(
  "mandi/createSlot",
  async (payload: CreateSlotPayload, { rejectWithValue }) => {
    try {
      const response = await mandiApi.createSlot(payload);
      if (response.success && response.data?.slot) {
        return response.data.slot;
      }
      return rejectWithValue(response.message || "Failed to create slot");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error creating slot");
    }
  }
);

export const deleteSlotThunk = createAsyncThunk(
  "mandi/deleteSlot",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await mandiApi.deleteSlot(id);
      if (response.success) {
        return id;
      }
      return rejectWithValue(response.message || "Failed to delete slot");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error deleting slot");
    }
  }
);

export const applyDefaultPresetsThunk = createAsyncThunk(
  "mandi/applyDefaultPresets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mandiApi.applyDefaultPreset();
      if (response.success && response.data?.slots) {
        return response.data.slots;
      }
      return rejectWithValue(response.message || "Failed to apply presets");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error applying default presets");
    }
  }
);

export const fetchCurrentBookingsThunk = createAsyncThunk(
  "mandi/fetchCurrentBookings",
  async (params: { status?: string; date?: string; crop?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getCurrentBookings(params);
      if (response.success && response.data?.bookings) {
        return response.data.bookings;
      }
      return rejectWithValue(response.message || "Failed to fetch bookings");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error fetching live bookings");
    }
  }
);

export const fetchPreviousBookingsThunk = createAsyncThunk(
  "mandi/fetchPreviousBookings",
  async (params: { search?: string; crop?: string; date?: string; limit?: number; offset?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getPreviousBookings(params);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to fetch history");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading historical records");
    }
  }
);

export const updateBookingStatusThunk = createAsyncThunk(
  "mandi/updateBookingStatus",
  async ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" | "ARRIVED" | "CANCELLED" }, { getState, rejectWithValue }) => {
    try {
      const response = await mandiApi.updateBookingStatus(id, status);
      if (response.success && response.data?.booking) {
        return response.data.booking;
      }
    } catch (err: any) {
      // Graceful fallback for mock interactive demo
    }
    const state = getState() as { mandi: MandiState };
    const existing = state.mandi.currentBookings.find((b) => b.id === id);
    if (existing) {
      return { ...existing, status };
    }
    return rejectWithValue("Status update failed");
  }
);

export const verifyGateTokenThunk = createAsyncThunk(
  "mandi/verifyGateToken",
  async (tokenOrCode: string, { getState, rejectWithValue }) => {
    try {
      const response = await mandiApi.verifyGateToken(tokenOrCode);
      if (response.success && response.data?.booking) {
        return response.data;
      }
    } catch (err: any) {
      // Graceful fallback for mock interactive demo
    }
    const state = getState() as { mandi: MandiState };
    const cleanToken = tokenOrCode.trim().toLowerCase();
    const found = state.mandi.currentBookings.find(
      (b) => b.token.toLowerCase() === cleanToken || b.id.toLowerCase() === cleanToken
    );
    if (found) {
      return {
        booking: { ...found, status: "VERIFIED" as const, gateEntryTimestamp: new Date().toISOString() },
        message: `Gate Pass Verified! Token: ${found.token}`,
      };
    }
    return rejectWithValue("Invalid or unconfirmed QR/Token");
  }
);

export const completeBookingThunk = createAsyncThunk(
  "mandi/completeBooking",
  async ({ id, payload }: { id: string; payload: CompleteBookingPayload }, { getState, rejectWithValue }) => {
    try {
      const response = await mandiApi.completeWeighbridgeBooking(id, payload);
      if (response.success && response.data?.booking) {
        return response.data.booking;
      }
    } catch (err: any) {
      // Graceful fallback for mock interactive demo
    }
    const state = getState() as { mandi: MandiState };
    const found = state.mandi.currentBookings.find((b) => b.id === id);
    if (found) {
      return {
        ...found,
        status: "COMPLETED" as const,
        actualGrossWeightKg: (payload.actualWeightQuintals * 100) + 200,
        tareWeightKg: 200,
        finalNetWeightQuintals: payload.actualWeightQuintals,
        moisturePercentage: 11.4,
        finalPayoutAmount: payload.finalPayoutAmount,
        completedAt: new Date().toISOString(),
      };
    }
    return rejectWithValue("Completion failed");
  }
);

export const fetchRatingThunk = createAsyncThunk(
  "mandi/fetchRating",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getRating();
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to load ratings");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading ratings");
    }
  }
);

export const mandiSlice = createSlice({
  name: "mandi",
  initialState,
  reducers: {
    setActiveNavTab: (state, action: PayloadAction<MandiState["activeNavTab"]>) => {
      state.activeNavTab = action.payload;
    },
    clearMandiError: (state) => {
      state.error = null;
    },
    clearMandiSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
      .addCase(fetchDashboardStatsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStatsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStatsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Profile & KYC
    builder
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(submitOnboardingThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.successMessage = "APMC Onboarding submitted successfully for admin review!";
      })
      .addCase(submitAadhaarKycThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.successMessage = "Aadhaar KYC submitted successfully!";
      })
      .addCase(uploadLegalDocThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.successMessage = "Statutory compliance document uploaded!";
      })
      .addCase(deleteLegalDocThunk.fulfilled, (state, action) => {
        if (state.profile?.legalDocs) {
          state.profile.legalDocs = state.profile.legalDocs.filter((d) => d.id !== action.payload);
        }
        state.successMessage = "Document removed.";
      });

    // Slots
    builder
      .addCase(fetchSlotsThunk.fulfilled, (state, action) => {
        state.slots = action.payload;
      })
      .addCase(createSlotThunk.fulfilled, (state, action) => {
        state.slots.unshift(action.payload);
        state.successMessage = "Arrival slot created successfully!";
      })
      .addCase(deleteSlotThunk.fulfilled, (state, action) => {
        state.slots = state.slots.filter((s) => s.id !== action.payload);
        state.successMessage = "Arrival slot removed.";
      })
      .addCase(applyDefaultPresetsThunk.fulfilled, (state, action) => {
        state.slots = [...action.payload, ...state.slots];
        state.successMessage = "Default morning & afternoon presets generated!";
      });

    // Current Bookings
    builder
      .addCase(fetchCurrentBookingsThunk.fulfilled, (state, action) => {
        state.currentBookings = action.payload;
      })
      .addCase(updateBookingStatusThunk.fulfilled, (state, action) => {
        const index = state.currentBookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.currentBookings[index] = action.payload;
        }
        state.successMessage = `Booking status updated to ${action.payload.status}`;
      })
      .addCase(verifyGateTokenThunk.fulfilled, (state, action) => {
        const updated = action.payload.booking;
        const index = state.currentBookings.findIndex((b) => b.id === updated.id);
        if (index !== -1) {
          state.currentBookings[index] = updated;
        } else {
          state.currentBookings.unshift(updated);
        }
        state.successMessage = `Gate Pass Verified! Token: ${updated.token}`;
      })
      .addCase(completeBookingThunk.fulfilled, (state, action) => {
        const index = state.currentBookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.currentBookings[index] = action.payload;
        }
        state.previousBookings.unshift(action.payload);
        state.successMessage = `Weighbridge settlement complete! Payout: ₹${action.payload.finalPayoutAmount?.toLocaleString('en-IN')}`;
      });

    // History
    builder.addCase(fetchPreviousBookingsThunk.fulfilled, (state, action) => {
      state.previousBookings = action.payload.bookings;
      state.previousBookingsTotal = action.payload.total;
    });

    // Ratings
    builder.addCase(fetchRatingThunk.fulfilled, (state, action) => {
      state.ratingData = action.payload;
    });
  },
});

export const { setActiveNavTab, clearMandiError, clearMandiSuccess } = mandiSlice.actions;
export default mandiSlice.reducer;
