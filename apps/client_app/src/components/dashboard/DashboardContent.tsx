import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { httpClient } from '@/lib/http-client';

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

  const fetchUserSubscription = async () => {
    if (!tokens?.userId) return;
    
    setSubscriptionLoading(true);
    try {
      // Fetch subscription details
      const subscriptionData = await httpClient.get<{subscription: Subscription, plan: Plan}>(`/user-subscriptions/active/${tokens.userId}`);
      setSubscription(subscriptionData.subscription);
      setPlan(subscriptionData.plan);

      // Fetch access status
      const accessData = await httpClient.get<UserAccess>(`/user-subscriptions/access/${tokens.userId}`);
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
      const data = await httpClient.get<{plans: SubscriptionPlan[]}>('/subscription-plans/active-with-pricing');
      // Filter out free plans for upgrade/downgrade options
      const paidPlans = data.plans.filter((p: SubscriptionPlan) => 
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
      const data = await httpClient.post<{success: boolean, paymentLink?: string, error?: string}>('/subscription-plans/payment-link', {
        planId: newPlanId,
        billingCycle,
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
      });

      if (data.success && data.paymentLink) {
        //window.location.href = data.paymentLink;
      } else {
        alert('Failed to create upgrade link: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating upgrade link:', error);
      alert('Failed to create upgrade link');
    } finally {
      setUpgradeLoading(false);
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
    const upgrades = availablePlans.filter(p => getPlanTier(p.name) > currentTier);
    const downgrades = availablePlans.filter(p => getPlanTier(p.name) < currentTier && getPlanTier(p.name) > 0);
    
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
        {/* Status Banner */}
        {userAccess && !userAccess.hasAccess && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
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
                      <label className="text-sm font-medium text-muted-foreground">Plan Name</label>
                      <p className="font-medium">{plan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">API Rate Limit</label>
                      <p className="text-sm">{plan.apiRateLimit} requests/minute</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Monthly Requests</label>
                      <p className="text-sm">{plan.maxRequestsPerMonth.toLocaleString()} requests</p>
                    </div>
                  </div>
                  
                  {subscription && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-sm capitalize">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Plan Change Options */}
                  {!plansLoading && availablePlans.length > 0 && (() => {
                    const { upgrades, downgrades } = getUpgradeDowngradeOptions();
                    return (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Plan Options</h4>
                        
                        {upgrades.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-2">Upgrade to:</p>
                            <div className="flex flex-wrap gap-2">
                              {upgrades.map((upgradePlan) => {
                                const monthlyPricing = upgradePlan.pricing.find(p => p.billingCycle === 'monthly');
                                const yearlyPricing = upgradePlan.pricing.find(p => p.billingCycle === 'yearly');
                                return (
                                  <div key={upgradePlan.id} className="flex gap-1">
                                    {monthlyPricing && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={upgradeLoading}
                                        onClick={() => handlePlanChange(upgradePlan.id, 'monthly')}
                                        className="text-xs h-7"
                                      >
                                        {upgradePlan.name} ({formatPrice(monthlyPricing.price)}/mo)
                                      </Button>
                                    )}
                                    {yearlyPricing && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={upgradeLoading}
                                        onClick={() => handlePlanChange(upgradePlan.id, 'yearly')}
                                        className="text-xs h-7"
                                      >
                                        {upgradePlan.name} ({formatPrice(yearlyPricing.price)}/yr)
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
                            <p className="text-xs text-muted-foreground mb-2">Downgrade to:</p>
                            <div className="flex flex-wrap gap-2">
                              {downgrades.map((downgradePlan) => {
                                const monthlyPricing = downgradePlan.pricing.find(p => p.billingCycle === 'monthly');
                                const yearlyPricing = downgradePlan.pricing.find(p => p.billingCycle === 'yearly');
                                return (
                                  <div key={downgradePlan.id} className="flex gap-1">
                                    {monthlyPricing && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={upgradeLoading}
                                        onClick={() => handlePlanChange(downgradePlan.id, 'monthly')}
                                        className="text-xs h-7"
                                      >
                                        {downgradePlan.name} ({formatPrice(monthlyPricing.price)}/mo)
                                      </Button>
                                    )}
                                    {yearlyPricing && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={upgradeLoading}
                                        onClick={() => handlePlanChange(downgradePlan.id, 'yearly')}
                                        className="text-xs h-7"
                                      >
                                        {downgradePlan.name} ({formatPrice(yearlyPricing.price)}/yr)
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {upgrades.length === 0 && downgrades.length === 0 && (
                          <p className="text-xs text-muted-foreground">No other plans available</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">No active subscription</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/pricing'}
                  >
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
              This is your central hub for managing your location tracking SDK integration. 
              Here you can monitor API usage, manage settings, and access documentation.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 