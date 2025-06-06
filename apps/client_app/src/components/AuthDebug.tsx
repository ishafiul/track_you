import { useEffect, useState } from 'react';
import authClient from '../lib/auth-client';

export default function AuthDebug() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true);
        // Get cookies
        const cookieObj = document.cookie
          .split(';')
          .map(cookie => cookie.trim().split('='))
          .reduce((acc: Record<string, string>, [key, value]) => {
            if (key && value) acc[key] = decodeURIComponent(value);
            return acc;
          }, {});
        setCookies(cookieObj);
        
        // Get session
        const response = await authClient.getSession();
        console.log("[AuthDebug] Session response:", response);
        setSessionData(response);
        setLoading(false);
      } catch (err: any) {
        console.error("[AuthDebug] Error:", err);
        setError(err.message || 'Error fetching session');
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Loading session data...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>;
  }

  const isAuthenticated = sessionData?.data?.user != null;

  return (
    <div className="p-4 bg-gray-100 rounded my-4">
      <h3 className="text-lg font-medium mb-2">Auth Debug Info</h3>
      
      <div className="mb-4">
        <div className="font-medium text-sm mb-1">Authentication Status:</div>
        <div className={`text-sm p-2 rounded ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isAuthenticated ? 'Authenticated ✓' : 'Not Authenticated ✗'}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-medium text-sm mb-1">Cookies Found:</div>
        <div className="bg-white p-3 rounded shadow-sm">
          <pre className="text-xs overflow-auto max-h-32">
            {Object.keys(cookies).length > 0 
              ? JSON.stringify(cookies, null, 2) 
              : "No cookies found"}
          </pre>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-medium text-sm mb-1">Session Response:</div>
        <div className="bg-white p-3 rounded shadow-sm">
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-3 flex gap-3">
        <button
          onClick={async () => {
            try {
              await authClient.signOut();
              window.location.reload();
            } catch (err) {
              console.error("Logout failed", err);
            }
          }}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Sign Out
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 