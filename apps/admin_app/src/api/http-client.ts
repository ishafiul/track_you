import { createAuthenticatedHttpClient } from 'http-client-local';

const httpClient = createAuthenticatedHttpClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    enableAuth: true,
    refreshTokenEndpoint: '/auth/refreshToken',
    onAuthFailure: () => {
        window.location.href = '/login';
    }
});

export default httpClient;