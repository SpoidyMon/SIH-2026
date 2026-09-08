import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserSession, LoginPayload, RegisterMandiPayload, VerifyOtpPayload, AuthState } from "../../interfaces";
import { authApi } from "../../services/auth.api";
import { getAccessToken, clearTokens } from "../../services/apiClient";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isOnboarding: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  otpRequiredForEmail: null,
};

export const checkAuthSessionThunk = createAsyncThunk(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    const token = getAccessToken();
    if (!token) {
      return rejectWithValue("No token");
    }
    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        return response.data.user;
      }
      return rejectWithValue("Failed to fetch user");
    } catch (err: any) {
      clearTokens();
      return rejectWithValue(err.response?.data?.message || "Session expired");
    }
  }
);

export const loginMandiThunk = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Login failed");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Invalid credentials";
      const errorCode = err.response?.data?.code;
      return rejectWithValue({ message: errorMsg, code: errorCode, email: payload.identifier });
    }
  }
);

export const registerMandiThunk = createAsyncThunk(
  "auth/registerMandi",
  async (payload: RegisterMandiPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.registerMandi(payload);
      if (response.success && response.data) {
        return { ...response.data, email: payload.email };
      }
      return rejectWithValue(response.message || "Registration failed");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed";
      return rejectWithValue(errorMsg);
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyOtp(payload);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || "Invalid OTP");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "OTP verification failed");
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await authApi.logout();
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setOtpEmail: (state, action: PayloadAction<string | null>) => {
      state.otpRequiredForEmail = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    startOnboarding: (state) => {
      state.isOnboarding = true;
      state.isAuthenticated = false;
    },
    completeOnboarding: (state) => {
      state.isOnboarding = false;
      state.isAuthenticated = true;
    },
    cancelOnboarding: (state) => {
      state.isOnboarding = false;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // checkAuthSession
    builder
      .addCase(checkAuthSessionThunk.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(checkAuthSessionThunk.fulfilled, (state, action: PayloadAction<UserSession>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitializing = false;
        state.error = null;
      })
      .addCase(checkAuthSessionThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      });

    // login
    builder
      .addCase(loginMandiThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginMandiThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isOnboarding = false;
        state.error = null;
        state.otpRequiredForEmail = null;
      })
      .addCase(loginMandiThunk.rejected, (state, action: any) => {
        state.isLoading = false;
        if (action.payload?.code === "ACCOUNT_NOT_VERIFIED") {
          state.otpRequiredForEmail = action.payload.email;
          state.error = action.payload.message;
        } else {
          state.error = typeof action.payload === "string" ? action.payload : action.payload?.message || "Login failed";
        }
      });

    // register
    builder
      .addCase(registerMandiThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerMandiThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // Requires OTP verification + onboarding
        state.isOnboarding = true;
        state.otpRequiredForEmail = action.payload.email;
      })
      .addCase(registerMandiThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // verifyOtp
    builder
      .addCase(verifyOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) {
          state.user.isVerified = true;
        }
        // If the user is currently completing the registration wizard, do NOT mark authenticated yet
        // so App.tsx does not redirect to /mandi/dashboard before Step 2 & 3 are complete.
        if (!state.isOnboarding) {
          state.isAuthenticated = true;
        }
        state.otpRequiredForEmail = null;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isOnboarding = false;
      state.error = null;
      state.otpRequiredForEmail = null;
    });
  },
});

export const { setOtpEmail, clearAuthError, startOnboarding, completeOnboarding, cancelOnboarding } = authSlice.actions;
export default authSlice.reducer;
