import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { localStorageService } from 'http-client-local';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    
useEffect(() => {
    const token = localStorageService.getAccessToken();
    const currentPath = window.location.pathname;
    if (!token && currentPath !== '/login') {
      window.location.href = '/login';
    }
    if (token && currentPath === '/login') {
      window.location.href = '/';
    }
  }, []);
  return <>{children}</>;
};

export default AuthGuard; 