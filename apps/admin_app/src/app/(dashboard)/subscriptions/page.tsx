'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { Card, Tabs, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionPlansTab } from './_components/subscription-plans-tab';
import { UserSubscriptionsTab } from './_components/user-subscriptions-tab';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function SubscriptionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: 24 }}>
        <Card title="Subscription Management">
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
  const [activeTab, setActiveTab] = useState('plans');

  const tabItems = [
    {
      key: 'plans',
      label: 'Subscription Plans',
      children: <SubscriptionPlansTab />,
    },
    {
      key: 'subscriptions',
      label: 'User Subscriptions',
      children: <UserSubscriptionsTab />,
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={tabItems}
      size="large"
    />
  );
} 