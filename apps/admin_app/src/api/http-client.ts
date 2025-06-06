import localStorageService from "@/service/localStorage.service";
import { RefreshTokenDto, RefreshTokenResponse } from "server/src/module/auth/handler/refreahToken";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: any) => any | Promise<any>;

interface RequestConfig extends RequestInit {
    baseURL?: string;
    url?: string;
    params?: Record<string, string>;
    data?: any;
}

export class HttpClient {
    private baseURL: string;
    private defaultHeaders: HeadersInit;
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];
    private errorInterceptors: ErrorInterceptor[] = [];

    constructor(config: { baseURL?: string; headers?: HeadersInit } = {}) {
        this.baseURL = config.baseURL || '';
        this.defaultHeaders = config.headers || {};
    }

    addRequestInterceptor(interceptor: RequestInterceptor): () => void {
        this.requestInterceptors.push(interceptor);
        return () => {
            const index = this.requestInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.requestInterceptors.splice(index, 1);
            }
        };
    }

    addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
        this.responseInterceptors.push(interceptor);
        return () => {
            const index = this.responseInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.responseInterceptors.splice(index, 1);
            }
        };
    }

    addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
        this.errorInterceptors.push(interceptor);
        return () => {
            const index = this.errorInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.errorInterceptors.splice(index, 1);
            }
        };
    }

    private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
        let modifiedConfig = { ...config };

        for (const interceptor of this.requestInterceptors) {
            modifiedConfig = await interceptor(modifiedConfig);
        }

        return modifiedConfig;
    }

    private async applyResponseInterceptors(response: Response): Promise<Response> {
        let modifiedResponse = response;

        for (const interceptor of this.responseInterceptors) {
            modifiedResponse = await interceptor(modifiedResponse);
        }

        return modifiedResponse;
    }

    private async applyErrorInterceptors(error: any): Promise<any> {
        let modifiedError = error;

        for (const interceptor of this.errorInterceptors) {
            modifiedError = await interceptor(modifiedError);
        }

        return modifiedError;
    }

    private buildUrl(url: string, baseURL: string | undefined, params?: Record<string, string>): string {
        const fullURL = baseURL ? `${baseURL}${url.startsWith('/') ? url : `/${url}`}` : url;

        if (!params) return fullURL;

        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        }

        const queryString = queryParams.toString();
        if (!queryString) return fullURL;

        return `${fullURL}${fullURL.includes('?') ? '&' : '?'}${queryString}`;
    }

    private async request<T>(method: HttpMethod, url: string, config: RequestConfig = {}): Promise<T> {
        let requestConfig: RequestConfig = {
            ...config,
            method,
            url,
            baseURL: config.baseURL || this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                ...this.defaultHeaders,
                ...config.headers,
            },
        };

        try {
            // Apply request interceptors
            requestConfig = await this.applyRequestInterceptors(requestConfig);

            const { baseURL, params, data, ...fetchOptions } = requestConfig;
            const fullUrl = this.buildUrl(url, baseURL, params);

            // Handle request body
            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                fetchOptions.body = JSON.stringify(data);
            }

            // Make the request
            const response = await fetch(fullUrl, fetchOptions);

            // Apply response interceptors
            const interceptedResponse = await this.applyResponseInterceptors(response);

            // Check if the response is ok
            if (!interceptedResponse.ok) {
                const error = new Error(`HTTP error! Status: ${interceptedResponse.status}`);
                (error as any).status = interceptedResponse.status;
                (error as any).config = requestConfig;
                throw error;
            }

            // Parse response based on content type
            const contentType = interceptedResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await interceptedResponse.json();
            } else {
                return await interceptedResponse.text() as unknown as T;
            }
        } catch (error) {
            // Ensure error has config
            if (error instanceof Error && !(error as any).config) {
                (error as any).config = requestConfig;
            }
            // Apply error interceptors
            const interceptedError = await this.applyErrorInterceptors(error);
            throw interceptedError;
        }
    }

    get<T>(url: string, config: RequestConfig = {}): Promise<T> {
        return this.request<T>('GET', url, config);
    }

    post<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
        return this.request<T>('POST', url, { ...config, data });
    }

    put<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
        return this.request<T>('PUT', url, { ...config, data });
    }

    patch<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
        return this.request<T>('PATCH', url, { ...config, data });
    }

    delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
        return this.request<T>('DELETE', url, config);
    }
}

export const createHttpClient = (config?: { baseURL?: string; headers?: HeadersInit }): HttpClient => {
    return new HttpClient(config);
};

// Create a special instance for auth to avoid circular dependency issues
const refreshClient = new HttpClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
// Store pending requests to retry after token refresh
let pendingRequests: Array<() => void> = [];

// Function to process pending requests
const processPendingRequests = () => {
    pendingRequests.forEach(callback => callback());
    pendingRequests = [];
};

const httpClient = createHttpClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Accept': 'application/json',
    }
});

httpClient.addRequestInterceptor((config) => {
    const token = localStorageService.getAccessToken();
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return config;
});

httpClient.addResponseInterceptor((response) => {
    console.log(`Response from ${response.url}:`, response.status);
    return response;
});

httpClient.addErrorInterceptor(async (error) => {
    // Check if the response is a 401 error
    const isUnauthorized = error?.status === 401 || 
        (error instanceof Error && error.message.includes('401'));
    
    const originalRequest = (error as any).config;
    
    if (isUnauthorized && originalRequest && !originalRequest._retry && !isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
            // Get device UUID from storage
            const device_uuid = localStorageService.getDeviceUuid();
            
            if (!device_uuid) {
                throw new Error('No device UUID available');
            }
            
            // Call refresh token endpoint
            const response = await refreshClient.post<RefreshTokenResponse>('/auth/refreshToken', {
                deviceUuid: device_uuid
            });
            
            if (response?.accessToken) {
                // Update tokens in storage
                localStorageService.setAccessToken(response.accessToken);
                
                // Update auth header for original request
                originalRequest.headers = {
                    ...originalRequest.headers,
                    'Authorization': `Bearer ${response.accessToken}`
                };
                
                // Process any pending requests
                processPendingRequests();
                
                // Retry the original request
                const { url, method, data } = originalRequest;
                switch (method?.toUpperCase()) {
                    case 'GET':
                        return httpClient.get(url, originalRequest);
                    case 'POST':
                        return httpClient.post(url, data, originalRequest);
                    case 'PUT':
                        return httpClient.put(url, data, originalRequest);
                    case 'PATCH':
                        return httpClient.patch(url, data, originalRequest);
                    case 'DELETE':
                        return httpClient.delete(url, originalRequest);
                    default:
                        throw new Error(`Unsupported method: ${method}`);
                }
            }
            throw new Error('Failed to refresh token');
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear tokens and redirect to login
            localStorageService.clearAuthData();
            window.location.href = '/login';
            throw refreshError;
        } finally {
            isRefreshing = false;
        }
    }
    
    // If we get here, either:
    // 1. It's not a 401 error
    // 2. Token refresh failed
    // 3. We're already refreshing
    // In all cases, throw the original error
    throw error;
});

export default httpClient;