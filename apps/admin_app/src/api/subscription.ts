import httpClient from './http-client';

// Plan Pricing Types
export interface PlanPricing {
  id: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  stripePriceId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subscription Plan Types
export interface SubscriptionPlan {
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
  pricing?: PlanPricing[];
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  description?: string;
  featuresJson: string;
  apiRateLimit: number;
  maxRequestsPerMonth: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface UpdateSubscriptionPlanRequest {
  name?: string;
  description?: string;
  featuresJson?: string;
  apiRateLimit?: number;
  maxRequestsPerMonth?: number;
  active?: boolean;
}

export interface UpdatePlanPricingRequest {
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface CreatePaymentLinkRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

// User Subscription Types
export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  stripePaymentLinkId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InitiateSubscriptionRequest {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SubscriptionPlanResponse {
  success: boolean;
  plan?: SubscriptionPlan;
  pricing?: PlanPricing[];
  error?: string;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  plans: SubscriptionPlan[];
}

export interface PaymentLinkResponse {
  success: boolean;
  paymentLink?: string;
  error?: string;
}

export interface UserSubscriptionResponse {
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
}

export interface UserSubscriptionsResponse {
  success: boolean;
  subscriptions?: UserSubscription[];
  error?: string;
}

export interface InitiateSubscriptionResponse {
  success: boolean;
  subscription?: UserSubscription;
  checkoutUrl?: string;
  error?: string;
}

// Subscription Plans API
export const subscriptionPlansApi = {
  // Get all subscription plans
  getAll: (): Promise<SubscriptionPlansResponse> =>
    httpClient.get('/subscription-plans'),

  // Get active subscription plans
  getActive: (): Promise<SubscriptionPlansResponse> =>
    httpClient.get('/subscription-plans/active'),

  // Get subscription plan by ID
  getById: (id: string): Promise<SubscriptionPlanResponse> =>
    httpClient.get(`/subscription-plans/${id}`),

  // Create subscription plan with Stripe integration
  create: (data: CreateSubscriptionPlanRequest): Promise<SubscriptionPlanResponse> =>
    httpClient.post('/subscription-plans', data),

  // Update subscription plan
  update: (id: string, data: UpdateSubscriptionPlanRequest): Promise<SubscriptionPlanResponse> =>
    httpClient.put(`/subscription-plans/${id}`, data),

  // Update subscription plan pricing
  updatePricing: (id: string, data: UpdatePlanPricingRequest): Promise<SubscriptionPlanResponse> =>
    httpClient.put(`/subscription-plans/${id}/pricing`, data),

  // Deactivate subscription plan
  deactivate: (id: string): Promise<SubscriptionPlanResponse> =>
    httpClient.patch(`/subscription-plans/${id}/deactivate`),

  // Delete subscription plan
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    httpClient.delete(`/subscription-plans/${id}`),

  // Create payment link for plan
  createPaymentLink: (data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> =>
    httpClient.post('/subscription-plans/payment-link', data),
};

// User Subscriptions API
export const userSubscriptionsApi = {
  // Get all user subscriptions - temporary solution
  getAll: (): Promise<UserSubscription[]> => {
    // TODO: Implement proper endpoint for getting all subscriptions
    // For now, return empty array to prevent 404 errors
    return Promise.resolve([]);
  },

  // Get user subscription by ID
  getById: (id: string): Promise<UserSubscriptionResponse> =>
    httpClient.get(`/user-subscriptions/${id}`),

  // Get subscriptions by user ID
  getByUserId: (userId: string): Promise<UserSubscriptionsResponse> =>
    httpClient.get(`/user-subscriptions/user/${userId}`),

  // Get user's active subscription
  getActiveByUserId: (userId: string): Promise<UserSubscriptionResponse> =>
    httpClient.get(`/user-subscriptions/active/${userId}`),

  // Get subscriptions by plan ID
  getByPlanId: (planId: string): Promise<UserSubscriptionsResponse> =>
    httpClient.get(`/user-subscriptions/plan/${planId}`),

  // Get expiring subscriptions
  getExpiring: (beforeDate: string): Promise<UserSubscriptionsResponse> =>
    httpClient.get(`/user-subscriptions/expiring?beforeDate=${beforeDate}`),

  // Initiate subscription (create pending + checkout URL)
  initiate: (data: InitiateSubscriptionRequest): Promise<InitiateSubscriptionResponse> =>
    httpClient.post('/user-subscriptions/initiate', data),

  // Cancel subscription
  cancel: (id: string, cancelAtPeriodEnd: boolean = true): Promise<UserSubscriptionResponse> =>
    httpClient.patch(`/user-subscriptions/${id}/cancel`, { cancelAtPeriodEnd }),

  // Reactivate subscription
  reactivate: (id: string): Promise<UserSubscriptionResponse> =>
    httpClient.patch(`/user-subscriptions/${id}/reactivate`),

  // Delete subscription
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    httpClient.delete(`/user-subscriptions/${id}`),

  // Check user access
  checkAccess: (userId: string): Promise<{
    hasAccess: boolean;
    subscription?: UserSubscription;
    plan?: SubscriptionPlan;
    pricing?: PlanPricing;
  }> =>
    httpClient.get(`/user-subscriptions/check-access/${userId}`),

  // Sync subscription with Stripe
  syncWithStripe: (id: string): Promise<UserSubscriptionResponse> =>
    httpClient.post(`/user-subscriptions/${id}/sync`),
};

// Combined API service
export const subscriptionService = {
  plans: subscriptionPlansApi,
  subscriptions: userSubscriptionsApi,
}; 