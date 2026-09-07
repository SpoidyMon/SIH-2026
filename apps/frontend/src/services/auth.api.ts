import { apiClient, setTokens, clearTokens, getRefreshToken } from "./apiClient";
import {
  LoginPayload,
  RegisterMandiPayload,
  VerifyOtpPayload,
  SendOtpPayload,
  AuthResponseData,
  UserSession,
  ApiResponse,
} from "../interfaces";

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", payload);
    if (response.data.success && response.data.data) {
      setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    }
    return response.data;
  },

  registerMandi: async (payload: RegisterMandiPayload): Promise<ApiResponse<AuthResponseData>> => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>("/user/mandi", payload);
    if (response.data.success && response.data.data) {
      setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    }
    return response.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<ApiResponse<{ isVerified: boolean; message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ isVerified: boolean; message: string }>>(
      "/auth/verify-otp",
      payload
    );
    return response.data;
  },

  sendOtp: async (payload: SendOtpPayload): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>("/auth/send-otp", payload);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: UserSession }>> => {
    const response = await apiClient.get<ApiResponse<{ user: UserSession }>>("/auth/me");
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore logout errors and clean local state
      }
    }
    clearTokens();
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (payload: { email: string; token: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>("/auth/reset-password", payload);
    return response.data;
  },
};
