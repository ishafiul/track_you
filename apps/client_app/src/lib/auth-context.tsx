import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type AuthTokens } from './auth';

interface AuthContextType {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  login: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing tokens on mount
    const existingTokens = authService.getTokens();
    if (existingTokens) {
      setTokens(existingTokens);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (newTokens: AuthTokens) => {
    authService.setTokens(newTokens);
    setTokens(newTokens);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setTokens(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        tokens,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 