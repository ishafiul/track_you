import { CreateDeviceUuidApiDto, CreateDeviceUuidApiEntity } from 'server/src/module/auth/handler/createDeviceUuid';
import { RequestOtpDto } from 'auth-worker/src/dto/request-otp.dto';
import { VerifyOtpDto } from 'auth-worker/src/dto/verify-otp.dto';
import { VerifyOtpResponse } from 'server/src/module/auth/handler/verifyotp';
import { LogoutResponse } from 'server/src/module/auth/handler/logout';
import httpClient from './http-client';

/**
 * Gets device information for device UUID creation
 */
const getDeviceInfo = (): CreateDeviceUuidApiDto => {
    const userAgent = navigator.userAgent;
    const browserInfo = getBrowserInfo(userAgent);
    const osInfo = getOsInfo(userAgent);
    
    return {
        deviceType: detectDeviceType(),
        osName: osInfo.name,
        osVersion: osInfo.version,
        deviceModel: browserInfo.name + ' ' + browserInfo.version,
        isPhysicalDevice: 'true',
        appVersion: '1.0.0',
        fcmToken: null
    };
};

/**
 * Detects browser information from user agent
 */
const getBrowserInfo = (userAgent: string): { name: string; version: string } => {
    // Default values
    let name = 'Unknown';
    let version = 'Unknown';
    
    // Chrome
    if (/chrome|chromium|crios/i.test(userAgent)) {
        name = 'Chrome';
        version = userAgent.match(/(chrome|chromium|crios)\/(\d+(\.\d+)?)/i)?.[2] || 'Unknown';
    } 
    // Firefox
    else if (/firefox|fxios/i.test(userAgent)) {
        name = 'Firefox';
        version = userAgent.match(/(firefox|fxios)\/(\d+(\.\d+)?)/i)?.[2] || 'Unknown';
    }
    // Safari
    else if (/safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent)) {
        name = 'Safari';
        version = userAgent.match(/version\/(\d+(\.\d+)?)/i)?.[1] || 'Unknown';
    }
    // Edge
    else if (/edg/i.test(userAgent)) {
        name = 'Edge';
        version = userAgent.match(/edg\/(\d+(\.\d+)?)/i)?.[1] || 'Unknown';
    }
    
    return { name, version };
};

/**
 * Detects OS information from user agent
 */
const getOsInfo = (userAgent: string): { name: string; version: string } => {
    // Default values
    let name = 'Unknown';
    let version = 'Unknown';
    
    // Windows
    if (/windows/i.test(userAgent)) {
        name = 'Windows';
        version = userAgent.match(/windows nt (\d+\.\d+)/i)?.[1] || 'Unknown';
        if (version === '10.0') version = '10';
        else if (version === '6.3') version = '8.1';
        else if (version === '6.2') version = '8';
        else if (version === '6.1') version = '7';
    } 
    // macOS
    else if (/macintosh|mac os x/i.test(userAgent)) {
        name = 'macOS';
        version = userAgent.match(/mac os x (\d+[._]\d+[._\d]*)/i)?.[1]?.replace(/_/g, '.') || 'Unknown';
    }
    // iOS
    else if (/iphone|ipad|ipod/i.test(userAgent)) {
        name = 'iOS';
        version = userAgent.match(/os (\d+[._]\d+[._\d]*)/i)?.[1]?.replace(/_/g, '.') || 'Unknown';
    }
    // Android
    else if (/android/i.test(userAgent)) {
        name = 'Android';
        version = userAgent.match(/android (\d+(\.\d+)*)/i)?.[1] || 'Unknown';
    }
    // Linux
    else if (/linux/i.test(userAgent)) {
        name = 'Linux';
        version = 'Unknown';
    }
    
    return { name, version };
};

/**
 * Detects device type based on user agent and screen size
 */
const detectDeviceType = (): string => {
    const userAgent = navigator.userAgent;
    
    // Mobile detection
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        return /ipad/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    // Tablet detection based on screen size
    if (window.innerWidth <= 1024 && window.innerWidth > 767) {
        return 'tablet';
    }
    
    return 'desktop';
};

export const authApi = {
    createDeviceUuid: async (): Promise<CreateDeviceUuidApiEntity> => {
        const deviceInfo = getDeviceInfo();
        const response = await httpClient.post<CreateDeviceUuidApiEntity>(`/auth/createDeviceUuid`, deviceInfo);
        if (!response.deviceUuid) {
            throw new Error('Failed to create device UUID');
        }
        return response;
    },

    requestOtp: async (request: RequestOtpDto): Promise<{ message: string }> => {
        const response = await httpClient.post<{ message: string }>(`/auth/reqOtp`, request);

        if (!response.message) {
            throw new Error('Failed to request OTP');
        }

        return response;
    },

    verifyOtp: async (request: VerifyOtpDto): Promise<VerifyOtpResponse> => {
        const response = await httpClient.post<VerifyOtpResponse>(`/auth/verifyOtp`, request);

        if (!response) {
            throw new Error('Failed to verify OTP');
        }

        return response;
    },

    logout: async (): Promise<LogoutResponse> => {
        const response = await httpClient.delete<LogoutResponse>(`/auth/logout`);

        if (!response) {
            throw new Error('Failed to logout');
        }

        return response;
    },
}; 