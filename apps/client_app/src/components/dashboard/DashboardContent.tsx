import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { httpClient } from '@/lib/http-client';
import { ApiKeyManagement } from './ApiKeyManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  featuresJson: string;
  apiRateLimit: number;
  maxRequestsPerMonth: number;
  active: boolean;
}

interface UserAccess {
  success: boolean;
  hasAccess: boolean;
  accessLevel?: 'full' | 'limited' | 'none';
  reason?: string;
  subscription?: Subscription;
  plan?: Plan;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  featuresJson: string;
  apiRateLimit: number;
  maxRequestsPerMonth: number;
  active: boolean;
  stripeProductId: string | null;
  createdAt: string;
  updatedAt: string;
  pricing: PlanPricing[];
}

interface PlanPricing {
  id: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  stripePriceId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function DashboardContent() {
  const { isAuthenticated, tokens, logout, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (tokens?.userId) {
      fetchUserSubscription();
      fetchAvailablePlans();
    }
  }, [tokens?.userId]);

  // Check for payment status in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const upgrade = urlParams.get('upgrade');

    if (payment === 'success') {
      setPaymentMessage({
        type: 'success',
        text: 'Payment successful! Your subscription is now active.',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
      // Refresh subscription data
      if (tokens?.userId) {
        fetchUserSubscription();
      }
    } else if (payment === 'cancelled') {
      setPaymentMessage({
        type: 'error',
        text: 'Payment was cancelled. Please try again if you want to subscribe.',
      });
      window.history.replaceState({}, '', '/dashboard');
    }

    if (upgrade === 'success') {
      setPaymentMessage({
        type: 'success',
        text: 'Upgrade successful! Your subscription has been updated.',
      });
      window.history.replaceState({}, '', '/dashboard');
      if (tokens?.userId) {
        fetchUserSubscription();
      }
    } else if (upgrade === 'cancelled') {
      setPaymentMessage({ type: 'error', text: 'Upgrade was cancelled.' });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [tokens?.userId]);

  const fetchUserSubscription = async () => {
    if (!tokens?.userId) return;

    setSubscriptionLoading(true);
    try {
      // Fetch subscription details
      const subscriptionData = await httpClient.get<{ subscription: Subscription; plan: Plan }>(
        `/user-subscriptions/active/${tokens.userId}`
      );
      setSubscription(subscriptionData.subscription);
      setPlan(subscriptionData.plan);

      // Fetch access status
      const accessData = await httpClient.get<UserAccess>(
        `/user-subscriptions/access/${tokens.userId}`
      );
      setUserAccess(accessData);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    setPlansLoading(true);
    try {
      const data = await httpClient.get<{ plans: SubscriptionPlan[] }>(
        '/subscription-plans/active-with-pricing'
      );
      // Filter out free plans for upgrade/downgrade options
      const paidPlans = data.plans.filter(
        (p: SubscriptionPlan) =>
          !p.name.toLowerCase().includes('free') &&
          p.pricing.some((pricing: PlanPricing) => pricing.price > 0)
      );
      setAvailablePlans(paidPlans);
    } catch (error) {
      console.error('Failed to fetch available plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePlanChange = async (newPlanId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!tokens?.userId) return;

    setUpgradeLoading(true);
    try {
      // Use the new checkout session endpoint
      const data = await httpClient.post<{
        success: boolean;
        checkoutUrl?: string;
        error?: string;
      }>('/subscription-plans/checkout-session', {
        planId: newPlanId,
        billingCycle,
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
      });

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Failed to create checkout session: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCancelSubscription = async (cancelAtPeriodEnd: boolean = true) => {
    if (!subscription?.id) return;

    setCancelLoading(true);
    try {
      const data = await httpClient.patch<{
        success: boolean;
        subscription?: Subscription;
        message?: string;
        error?: string;
      }>(`/user-subscriptions/${subscription.id}/cancel`, {
        cancelAtPeriodEnd,
      });

      if (data.success) {
        setPaymentMessage({
          type: 'success',
          text: data.message || 'Subscription canceled successfully',
        });
        setShowCancelDialog(false);
        // Refresh subscription data
        await fetchUserSubscription();
      } else {
        setPaymentMessage({
          type: 'error',
          text: data.error || 'Failed to cancel subscription',
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setPaymentMessage({
        type: 'error',
        text: 'Failed to cancel subscription',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(0)}`;
  };

  const getPlanTier = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return 1;
    if (name.includes('advance')) return 2;
    if (name.includes('monstar') || name.includes('monster')) return 3;
    return 0;
  };

  const getUpgradeDowngradeOptions = () => {
    if (!plan || !availablePlans.length) return { upgrades: [], downgrades: [] };

    const currentTier = getPlanTier(plan.name);
    const upgrades = availablePlans.filter((p) => getPlanTier(p.name) > currentTier);

    // Don't show downgrades if user is on free plan, and don't include free plan in downgrades
    const downgrades =
      currentTier > 0
        ? availablePlans.filter(
            (p) =>
              getPlanTier(p.name) < currentTier &&
              getPlanTier(p.name) > 0 &&
              !p.name.toLowerCase().includes('free')
          )
        : [];

    return { upgrades, downgrades };
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">TrackYou Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back!</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'api-keys', name: 'API Keys', icon: '🔑' },
                { id: 'analytics', name: 'Analytics', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Payment Message */}
            {paymentMessage && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  paymentMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {paymentMessage.type === 'success' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-600"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{paymentMessage.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentMessage(null)}
                    className="text-current hover:bg-current/10"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            {/* Status Banner */}
            {userAccess && !userAccess.hasAccess && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-destructive"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <div>
                    <h3 className="font-medium text-destructive">Subscription Issue</h3>
                    <p className="text-sm text-destructive/80">{userAccess.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {userAccess && userAccess.hasAccess && userAccess.accessLevel === 'limited' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-600"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="m12 17 .01 0"></path>
                  </svg>
                  <div>
                    <h3 className="font-medium text-yellow-800">Limited Access</h3>
                    <p className="text-sm text-yellow-700">{userAccess.reason}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* User Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {tokens?.userId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Info Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details and plan options</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : plan ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Plan Name
                          </label>
                          <p className="font-medium">{plan.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            API Rate Limit
                          </label>
                          <p className="text-sm">{plan.apiRateLimit} requests/minute</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Monthly Requests
                          </label>
                          <p className="text-sm">
                            {plan.maxRequestsPerMonth.toLocaleString()} requests
                          </p>
                        </div>
                      </div>

                      {subscription && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Status
                          </label>
                          <p className="text-sm capitalize">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                subscription.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {subscription.status}
                            </span>
                            {subscription.cancelAtPeriodEnd && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Cancels at period end)
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Cancel Subscription Button - Only show for active paid subscriptions */}
                      {subscription &&
                        plan &&
                        subscription.status === 'active' &&
                        !subscription.cancelAtPeriodEnd &&
                        plan.name.toLowerCase() !== 'free' &&
                        subscription.planId !== 'free-plan' && (
                          <div className="border-t pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCancelDialog(true)}
                              className="text-destructive hover:text-destructive"
                            >
                              Cancel Subscription
                            </Button>
                          </div>
                        )}

                      {/* Plan Change Options */}
                      {!plansLoading &&
                        availablePlans.length > 0 &&
                        (() => {
                          const { upgrades, downgrades } = getUpgradeDowngradeOptions();
                          return (
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                Plan Options
                              </h4>

                              {upgrades.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground mb-2">Upgrade to:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {upgrades.map((upgradePlan) => {
                                      const monthlyPricing = upgradePlan.pricing.find(
                                        (p) => p.billingCycle === 'monthly'
                                      );
                                      const yearlyPricing = upgradePlan.pricing.find(
                                        (p) => p.billingCycle === 'yearly'
                                      );
                                      return (
                                        <div key={upgradePlan.id} className="flex gap-1">
                                          {monthlyPricing && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={upgradeLoading}
                                              onClick={() =>
                                                handlePlanChange(upgradePlan.id, 'monthly')
                                              }
                                              className="text-xs h-7"
                                            >
                                              {upgradePlan.name} (
                                              {formatPrice(monthlyPricing.price)}
                                              /mo)
                                            </Button>
                                          )}
                                          {yearlyPricing && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={upgradeLoading}
                                              onClick={() =>
                                                handlePlanChange(upgradePlan.id, 'yearly')
                                              }
                                              className="text-xs h-7"
                                            >
                                              {upgradePlan.name} ({formatPrice(yearlyPricing.price)}
                                              /yr)
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {downgrades.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Downgrade to:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {downgrades.map((downgradePlan) => {
                                      const monthlyPricing = downgradePlan.pricing.find(
                                        (p) => p.billingCycle === 'monthly'
                                      );
                                      const yearlyPricing = downgradePlan.pricing.find(
                                        (p) => p.billingCycle === 'yearly'
                                      );
                                      return (
                                        <div key={downgradePlan.id} className="flex gap-1">
                                          {monthlyPricing && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={upgradeLoading}
                                              onClick={() =>
                                                handlePlanChange(downgradePlan.id, 'monthly')
                                              }
                                              className="text-xs h-7"
                                            >
                                              {downgradePlan.name} (
                                              {formatPrice(monthlyPricing.price)}
                                              /mo)
                                            </Button>
                                          )}
                                          {yearlyPricing && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={upgradeLoading}
                                              onClick={() =>
                                                handlePlanChange(downgradePlan.id, 'yearly')
                                              }
                                              className="text-xs h-7"
                                            >
                                              {downgradePlan.name} (
                                              {formatPrice(yearlyPricing.price)}
                                              /yr)
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {upgrades.length === 0 && downgrades.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  No other plans available
                                </p>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No active subscription</p>
                      <Button variant="outline" onClick={() => (window.location.href = '/pricing')}>
                        View Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>Connection status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    View SDK Documentation
                  </Button>
                  <Button className="w-full" variant="outline">
                    API Keys
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Message */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Welcome to TrackYou Dashboard</CardTitle>
                <CardDescription>
                  Your sophisticated background location tracking SDK dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is your central hub for managing your location tracking SDK integration. Here
                  you can monitor API usage, manage settings, and access documentation.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && <ApiKeyManagement />}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You can choose when to cancel:
            </p>

            <div className="space-y-4">
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => handleCancelSubscription(true)}
                  disabled={cancelLoading}
                  variant="outline"
                  className="w-full"
                >
                  {cancelLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Cancel at Period End (Recommended)'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  You'll keep access until{' '}
                  {subscription?.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : 'the end of your billing period'}
                </p>

                <Button
                  onClick={() => handleCancelSubscription(false)}
                  disabled={cancelLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {cancelLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Cancel Immediately'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Your subscription will be canceled immediately and you'll lose access
                </p>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={() => setShowCancelDialog(false)}
                  disabled={cancelLoading}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
