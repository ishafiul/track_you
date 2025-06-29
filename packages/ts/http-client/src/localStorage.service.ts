// Constants for local storage keys
const STORAGE_KEYS = {
  DEVICE_UUID: 'device_uuid',
  ACCESS_TOKEN: 'access_token',
};

// Helper to check if localStorage is available (since this could run on server in Next.js)
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// LocalStorage service
export const localStorageService = {
  // Device UUID methods
  getDeviceUuid: (): string | null => {
    if (!isLocalStorageAvailable()) return null;
    return localStorage.getItem(STORAGE_KEYS.DEVICE_UUID);
  },
  
  setDeviceUuid: (uuid: string): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.DEVICE_UUID, uuid);
  },
  
  // Access token methods
  getAccessToken: (): string | null => {
    if (!isLocalStorageAvailable()) return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  setAccessToken: (token: string): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },  
  // Clear all auth data (for logout)
  clearAuthData: (): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEYS.DEVICE_UUID);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
};

export default localStorageService; 