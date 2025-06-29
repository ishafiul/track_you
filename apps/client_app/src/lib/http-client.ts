import { createAuthenticatedHttpClient } from 'http-client-local';

const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

export const httpClient = createAuthenticatedHttpClient({
  baseURL: apiUrl,
  enableAuth: true,
  refreshTokenEndpoint: '/auth/refreshToken',
  onAuthFailure: () => {
    // Clear all auth data and redirect to login
    localStorage.removeItem('authTokens');
    localStorage.removeItem('deviceUuid'); // Clean up legacy storage
    window.location.href = '/login';
  }
});

export default httpClient; 