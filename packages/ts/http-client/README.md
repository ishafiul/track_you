# HTTP Client Package

A reusable HTTP client package for the Track You workspace with built-in authentication, token refresh, and request/response interceptors.

## Features

- **TypeScript support** with full type definitions
- **Request/Response interceptors** for customization
- **Automatic token refresh** for authenticated requests
- **localStorage service** for token management
- **Configurable base URL and headers**
- **Error handling** with retry logic

## Usage

### Basic HTTP Client

```typescript
import { createHttpClient } from 'http-client-local';

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Custom-Header': 'value',
  },
});

// Make requests
const data = await client.get('/users');
const user = await client.post('/users', { name: 'John' });
```

### Authenticated HTTP Client

```typescript
import { createAuthenticatedHttpClient } from 'http-client-local';

const client = createAuthenticatedHttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  enableAuth: true,
  refreshTokenEndpoint: '/auth/refreshToken',
  onAuthFailure: () => {
    // Custom auth failure handling
    window.location.href = '/login';
  },
});

// Automatically includes Authorization header and handles token refresh
const data = await client.get('/protected-endpoint');
```

### LocalStorage Service

```typescript
import { localStorageService } from 'http-client-local';

// Token management
localStorageService.setAccessToken('your-token');
const token = localStorageService.getAccessToken();

// Device UUID management
localStorageService.setDeviceUuid('device-uuid');
const uuid = localStorageService.getDeviceUuid();

// Clear all auth data
localStorageService.clearAuthData();
```

## Configuration

### HttpClientConfig

```typescript
interface HttpClientConfig {
  baseURL?: string;
  headers?: HeadersInit;
  enableAuth?: boolean;
  refreshTokenEndpoint?: string;
  onAuthFailure?: () => void;
}
```

## Building

```bash
npm run build
```

## Development

```bash
npm run dev
```
