import React from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { DashboardContent } from './DashboardContent';

export function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
} 