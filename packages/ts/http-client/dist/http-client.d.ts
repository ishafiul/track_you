type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: any) => any | Promise<any>;
interface RequestConfig extends RequestInit {
    baseURL?: string;
    url?: string;
    params?: Record<string, string>;
    data?: any;
}
export interface RefreshTokenDto {
    deviceUuid: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
}
export interface HttpClientConfig {
    baseURL?: string;
    headers?: HeadersInit;
    enableAuth?: boolean;
    refreshTokenEndpoint?: string;
    onAuthFailure?: () => void;
}
export declare class HttpClient {
    private baseURL;
    private defaultHeaders;
    private requestInterceptors;
    private responseInterceptors;
    private errorInterceptors;
    constructor(config?: {
        baseURL?: string;
        headers?: HeadersInit;
    });
    addRequestInterceptor(interceptor: RequestInterceptor): () => void;
    addResponseInterceptor(interceptor: ResponseInterceptor): () => void;
    addErrorInterceptor(interceptor: ErrorInterceptor): () => void;
    private applyRequestInterceptors;
    private applyResponseInterceptors;
    private applyErrorInterceptors;
    private buildUrl;
    private request;
    get<T>(url: string, config?: RequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
    patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
    delete<T>(url: string, config?: RequestConfig): Promise<T>;
}
export declare const createHttpClient: (config?: {
    baseURL?: string;
    headers?: HeadersInit;
}) => HttpClient;
export declare const createAuthenticatedHttpClient: (config: HttpClientConfig) => HttpClient;
export {};
