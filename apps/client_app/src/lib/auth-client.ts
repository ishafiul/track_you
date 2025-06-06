import {emailOTPClient, adminClient} from "better-auth/client/plugins";
import {createAuthClient} from "better-auth/react"

// Create auth client to connect to your Hono server
const authClient = createAuthClient({
  baseURL: "http://localhost:8787",
  basePath: "/auth/api/auth",
  plugins: [emailOTPClient(), adminClient()],
  credentials: 'include',
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem("bearer_token") || ""
    }
  },
  callbacks: {
    onSuccess: (data: unknown) => {
      console.log('Auth success:', data);
    },
    onError: (error: Error) => {
      console.error('Auth error:', error);
    },
  },
});

// For debugging
if (typeof window !== 'undefined') {
  // @ts-ignore - Expose client for debugging
  window.authClient = authClient;
}

// Export the client directly
export default authClient;
