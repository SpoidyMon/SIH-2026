import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { ApiResponse } from '@/interfaces';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '@/utils/storage';

function getApiBaseUrl(): string {
  // 1. Explicit environment override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Web browser: localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:4000/api/v1';
  }

  // 3. Dynamically resolve host from Expo debugger/bundler
  const rawHost =
    Constants.expoConfig?.hostUri ||
    (Constants as Record<string, any>).expoGoConfig?.debuggerHost ||
    (Constants as Record<string, any>).manifest?.debuggerHost ||
    (Constants as Record<string, any>).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as Record<string, any>).manifest2?.extra?.expoClient?.hostUri ||
    Constants.experienceUrl;

  if (typeof rawHost === 'string' && rawHost.length > 0) {
    // Clean up exp:// or http:// prefixes and extract host
    const cleanHost = rawHost.replace(/^(exp|http|https):\/\//, '');
    const hostIp = cleanHost.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:4000/api/v1`;
    }
  }

  // 4. Android Emulator only (not physical device)
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:4000/api/v1';
  }

  // 5. Default to the development machine LAN IP for physical phones on local Wi-Fi
  return 'http://10.91.95.157:4000/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

// Token listener system for state synchronization across the app
type TokenListener = (newToken: string | null) => void;
const tokenListeners = new Set<TokenListener>();

export function addTokenListener(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

function notifyTokenChanged(newToken: string | null): void {
  tokenListeners.forEach((fn) => {
    try {
      fn(newToken);
    } catch (err) {
      console.warn('Error in token listener:', err);
    }
  });
}

// In-flight refresh promise to deduplicate concurrent 401s
let refreshPromise: Promise<string | null> | null = null;

/**
 * Pure modular function to refresh tokens using the stored refresh token.
 */
export async function refreshFarmerTokens(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await getStorageItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        return null;
      }

      const refreshUrl = `${API_BASE_URL}/auth/refresh`;
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || !resData.success || !resData.data?.accessToken) {
        // Refresh token expired or revoked - clear tokens
        await removeStorageItem(AUTH_TOKEN_KEY);
        await removeStorageItem(REFRESH_TOKEN_KEY);
        notifyTokenChanged(null);
        return null;
      }

      const newAccessToken = resData.data.accessToken;
      const newRefreshToken = resData.data.refreshToken;

      await setStorageItem(AUTH_TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        await setStorageItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      notifyTokenChanged(newAccessToken);
      return newAccessToken;
    } catch (err) {
      console.warn('Failed to refresh farmer tokens:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface ExtendedRequestInit extends RequestInit {
  _isRetry?: boolean;
}

/**
 * Pure modular function for executing API requests with timeout, error handling,
 * and automatic 401 token refresh retry.
 */
export async function requestApi<T>(
  endpoint: string,
  options: ExtendedRequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // If token is not explicitly provided, attempt to read from storage
  let activeToken = token;
  if (!activeToken && !endpoint.includes('/auth/')) {
    activeToken = await getStorageItem(AUTH_TOKEN_KEY);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    // Handle 401 Unauthorized with silent token refresh
    if (
      response.status === 401 &&
      !options._isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/register')
    ) {
      const freshToken = await refreshFarmerTokens();
      if (freshToken) {
        // Transparently retry original request with fresh access token
        return requestApi<T>(
          endpoint,
          { ...options, _isRetry: true },
          freshToken
        );
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;
      return {
        success: false,
        message: errorMessage,
        code: data?.code,
      };
    }

    return {
      success: true,
      message: data?.message,
      data: data?.data ?? data,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. Please check if the backend server is running and reachable.',
        code: 'TIMEOUT_ERROR',
      };
    }

    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Network connection failed. Please verify backend server is reachable.';
    return {
      success: false,
      message: `${errorMsg} (Connecting to: ${API_BASE_URL})`,
      code: 'NETWORK_ERROR',
    };
  }
}
