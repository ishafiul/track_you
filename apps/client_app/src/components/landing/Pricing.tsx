import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';

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

export function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetchPlans();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';
      console.log('Fetching from API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/subscription-plans/active-with-pricing`);
      if (response.ok) {
        const data = await response.json();
        // Filter out free plans from pricing display
        const paidPlans = data.plans.filter((plan: SubscriptionPlan) => 
          !plan.name.toLowerCase().includes('free') && 
          plan.pricing.some((p: PlanPricing) => p.price > 0)
        );
        setPlans(paidPlans);
      } else {
        setError(`Failed to fetch pricing plans: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setError('Failed to fetch pricing plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string, cycle: 'monthly' | 'yearly') => {
    setIsCheckingAuth(true);
    
    try {
      // Check if user is authenticated first
      const authenticated = await authService.isAuthenticated();
      
      if (!authenticated) {
        // Redirect to login page
        window.location.href = '/login';
        return;
      }

      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';
      
      const response = await fetch(`${apiUrl}/subscription-plans/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.paymentLink) {
          window.location.href = data.paymentLink;
        } else {
          alert('Failed to create payment link: ' + (data.error || 'Unknown error'));
        }
      } else {
        alert('Failed to create payment link');
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to create payment link');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(0)}`;
  };

  const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  const parseFeatures = (featuresJson: string) => {
    try {
      const parsed = JSON.parse(featuresJson);
      return parsed.features || [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <section id="pricing" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="pricing" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchPlans} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pricing Plans
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the right plan for your needs. Start with our free plan or upgrade for more features.
            </p>
          </div>
          
          {/* Billing cycle toggle */}
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1 border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save up to 20%
              </Badge>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const monthlyPricing = plan.pricing.find(p => p.billingCycle === 'monthly');
            const yearlyPricing = plan.pricing.find(p => p.billingCycle === 'yearly');
            const currentPricing = billingCycle === 'monthly' ? monthlyPricing : yearlyPricing;
            const features = parseFeatures(plan.featuresJson);
            
            // Calculate savings for yearly plans
            const savings = monthlyPricing && yearlyPricing ? 
              getYearlySavings(monthlyPricing.price, yearlyPricing.price) : null;
            
            // Determine if this is the popular plan (middle plan or has most features)
            const isPopular = index === Math.floor(plans.length / 2);

            if (!currentPricing) return null;

            return (
              <Card key={plan.id} className={`flex flex-col ${isPopular ? 'border-primary shadow-md' : 'border-border/50'}`}>
                <CardHeader>
                  {isPopular && (
                    <Badge variant="outline" className="w-fit mb-2 border-primary/20 bg-primary/10 text-primary">
                      Popular
                    </Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description || `Up to ${plan.maxRequestsPerMonth.toLocaleString()} requests/month`}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{formatPrice(currentPricing.price)}</span>
                    <span className="text-muted-foreground ml-1">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                    {billingCycle === 'yearly' && savings && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Save {savings.percentage}%
                      </Badge>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && monthlyPricing && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {formatPrice(monthlyPricing.price)}/mo billed annually
                    </p>
                  )}
                  
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-sm">{plan.maxRequestsPerMonth.toLocaleString()} API requests/month</span>
                    </li>
                    <li className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-sm">{plan.apiRateLimit} requests/minute</span>
                    </li>
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${isPopular ? '' : 'variant-outline'}`}
                    onClick={() => handlePurchase(plan.id, billingCycle)}
                    disabled={isCheckingAuth}
                  >
                    {isCheckingAuth ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Loading...</span>
                      </div>
                    ) : isAuthenticated === false ? (
                      'Login to Subscribe'
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include full API access and documentation. Need a custom plan?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
} 