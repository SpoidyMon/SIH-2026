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
  commodities: Array<{ id: string; name: string; category?: string }>;
  selectedFarmerDetails: any | null;
  queueAlertMessage: string | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  successMessage: string | null;
  activeNavTab: "dashboard" | "bookings" | "slots" | "scanner" | "verification" | "farmers" | "history" | "settings" | "rating" | "bayAllocation";
}

const defaultInitialStats: MandiDashboardStats = {
  mandiId: "",
  mandiName: "",
  approvalStatus: "PENDING_ONBOARDING",
  activeSlotsCount: 0,
  todayArrivalsCount: 0,
  todayTotalQuintals: 0,
  verifiedCount: 0,
  pendingCount: 0,
  completedCount: 0,
  capacityPercentage: 0,
  completedTodayPayouts: 0,
};

const initialState: MandiState = {
  stats: defaultInitialStats,
  profile: null,
  slots: [],
  currentBookings: [],
  previousBookings: [],
  previousBookingsTotal: 0,
  ratingData: null,
  commodities: [],
  selectedFarmerDetails: null,
  queueAlertMessage: null,
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

export const batchCreateSlotsThunk = createAsyncThunk(
  "mandi/batchCreateSlots",
  async (
    payload: {
      slots: CreateSlotPayload[];
      closedDays?: string[];
      closedHours?: string;
      operatingHours?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await mandiApi.batchCreateSlots(payload);
      if (response.success && response.data?.slots) {
        dispatch(fetchSlotsThunk());
        dispatch(fetchProfileThunk());
        return response.data.slots;
      }
      return rejectWithValue(response.message || "Failed to generate weekly schedule");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error generating weekly slots");
    }
  }
);

export const updateWeeklyScheduleThunk = createAsyncThunk(
  "mandi/updateWeeklySchedule",
  async (
    payload: {
      closedDays: string[];
      operatingHours: string;
      closedHours?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await mandiApi.batchCreateSlots({
        slots: [],
        closedDays: payload.closedDays,
        operatingHours: payload.operatingHours,
        closedHours: payload.closedHours,
      });
      if (response.success) {
        dispatch(fetchProfileThunk());
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to update weekly schedule");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error updating weekly schedule");
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
  async ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" | "ARRIVED" | "CANCELLED" }, { rejectWithValue }) => {
    try {
      const response = await mandiApi.updateBookingStatus(id, status);
      if (response.success && response.data?.booking) {
        return response.data.booking;
      }
      return rejectWithValue(response.message || "Status update failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Status update failed");
    }
  }
);

export const verifyGateTokenThunk = createAsyncThunk(
  "mandi/verifyGateToken",
  async (tokenOrCode: string, { rejectWithValue }) => {
    try {
      const response = await mandiApi.verifyGateToken(tokenOrCode);
      if (response.success && response.data?.booking) {
        return response.data;
      }
      return rejectWithValue(response.message || "Invalid or unconfirmed QR/Token");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Invalid or unconfirmed QR/Token");
    }
  }
);

export const completeBookingThunk = createAsyncThunk(
  "mandi/completeBooking",
  async ({ id, payload }: { id: string; payload: CompleteBookingPayload }, { rejectWithValue }) => {
    try {
      const response = await mandiApi.completeWeighbridgeBooking(id, payload);
      if (response.success && response.data?.booking) {
        return response.data.booking;
      }
      return rejectWithValue(response.message || "Completion failed");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Completion failed");
    }
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

export const updateMandiLocationThunk = createAsyncThunk(
  "mandi/updateLocation",
  async (
    payload: { address: string; pincode: string; latitude: number; longitude: number; district?: string; state?: string; operatingHours?: string; closedDays?: string[]; closedHours?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await mandiApi.updateLocation(payload);
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return rejectWithValue(response.message || "Failed to update location");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error updating physical location");
    }
  }
);

export const fetchFarmerDetailsThunk = createAsyncThunk(
  "mandi/fetchFarmerDetails",
  async (farmerId: string, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getFarmerDetails(farmerId);
      if (response.success && response.data?.farmer) {
        return response.data.farmer;
      }
      return rejectWithValue(response.message || "Failed to fetch farmer details");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading farmer profile");
    }
  }
);

export const fetchCommoditiesThunk = createAsyncThunk(
  "mandi/fetchCommodities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mandiApi.getCommodities();
      if (response.success && response.data?.commodities) {
        return response.data.commodities;
      }
      return rejectWithValue(response.message || "Failed to fetch commodities");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Error loading commodities list");
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
    clearQueueAlert: (state) => {
      state.queueAlertMessage = null;
    },
    setSelectedFarmerDetails: (state, action: PayloadAction<any | null>) => {
      state.selectedFarmerDetails = action.payload;
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
      })
      .addCase(batchCreateSlotsThunk.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.successMessage = "Weekly arrival schedule saved and live slots generated!";
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
        state.queueAlertMessage = action.payload.warningMessage || null;
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

    // Location
    builder.addCase(updateMandiLocationThunk.fulfilled, (state, action) => {
      state.profile = action.payload;
      state.successMessage = "Physical yard location updated! Mandi is now active on the farmer app.";
    });

    // Farmer Details
    builder.addCase(fetchFarmerDetailsThunk.fulfilled, (state, action) => {
      state.selectedFarmerDetails = action.payload;
    });

    // Commodities
    builder.addCase(fetchCommoditiesThunk.fulfilled, (state, action) => {
      state.commodities = action.payload;
    });
  },
});

export const {
  setActiveNavTab,
  clearMandiError,
  clearMandiSuccess,
  clearQueueAlert,
  setSelectedFarmerDetails,
} = mandiSlice.actions;
export default mandiSlice.reducer;
