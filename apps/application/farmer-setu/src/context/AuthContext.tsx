import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
} from '@/utils/storage';
import { addTokenListener } from '@/services/api';
import type {
  AuthContextType,
  FarmerUser,
  FarmerProfileData,
  UpdateFarmerProfilePayload,
  LoginPayload,
  RegisterPayload,
  SendOtpPayload,
  VerifyOtpPayload,
} from '@/interfaces';
import {
  loginFarmerApi,
  registerFarmerApi,
  verifyOtpFarmerApi,
  sendOtpFarmerApi,
} from '@/services/auth.service';
import {
  getFarmerProfileApi,
  updateFarmerProfileApi,
} from '@/services/farmer.service';

async function persistStoredAuth(
  user: FarmerUser | null,
  token: string | null,
  refreshToken?: string | null,
  profile?: FarmerProfileData | null
): Promise<void> {
  try {
    if (user && token) {
      await setStorageItem(AUTH_TOKEN_KEY, token);
      await setStorageItem(USER_STORAGE_KEY, JSON.stringify(user));
      if (refreshToken) {
        await setStorageItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      if (profile) {
        await setStorageItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    } else {
      await removeStorageItem(AUTH_TOKEN_KEY);
      await removeStorageItem(REFRESH_TOKEN_KEY);
      await removeStorageItem(USER_STORAGE_KEY);
      await removeStorageItem(PROFILE_STORAGE_KEY);
    }
  } catch (err) {
    // Memory fallback handled
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfileData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (activeToken: string) => {
    try {
      const res = await getFarmerProfileApi(activeToken);
      if (res.success && res.data && res.data.farmerProfile) {
        setFarmerProfile(res.data.farmerProfile);
        await setStorageItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(res.data.farmerProfile)
        );
      }
    } catch (err) {
      // Handled
    }
  }, []);

  // Listen to silent background token refreshes or invalidations
  useEffect(() => {
    const unsubscribe = addTokenListener((newToken) => {
      setToken(newToken);
      if (!newToken) {
        setUser(null);
        setFarmerProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  // Rehydrate auth state from storage on app startup
  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        const storedToken = await getStorageItem(AUTH_TOKEN_KEY);
        const storedUser = await getStorageItem(USER_STORAGE_KEY);
        const storedProfile = await getStorageItem(PROFILE_STORAGE_KEY);

        if (isMounted && storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as FarmerUser;
          if (parsedUser && parsedUser.role === 'FARMER') {
            setUser(parsedUser);
            setToken(storedToken);

            if (storedProfile) {
              setFarmerProfile(JSON.parse(storedProfile) as FarmerProfileData);
            }

            // Refresh profile from API in background
            fetchProfile(storedToken);
          }
        }
      } catch (err) {
        console.warn('Failed to rehydrate auth from storage:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    loadAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const clearError = useCallback(() => {
    setError((prev) => (prev !== null ? null : prev));
  }, []);

  const refreshFarmerProfile = useCallback(async () => {
    if (!token) return;
    await fetchProfile(token);
  }, [token, fetchProfile]);

  const updateProfile = useCallback(
    async (payload: UpdateFarmerProfilePayload): Promise<boolean> => {
      if (!token) {
        setError('You must be logged in to update profile.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      const response = await updateFarmerProfileApi(token, payload);
      setIsLoading(false);

      if (!response.success || !response.data) {
        setError(response.message || 'Failed to update profile.');
        return false;
      }

      if (response.data.farmerProfile) {
        setFarmerProfile(response.data.farmerProfile);
        await setStorageItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(response.data.farmerProfile)
        );
      }

      return true;
    },
    [token]
  );

  const login = useCallback(
    async (payload: LoginPayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const response = await loginFarmerApi(payload);
      setIsLoading(false);

      if (!response.success || !response.data) {
        setError(response.message || 'Login failed. Please check your credentials.');
        return false;
      }

      const { user: authenticatedUser, accessToken, refreshToken } = response.data;
      setUser(authenticatedUser);
      setToken(accessToken);
      await persistStoredAuth(authenticatedUser, accessToken, refreshToken);

      // Fetch profile to get farmerCode and completion status
      await fetchProfile(accessToken);
      return true;
    },
    [fetchProfile]
  );

  const register = useCallback(
    async (payload: Omit<RegisterPayload, 'role'>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const response = await registerFarmerApi(payload);
      setIsLoading(false);

      if (!response.success) {
        setError(response.message || 'Registration failed. Please verify your details.');
        return false;
      }

      return true;
    },
    []
  );

  const verifyOtp = useCallback(
    async (payload: VerifyOtpPayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const response = await verifyOtpFarmerApi(payload);
      setIsLoading(false);

      if (!response.success || !response.data) {
        setError(response.message || 'OTP verification failed. Please try again.');
        return false;
      }

      if (response.data.user && response.data.accessToken) {
        const authenticatedUser = response.data.user;
        const accessToken = response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        setUser(authenticatedUser);
        setToken(accessToken);
        await persistStoredAuth(authenticatedUser, accessToken, refreshToken);
        await fetchProfile(accessToken);
      }
      return true;
    },
    [fetchProfile]
  );

  const sendOtp = useCallback(
    async (payload: SendOtpPayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const response = await sendOtpFarmerApi(payload);
      setIsLoading(false);

      if (!response.success) {
        setError(response.message || 'Failed to send OTP code.');
        return false;
      }
      return true;
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    setFarmerProfile(null);
    setToken(null);
    setError(null);
    await persistStoredAuth(null, null);
  }, []);

  const farmerCode = farmerProfile?.farmerCode || null;
  const isProfileComplete = Boolean(farmerProfile?.isProfileComplete);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      farmerProfile,
      token,
      isLoading,
      isInitializing,
      error,
      farmerCode,
      isProfileComplete,
      login,
      register,
      verifyOtp,
      sendOtp,
      logout,
      clearError,
      refreshFarmerProfile,
      updateProfile,
    }),
    [
      user,
      farmerProfile,
      token,
      isLoading,
      isInitializing,
      error,
      farmerCode,
      isProfileComplete,
      login,
      register,
      verifyOtp,
      sendOtp,
      logout,
      clearError,
      refreshFarmerProfile,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
