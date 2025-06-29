export interface AuthTokens {
  accessToken: string;
  userId: string;
}

export interface LoginRequest {
  email: string;
  deviceUuid: string;
}

export interface VerifyOtpRequest {
  email: string;
  deviceUuid: string;
  otp: number;
}

export interface CreateDeviceUuidRequest {
  userAgent?: string;
  platform?: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface CreateDeviceUuidResponse {
  deviceUuid: string;
}

export class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async requestOtp(data: LoginRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/reqOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request OTP');
    }

    return response.json();
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/verifyOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify OTP');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const tokens = this.getTokens();
    if (!tokens) return;

    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async createDeviceUuid(data?: CreateDeviceUuidRequest): Promise<CreateDeviceUuidResponse> {
    const deviceData = data || this.getDeviceInfo();
    
    const response = await fetch(`${this.baseUrl}/auth/createDeviceUuid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create device UUID');
    }

    return response.json();
  }

  getDeviceInfo(): CreateDeviceUuidRequest {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceModel: this.getDeviceModel(),
      osVersion: this.getOSVersion(),
    };
  }

  getDeviceModel(): string {
    const userAgent = navigator.userAgent;
    
    // Mobile device detection
    if (/iPhone/.test(userAgent)) {
      const match = userAgent.match(/iPhone OS (\d+_\d+)/);
      return match ? `iPhone (iOS ${match[1].replace('_', '.')})` : 'iPhone';
    }
    
    if (/iPad/.test(userAgent)) {
      return 'iPad';
    }
    
    if (/Android/.test(userAgent)) {
      const match = userAgent.match(/Android (\d+\.\d+)/);
      return match ? `Android ${match[1]}` : 'Android';
    }
    
    // Desktop detection
    if (/Mac/.test(userAgent)) {
      return 'Mac';
    }
    
    if (/Windows/.test(userAgent)) {
      return 'Windows';
    }
    
    if (/Linux/.test(userAgent)) {
      return 'Linux';
    }
    
    return 'Unknown';
  }

  getOSVersion(): string {
    const userAgent = navigator.userAgent;
    
    // iOS
    const iosMatch = userAgent.match(/OS (\d+_\d+)/);
    if (iosMatch) {
      return iosMatch[1].replace('_', '.');
    }
    
    // Android
    const androidMatch = userAgent.match(/Android (\d+\.\d+)/);
    if (androidMatch) {
      return androidMatch[1];
    }
    
    // Windows
    const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (windowsMatch) {
      return windowsMatch[1];
    }
    
    // macOS
    const macMatch = userAgent.match(/Mac OS X (\d+_\d+)/);
    if (macMatch) {
      return macMatch[1].replace('_', '.');
    }
    
    return 'Unknown';
  }



  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
  }

  getTokens(): AuthTokens | null {
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  clearTokens(): void {
    localStorage.removeItem('authTokens');
  }

  isAuthenticated(): boolean {
    return !!this.getTokens();
  }
}

// Create singleton instance
export const authService = new AuthService(import.meta.env.PUBLIC_API_URL || 'http://localhost:8787'); 