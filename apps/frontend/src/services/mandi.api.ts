import { apiClient } from "./apiClient";
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
  ApiResponse,
} from "../interfaces";

export const mandiApi = {
  // 1. Dashboard & Rating
  getDashboardStats: async (): Promise<ApiResponse<MandiDashboardStats>> => {
    const response = await apiClient.get<ApiResponse<MandiDashboardStats>>("/mandi/dashboard");
    return response.data;
  },

  getRating: async (): Promise<ApiResponse<MandiRatingData>> => {
    const response = await apiClient.get<ApiResponse<MandiRatingData>>("/mandi/rating");
    return response.data;
  },

  // 2. Profile, Onboarding & KYC
  getProfile: async (): Promise<ApiResponse<{ profile: MandiProfile }>> => {
    const response = await apiClient.get<ApiResponse<{ profile: MandiProfile }>>("/mandi/profile");
    return response.data;
  },

  updateProfile: async (payload: Partial<OnboardingPayload>): Promise<ApiResponse<{ profile: MandiProfile }>> => {
    const response = await apiClient.put<ApiResponse<{ profile: MandiProfile }>>("/mandi/profile", payload);
    return response.data;
  },

  submitOnboarding: async (payload: OnboardingPayload): Promise<ApiResponse<{ profile: MandiProfile }>> => {
    const response = await apiClient.post<ApiResponse<{ profile: MandiProfile }>>("/mandi/onboarding", payload);
    return response.data;
  },

  submitAadhaarKyc: async (payload: AadhaarKycPayload): Promise<ApiResponse<{ profile: MandiProfile }>> => {
    const response = await apiClient.post<ApiResponse<{ profile: MandiProfile }>>("/mandi/kyc/aadhaar", payload);
    return response.data;
  },

  uploadLegalDoc: async (payload: LegalDocPayload): Promise<ApiResponse<{ document: unknown; profile: MandiProfile }>> => {
    const response = await apiClient.post<ApiResponse<{ document: unknown; profile: MandiProfile }>>("/mandi/kyc/documents", payload);
    return response.data;
  },

  deleteLegalDoc: async (docId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/mandi/kyc/documents/${docId}`);
    return response.data;
  },

  // 3. Arrival Slots Management
  getSlots: async (params?: { date?: string; crop?: string; isActive?: boolean }): Promise<ApiResponse<{ slots: MandiSlot[] }>> => {
    const response = await apiClient.get<ApiResponse<{ slots: MandiSlot[] }>>("/mandi/slots", { params });
    return response.data;
  },

  createSlot: async (payload: CreateSlotPayload): Promise<ApiResponse<{ slot: MandiSlot }>> => {
    const response = await apiClient.post<ApiResponse<{ slot: MandiSlot }>>("/mandi/slots", payload);
    return response.data;
  },

  updateSlot: async (id: string, payload: Partial<CreateSlotPayload>): Promise<ApiResponse<{ slot: MandiSlot }>> => {
    const response = await apiClient.put<ApiResponse<{ slot: MandiSlot }>>(`/mandi/slots/${id}`, payload);
    return response.data;
  },

  deleteSlot: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/mandi/slots/${id}`);
    return response.data;
  },

  applyDefaultPreset: async (): Promise<ApiResponse<{ slots: MandiSlot[]; message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ slots: MandiSlot[]; message: string }>>("/mandi/slots/default-preset");
    return response.data;
  },

  // 4. Live Bookings Pipeline & Gate Pass Verification
  getCurrentBookings: async (params?: { status?: string; date?: string; crop?: string }): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    const response = await apiClient.get<ApiResponse<{ bookings: Booking[] }>>("/mandi/bookings/current", { params });
    return response.data;
  },

  getPreviousBookings: async (params?: { search?: string; crop?: string; date?: string; limit?: number; offset?: number }): Promise<ApiResponse<{ bookings: Booking[]; total: number }>> => {
    const response = await apiClient.get<ApiResponse<{ bookings: Booking[]; total: number }>>("/mandi/bookings/previous", { params });
    return response.data;
  },

  updateBookingStatus: async (id: string, status: "ACCEPTED" | "REJECTED" | "ARRIVED" | "CANCELLED"): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.patch<ApiResponse<{ booking: Booking }>>(`/mandi/bookings/${id}/status`, { status });
    return response.data;
  },

  verifyGateToken: async (qrTokenOrCode: string): Promise<ApiResponse<{ booking: Booking; message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ booking: Booking; message: string }>>("/mandi/bookings/verify", {
      qrToken: qrTokenOrCode,
    });
    return response.data;
  },

  completeWeighbridgeBooking: async (id: string, payload: CompleteBookingPayload): Promise<ApiResponse<{ booking: Booking; message: string }>> => {
    const response = await apiClient.patch<ApiResponse<{ booking: Booking; message: string }>>(`/mandi/bookings/${id}/complete`, payload);
    return response.data;
  },
};
