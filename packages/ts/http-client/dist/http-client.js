import { localStorageService } from "./localStorage.service";
export class HttpClient {
    constructor(config = {}) {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
        this.baseURL = config.baseURL || '';
        this.defaultHeaders = config.headers || {};
    }
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
        return () => {
            const index = this.requestInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.requestInterceptors.splice(index, 1);
            }
        };
    }
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
        return () => {
            const index = this.responseInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.responseInterceptors.splice(index, 1);
            }
        };
    }
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
        return () => {
            const index = this.errorInterceptors.indexOf(interceptor);
            if (index !== -1) {
                this.errorInterceptors.splice(index, 1);
            }
        };
    }
    async applyRequestInterceptors(config) {
        let modifiedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            modifiedConfig = await interceptor(modifiedConfig);
        }
        return modifiedConfig;
    }
    async applyResponseInterceptors(response) {
        let modifiedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            modifiedResponse = await interceptor(modifiedResponse);
        }
        return modifiedResponse;
    }
    async applyErrorInterceptors(error) {
        let modifiedError = error;
        for (const interceptor of this.errorInterceptors) {
            modifiedError = await interceptor(modifiedError);
        }
        return modifiedError;
    }
    buildUrl(url, baseURL, params) {
        const fullURL = baseURL ? `${baseURL}${url.startsWith('/') ? url : `/${url}`}` : url;
        if (!params)
            return fullURL;
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        }
        const queryString = queryParams.toString();
        if (!queryString)
            return fullURL;
        return `${fullURL}${fullURL.includes('?') ? '&' : '?'}${queryString}`;
    }
    async request(method, url, config = {}) {
        let requestConfig = {
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
                error.status = interceptedResponse.status;
                error.config = requestConfig;
                throw error;
            }
            // Parse response based on content type
            const contentType = interceptedResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await interceptedResponse.json();
            }
            else {
                return await interceptedResponse.text();
            }
        }
        catch (error) {
            // Ensure error has config
            if (error instanceof Error && !error.config) {
                error.config = requestConfig;
            }
            // Apply error interceptors
            const interceptedError = await this.applyErrorInterceptors(error);
            throw interceptedError;
        }
    }
    get(url, config = {}) {
        return this.request('GET', url, config);
    }
    post(url, data, config = {}) {
        return this.request('POST', url, { ...config, data });
    }
    put(url, data, config = {}) {
        return this.request('PUT', url, { ...config, data });
    }
    patch(url, data, config = {}) {
        return this.request('PATCH', url, { ...config, data });
    }
    delete(url, config = {}) {
        return this.request('DELETE', url, config);
    }
}
export const createHttpClient = (config) => {
    return new HttpClient(config);
};
// Factory function to create an authenticated HTTP client
export const createAuthenticatedHttpClient = (config) => {
    const { baseURL, headers = {}, enableAuth = true, refreshTokenEndpoint = '/auth/refreshToken', onAuthFailure } = config;
    // Create a special instance for auth to avoid circular dependency issues
    const refreshClient = new HttpClient({
        baseURL,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
    // Flag to prevent infinite refresh loops
    let isRefreshing = false;
    // Store pending requests to retry after token refresh
    let pendingRequests = [];
    // Function to process pending requests
    const processPendingRequests = () => {
        pendingRequests.forEach(callback => callback());
        pendingRequests = [];
    };
    const httpClient = createHttpClient({
        baseURL,
        headers: {
            'Accept': 'application/json',
            ...headers
        }
    });
    if (enableAuth) {
        // Add auth header interceptor
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
        // Add response logging interceptor
        httpClient.addResponseInterceptor((response) => {
            console.log(`Response from ${response.url}:`, response.status);
            return response;
        });
        // Add error handling interceptor for token refresh
        httpClient.addErrorInterceptor(async (error) => {
            // Check if the response is a 401 error
            const isUnauthorized = error?.status === 401 ||
                (error instanceof Error && error.message.includes('401'));
            const originalRequest = error.config;
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
                    const response = await refreshClient.post(refreshTokenEndpoint, {
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
                }
                catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    // Clear tokens and handle auth failure
                    localStorageService.clearAuthData();
                    if (onAuthFailure) {
                        onAuthFailure();
                    }
                    else if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw refreshError;
                }
                finally {
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
    }
    return httpClient;
};
