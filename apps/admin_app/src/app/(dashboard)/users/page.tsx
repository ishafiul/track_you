'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { Card, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type { UserWithPermissions } from '@/api/user';
import { UserList } from './_components/user-list';
import { UpdatePermissionDialog } from './_components/update-permission-dialog';



// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function UsersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: 24 }}>
        <Card title="User Management">
          <Suspense fallback={<Spin size="large" />}>
            <ClientSideContent />
          </Suspense>
        </Card>
      </div>
    </QueryClientProvider>
  );
}

// Separate client-side content to avoid hydration issues
function ClientSideContent() {
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  return (
    <>
      <UserList 
        onUpdatePermission={(user) => {
          setSelectedUser(user);
          setIsUpdateDialogOpen(true);
        }}
      />
      <UpdatePermissionDialog
        user={selectedUser}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />
    </>
  );
} 