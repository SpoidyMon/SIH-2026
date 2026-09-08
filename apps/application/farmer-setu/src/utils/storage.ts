import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = '@kisan_setu_auth_token';
export const REFRESH_TOKEN_KEY = '@kisan_setu_refresh_token';
export const USER_STORAGE_KEY = '@kisan_setu_user_profile';
export const PROFILE_STORAGE_KEY = '@kisan_setu_farmer_profile';

// In-memory fallback cache in case native storage is unavailable (e.g. headless/test/SSR)
const memoryStorage = new Map<string, string>();

/**
 * Safely retrieve an item from persistent storage with in-memory fallback
 */
export async function getStorageItem(key: string): Promise<string | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val !== null && val !== undefined) {
      memoryStorage.set(key, val);
      return val;
    }
  } catch (err) {
    // Return from memory cache if native module fails
  }
  return memoryStorage.get(key) ?? null;
}

/**
 * Safely write an item to persistent storage with in-memory fallback
 */
export async function setStorageItem(key: string, value: string): Promise<void> {
  memoryStorage.set(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    // Memory cache already updated
  }
}

/**
 * Safely remove an item from persistent storage with in-memory fallback
 */
export async function removeStorageItem(key: string): Promise<void> {
  memoryStorage.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    // Memory cache already updated
  }
}

/**
 * Safely clear storage
 */
export async function clearStorage(): Promise<void> {
  memoryStorage.clear();
  try {
    await AsyncStorage.clear();
  } catch (err) {
    // Memory cache cleared
  }
}
