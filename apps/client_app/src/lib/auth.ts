import { createHttpClient, localStorageService } from 'http-client-local';

export interface AuthTokens {
  accessToken: string;
  userId: string;
}

interface CreateDeviceUuidResponse {
  deviceUuid: string;
}

interface RequestOtpRequest {
  email: string;
  deviceUuid: string;
}

interface VerifyOtpRequest {
  email: string;
  deviceUuid: string;
  otp: number;
}

interface VerifyOtpResponse {
  accessToken: string;
  userId: string;
}

class AuthService {
  private httpClient;

  constructor() {
    const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';
    this.httpClient = createHttpClient({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async createDeviceUuid(): Promise<CreateDeviceUuidResponse> {
    // Send basic device information that the API expects
    const deviceInfo = {
      deviceType: 'web',
      osName: navigator.platform || 'unknown',
      osVersion: navigator.userAgent || 'unknown',
      deviceModel: 'browser',
      isPhysicalDevice: 'false',
      appVersion: '1.0.0', // You can make this dynamic
      fcmToken: null,
      longitude: null,
      latitude: null,
    };
    
    return this.httpClient.post<CreateDeviceUuidResponse>('/auth/createDeviceUuid', deviceInfo);
  }

  async requestOtp(data: RequestOtpRequest): Promise<void> {
    await this.httpClient.post('/auth/reqOtp', data);
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthTokens> {
    const response = await this.httpClient.post<VerifyOtpResponse>('/auth/verifyOtp', data);
    return {
      accessToken: response.accessToken,
      userId: response.userId,
    };
  }

  setTokens(tokens: AuthTokens): void {
    // Store in custom format for compatibility
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    // Use the package's localStorage service for HTTP client integration
    localStorageService.setAccessToken(tokens.accessToken);
    // Also store device UUID if we have it
    const deviceUuid = localStorageService.getDeviceUuid();
    if (!deviceUuid) {
      // Try to get from old storage and migrate
      const oldDeviceUuid = localStorage.getItem('deviceUuid');
      if (oldDeviceUuid) {
        localStorageService.setDeviceUuid(oldDeviceUuid);
        localStorage.removeItem('deviceUuid'); // Clean up old storage
      }
    }
  }

  getTokens(): AuthTokens | null {
    // Try to get from our custom storage first
    const stored = localStorage.getItem('authTokens');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to package's localStorage service
        const accessToken = localStorageService.getAccessToken();
        return accessToken ? { accessToken, userId: '' } : null;
      }
    }
    
    // Fall back to package's localStorage service
    const accessToken = localStorageService.getAccessToken();
    return accessToken ? { accessToken, userId: '' } : null;
  }

  async isAuthenticated(): Promise<boolean> {
    // Check if we have tokens in either storage
    const accessToken = localStorageService.getAccessToken();
    const customTokens = this.getTokens();
    
    return !!(accessToken || customTokens?.accessToken);
  }

  async logout(): Promise<void> {
    // Clear both storages
    localStorage.removeItem('authTokens');
    localStorage.removeItem('deviceUuid'); // Clean up legacy storage
    localStorageService.clearAuthData();
  }
}

export const authService = new AuthService(); 