import { RpcTarget } from "cloudflare:workers";
import {Bindings} from "../config/bindings";
import {drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { SubscriptionPlansRepository } from "../repository/subscription-plans.repository";
import { UserSubscriptionsRepository } from "../repository/user-subscriptions.repository";
import { PlanPricingRepository } from "../repository/planPricing.repository";
import { StripeService } from "./stripeService";
import { getDb } from "../utils/getDb";
import type { z } from 'zod';
import { 
	insertSubscriptionPlansSchema, 
	selectSubscriptionPlansSchema,
	updateSubscriptionPlansSchema,
	insertUserSubscriptionsSchema,
	selectUserSubscriptionsSchema,
	updateUserSubscriptionsSchema,
	insertPlanPricingSchema,
	selectPlanPricingSchema,
	updatePlanPricingSchema
} from '../../drizzle/schema';

type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlansSchema>;
type SelectSubscriptionPlan = z.infer<typeof selectSubscriptionPlansSchema>;
type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlansSchema>;
type InsertUserSubscription = z.infer<typeof insertUserSubscriptionsSchema>;
type SelectUserSubscription = z.infer<typeof selectUserSubscriptionsSchema>;
type UpdateUserSubscription = z.infer<typeof updateUserSubscriptionsSchema>;
type InsertPlanPricing = z.infer<typeof insertPlanPricingSchema>;
type SelectPlanPricing = z.infer<typeof selectPlanPricingSchema>;
type UpdatePlanPricing = z.infer<typeof updatePlanPricingSchema>;

export class Billing extends RpcTarget {
	#env: Bindings;
	private readonly db: LibSQLDatabase;
	private readonly subscriptionPlansRepository: SubscriptionPlansRepository;
	private readonly userSubscriptionsRepository: UserSubscriptionsRepository;
	private readonly planPricingRepository: PlanPricingRepository;
	private readonly stripeService: StripeService;

	constructor(env: Bindings) {
		super();
		this.#env = env;
		this.db = getDb(env);
		this.subscriptionPlansRepository = new SubscriptionPlansRepository(this.db);
		this.userSubscriptionsRepository = new UserSubscriptionsRepository(this.db);
		this.planPricingRepository = new PlanPricingRepository(this.db);
		this.stripeService = new StripeService(env.STRIPE_SECRET_KEY);
	}

	// Plan Pricing Methods
	async createPlanPricing(pricingData: InsertPlanPricing): Promise<SelectPlanPricing> {
		return await this.planPricingRepository.create(pricingData);
	}

	async getPlanPricing(id: string): Promise<SelectPlanPricing | null> {
		return await this.planPricingRepository.findById(id);
	}

	async getPlanPricingByPlan(planId: string): Promise<SelectPlanPricing[]> {
		return await this.planPricingRepository.findByPlanId(planId);
	}

	async getPlanPricingByPlanAndCycle(planId: string, billingCycle: 'monthly' | 'yearly'): Promise<SelectPlanPricing | null> {
		return await this.planPricingRepository.findByPlanAndCycle(planId, billingCycle);
	}

	async updatePlanPricing(id: string, updateData: Partial<UpdatePlanPricing>): Promise<SelectPlanPricing | null> {
		return await this.planPricingRepository.update(id, updateData);
	}

	async deletePlanPricing(id: string): Promise<void> {
		await this.planPricingRepository.delete(id);
	}

	// Subscription Plans Methods
	async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SelectSubscriptionPlan> {
		return await this.subscriptionPlansRepository.create(planData);
	}

	async getSubscriptionPlan(id: string): Promise<SelectSubscriptionPlan | null> {
		const plan = await this.subscriptionPlansRepository.findById(id);
		return plan || null;
	}

	async getAllSubscriptionPlans(): Promise<SelectSubscriptionPlan[]> {
		return await this.subscriptionPlansRepository.findAll();
	}

	async getAllSubscriptionPlansWithPricing(): Promise<(SelectSubscriptionPlan & { pricing: SelectPlanPricing[] })[]> {
		const plans = await this.subscriptionPlansRepository.findAll();
		const plansWithPricing = [];
		
		for (const plan of plans) {
			const pricing = await this.planPricingRepository.findByPlanId(plan.id);
			plansWithPricing.push({
				...plan,
				pricing: pricing || []
			});
		}
		
		return plansWithPricing;
	}

	async getActiveSubscriptionPlans(): Promise<SelectSubscriptionPlan[]> {
		return await this.subscriptionPlansRepository.findActive();
	}

	async updateSubscriptionPlan(id: string, updateData: Partial<UpdateSubscriptionPlan>): Promise<SelectSubscriptionPlan | null> {
		const plan = await this.subscriptionPlansRepository.update(id, updateData);
		return plan || null;
	}

	async deactivateSubscriptionPlan(id: string): Promise<SelectSubscriptionPlan | null> {
		const plan = await this.subscriptionPlansRepository.deactivate(id);
		return plan || null;
	}

	async deleteSubscriptionPlan(id: string): Promise<void> {
		await this.subscriptionPlansRepository.delete(id);
	}

	// Delete subscription plan with Stripe cleanup
	async deleteSubscriptionPlanWithStripe(id: string): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			// Get the plan first to get Stripe IDs
			const plan = await this.subscriptionPlansRepository.findById(id);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}

			// Check if there are any active subscriptions using this plan
			const activeSubscriptions = await this.userSubscriptionsRepository.findByPlanId(id);
			const hasActiveSubscriptions = activeSubscriptions.some(sub => 
				sub.status === 'active' || sub.status === 'trialing'
			);

			if (hasActiveSubscriptions) {
				return { 
					success: false, 
					error: 'Cannot delete plan with active subscriptions. Cancel all subscriptions first.' 
				};
			}

			// Get all pricing for this plan and archive Stripe prices
			const planPricing = await this.planPricingRepository.findByPlanId(id);
			for (const pricing of planPricing) {
				if (pricing.stripePriceId) {
					try {
						// Archive the price in Stripe
						await this.stripeService.archivePrice(pricing.stripePriceId);
					} catch (stripeError) {
						console.warn('Failed to archive Stripe price:', stripeError);
					}
				}
			}

			// Archive the Stripe product if it exists
			if (plan.stripeProductId) {
				try {
					await this.stripeService.archiveProduct(plan.stripeProductId);
				} catch (stripeError) {
					console.warn('Failed to archive Stripe product:', stripeError);
				}
			}

			// Delete pricing first (due to foreign key constraint)
			await this.planPricingRepository.deleteByPlanId(id);
			
			// Delete the plan
			await this.subscriptionPlansRepository.delete(id);
			
			return { success: true };
		} catch (error) {
			console.error('Error deleting subscription plan:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete subscription plan';
			return { success: false, error: errorMessage };
		}
	}

	// User Subscriptions Methods
	async createUserSubscription(subscriptionData: InsertUserSubscription): Promise<SelectUserSubscription> {
		return await this.userSubscriptionsRepository.create(subscriptionData);
	}

	async getUserSubscription(id: string): Promise<SelectUserSubscription | null> {
		const subscription = await this.userSubscriptionsRepository.findById(id);
		return subscription || null;
	}

	async getUserSubscriptions(userId: string): Promise<SelectUserSubscription[]> {
		return await this.userSubscriptionsRepository.findByUserId(userId);
	}

	async getUserActiveSubscription(userId: string): Promise<SelectUserSubscription | null> {
		const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
		return subscription || null;
	}

	async getSubscriptionsByPlan(planId: string): Promise<SelectUserSubscription[]> {
		return await this.userSubscriptionsRepository.findByPlanId(planId);
	}

	async getExpiringSubscriptions(beforeDate: string): Promise<SelectUserSubscription[]> {
		return await this.userSubscriptionsRepository.findExpiring(beforeDate);
	}

	async updateUserSubscription(id: string, updateData: Partial<UpdateUserSubscription>): Promise<SelectUserSubscription | null> {
		const subscription = await this.userSubscriptionsRepository.update(id, updateData);
		return subscription || null;
	}

	async cancelUserSubscription(id: string, cancelAtPeriodEnd: boolean = true): Promise<SelectUserSubscription | null> {
		const subscription = await this.userSubscriptionsRepository.cancel(id, cancelAtPeriodEnd);
		return subscription || null;
	}

	async reactivateUserSubscription(id: string): Promise<SelectUserSubscription | null> {
		const subscription = await this.userSubscriptionsRepository.reactivate(id);
		return subscription || null;
	}

	async deleteUserSubscription(id: string): Promise<void> {
		await this.userSubscriptionsRepository.delete(id);
	}

	// Business Logic Methods
	async subscribeUserToPlan(
		userId: string, 
		planId: string, 
		billingCycle: 'monthly' | 'yearly',
		periodStart: string, 
		periodEnd: string
	): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			// Check if plan exists and is active
			const plan = await this.subscriptionPlansRepository.findById(planId);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}
			if (!plan.active) {
				return { success: false, error: 'Subscription plan is not active' };
			}

			// Check if pricing exists for the billing cycle
			const pricing = await this.planPricingRepository.findByPlanAndCycle(planId, billingCycle);
			if (!pricing) {
				return { success: false, error: `Pricing not found for ${billingCycle} billing cycle` };
			}
			if (!pricing.active) {
				return { success: false, error: `${billingCycle} pricing is not active` };
			}

			// Check if user already has an active subscription
			const existingSubscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			if (existingSubscription) {
				return { success: false, error: 'User already has an active subscription' };
			}

			// Create new subscription
			const subscriptionData: InsertUserSubscription = {
				id: crypto.randomUUID(),
				userId,
				planId,
				billingCycle,
				status: 'active',
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			const subscription = await this.userSubscriptionsRepository.create(subscriptionData);
			return { success: true, subscription };
		} catch (error) {
			console.error('Error subscribing user to plan:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe user to plan';
			return { success: false, error: errorMessage };
		}
	}

	async upgradePlan(userId: string, newPlanId: string, newBillingCycle: 'monthly' | 'yearly'): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			// Check if new plan exists and is active
			const newPlan = await this.subscriptionPlansRepository.findById(newPlanId);
			if (!newPlan || !newPlan.active) {
				return { success: false, error: 'New subscription plan not found or inactive' };
			}

			// Check if pricing exists for the new billing cycle
			const newPricing = await this.planPricingRepository.findByPlanAndCycle(newPlanId, newBillingCycle);
			if (!newPricing || !newPricing.active) {
				return { success: false, error: `Pricing not found for ${newBillingCycle} billing cycle` };
			}

			// Get current subscription
			const currentSubscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			if (!currentSubscription) {
				return { success: false, error: 'No active subscription found for user' };
			}

			// Update subscription
			const updatedSubscription = await this.userSubscriptionsRepository.update(currentSubscription.id, {
				planId: newPlanId,
				billingCycle: newBillingCycle,
				updatedAt: new Date().toISOString()
			});

			return { success: true, subscription: updatedSubscription || undefined };
		} catch (error) {
			console.error('Error upgrading plan:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade plan';
			return { success: false, error: errorMessage };
		}
	}

	async renewSubscription(subscriptionId: string, newPeriodEnd: string): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findById(subscriptionId);
			if (!subscription) {
				return { success: false, error: 'Subscription not found' };
			}

			const updatedSubscription = await this.userSubscriptionsRepository.update(subscriptionId, {
				currentPeriodEnd: newPeriodEnd,
				status: 'active',
				cancelAtPeriodEnd: false,
				updatedAt: new Date().toISOString()
			});

			return { success: true, subscription: updatedSubscription || undefined };
		} catch (error) {
			console.error('Error renewing subscription:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to renew subscription';
			return { success: false, error: errorMessage };
		}
	}

	async checkUserAccess(userId: string): Promise<{
		hasAccess: boolean;
		subscription?: SelectUserSubscription;
		plan?: SelectSubscriptionPlan;
		pricing?: SelectPlanPricing;
		accessLevel?: 'full' | 'limited' | 'none';
		reason?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			if (!subscription) {
				return { hasAccess: false, accessLevel: 'none', reason: 'No active subscription' };
			}

			const plan = await this.subscriptionPlansRepository.findById(subscription.planId);
			if (!plan || !plan.active) {
				return { hasAccess: false, accessLevel: 'none', reason: 'Plan not found or inactive' };
			}

			const pricing = await this.planPricingRepository.findByPlanAndCycle(subscription.planId, subscription.billingCycle);
			if (!pricing || !pricing.active) {
				return { hasAccess: false, accessLevel: 'none', reason: 'Pricing not found or inactive' };
			}

			// Check subscription status first
			switch (subscription.status) {
				case 'unpaid':
					return { 
						hasAccess: false, 
						subscription, 
						plan, 
						pricing, 
						accessLevel: 'none', 
						reason: 'Payment failed - subscription suspended' 
					};
				case 'past_due':
					return { 
						hasAccess: true, 
						subscription, 
						plan, 
						pricing, 
						accessLevel: 'limited', 
						reason: 'Payment overdue - limited access during grace period' 
					};
				case 'incomplete':
				case 'incomplete_expired':
					return { 
						hasAccess: false, 
						subscription, 
						plan, 
						pricing, 
						accessLevel: 'none', 
						reason: 'Payment setup incomplete' 
					};
				case 'canceled':
					return { 
						hasAccess: false, 
						subscription, 
						plan, 
						pricing, 
						accessLevel: 'none', 
						reason: 'Subscription canceled' 
					};
			}

			// Check if subscription is still valid
			const now = new Date();
			const periodEnd = new Date(subscription.currentPeriodEnd);
			if (now > periodEnd && subscription.status !== 'active') {
				return { 
					hasAccess: false, 
					subscription, 
					plan, 
					pricing, 
					accessLevel: 'none', 
					reason: 'Subscription period expired' 
				};
			}

			// If we get here, subscription is active and valid
			return { 
				hasAccess: true, 
				subscription, 
				plan,
				pricing,
				accessLevel: 'full',
				reason: 'Active subscription with full access'
			};
		} catch (error) {
			console.error('Error checking user access:', error);
			return { hasAccess: false, accessLevel: 'none', reason: 'Error checking subscription' };
		}
	}

	// Stripe Integration Methods
	async createSubscriptionPlanWithStripe(planData: {
		name: string;
		description?: string;
		featuresJson: string;
		apiRateLimit: number;
		maxRequestsPerMonth: number;
		monthlyPrice: number;
		yearlyPrice: number;
	}): Promise<{
		success: boolean;
		plan?: SelectSubscriptionPlan;
		pricing?: SelectPlanPricing[];
		error?: string;
	}> {
		try {
			// Create Stripe product
			const stripeProduct = await this.stripeService.createProduct({
				name: planData.name,
				description: planData.description || '',
				metadata: {
					apiRateLimit: planData.apiRateLimit.toString(),
					maxRequestsPerMonth: planData.maxRequestsPerMonth.toString(),
				}
			});

			// Create monthly price in Stripe
			const monthlyStripePrice = await this.stripeService.createPrice({
				productId: stripeProduct.id,
				unitAmount: Math.round(planData.monthlyPrice * 100), // Convert to cents
				currency: 'usd',
				interval: 'month',
				nickname: `${planData.name} - Monthly`
			});

			// Create yearly price in Stripe
			const yearlyStripePrice = await this.stripeService.createPrice({
				productId: stripeProduct.id,
				unitAmount: Math.round(planData.yearlyPrice * 100), // Convert to cents
				currency: 'usd',
				interval: 'year',
				nickname: `${planData.name} - Yearly`
			});

			// Generate plan ID
			const planId = planData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

			// Create subscription plan
			const plan = await this.subscriptionPlansRepository.create({
				id: planId,
				name: planData.name,
				description: planData.description,
				featuresJson: planData.featuresJson,
				apiRateLimit: planData.apiRateLimit,
				maxRequestsPerMonth: planData.maxRequestsPerMonth,
				stripeProductId: stripeProduct.id,
				active: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			// Create monthly pricing
			const monthlyPricing = await this.planPricingRepository.create({
				id: `${planId}-monthly`,
				planId: plan.id,
				billingCycle: 'monthly',
				price: planData.monthlyPrice,
				stripePriceId: monthlyStripePrice.id,
				active: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			// Create yearly pricing
			const yearlyPricing = await this.planPricingRepository.create({
				id: `${planId}-yearly`,
				planId: plan.id,
				billingCycle: 'yearly',
				price: planData.yearlyPrice,
				stripePriceId: yearlyStripePrice.id,
				active: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			return { 
				success: true, 
				plan, 
				pricing: [monthlyPricing, yearlyPricing]
			};
		} catch (error) {
			console.error('Error creating subscription plan with Stripe:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription plan';
			return { success: false, error: errorMessage };
		}
	}

	async createPaymentLinkForPlan(data:{planId: string, billingCycle: 'monthly' | 'yearly', successUrl: string, cancelUrl: string, metadata: Record<string, string>}): Promise<{
		success: boolean;
		paymentLink?: string;
		error?: string;
	}> {
		const {planId, billingCycle, successUrl, cancelUrl, metadata} = data;
		try {
			const plan = await this.subscriptionPlansRepository.findById(planId);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}

			const pricing = await this.planPricingRepository.findByPlanAndCycle(planId, billingCycle);
			if (!pricing || !pricing.stripePriceId) {
				return { success: false, error: `Pricing not found for ${billingCycle} billing cycle` };
			}

			const paymentLink = await this.stripeService.createPaymentLink({
				priceId: pricing.stripePriceId,
				successUrl,
				cancelUrl,
				metadata: metadata
			});

			return { success: true, paymentLink: paymentLink.url };
		} catch (error) {
			console.error('Error creating payment link:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create payment link';
			return { success: false, error: errorMessage };
		}
	}

	// Create a checkout session instead of payment link for better metadata handling
	async createCheckoutSessionForPlan(data: {
		planId: string, 
		billingCycle: 'monthly' | 'yearly', 
		userEmail: string,
		successUrl: string, 
		cancelUrl: string, 
		metadata: Record<string, string>
	}): Promise<{
		success: boolean;
		checkoutUrl?: string;
		error?: string;
	}> {
		const {planId, billingCycle, userEmail, successUrl, cancelUrl, metadata} = data;
		try {
			const plan = await this.subscriptionPlansRepository.findById(planId);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}

			const pricing = await this.planPricingRepository.findByPlanAndCycle(planId, billingCycle);
			if (!pricing || !pricing.stripePriceId) {
				return { success: false, error: `Pricing not found for ${billingCycle} billing cycle` };
			}

			const checkoutSession = await this.stripeService.createCheckoutSession({
				priceId: pricing.stripePriceId,
				customerEmail: userEmail,
				successUrl,
				cancelUrl,
				metadata: {
					...metadata,
					planId,
					billingCycle
				}
			});

			return { success: true, checkoutUrl: checkoutSession.url || undefined };
		} catch (error) {
			console.error('Error creating checkout session:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
			return { success: false, error: errorMessage };
		}
	}

	async createCheckoutSession(
		planId: string,
		billingCycle: 'monthly' | 'yearly',
		userEmail: string,
		successUrl: string,
		cancelUrl: string
	): Promise<{
		success: boolean;
		checkoutUrl?: string;
		error?: string;
	}> {
		try {
			const plan = await this.subscriptionPlansRepository.findById(planId);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}

			const pricing = await this.planPricingRepository.findByPlanAndCycle(planId, billingCycle);
			if (!pricing || !pricing.stripePriceId) {
				return { success: false, error: `Pricing not found for ${billingCycle} billing cycle` };
			}

			const checkoutSession = await this.stripeService.createCheckoutSession({
				priceId: pricing.stripePriceId,
				customerEmail: userEmail,
				successUrl,
				cancelUrl,
				metadata: {
					planId: planId,
					billingCycle: billingCycle
				}
			});

			return { success: true, checkoutUrl: checkoutSession.url || undefined };
		} catch (error) {
			console.error('Error creating checkout session:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
			return { success: false, error: errorMessage };
		}
	}

	async handleStripeSubscriptionSuccess(
		stripeSubscriptionId: string,
		stripeCustomerId: string,
		planId: string,
		billingCycle: 'monthly' | 'yearly',
		userId: string
	): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			// Get subscription details from Stripe
			const stripeSubscription = await this.stripeService.getSubscription(stripeSubscriptionId);
			
			const subscriptionData: InsertUserSubscription = {
				id: crypto.randomUUID(),
				userId,
				planId,
				billingCycle,
				status: stripeSubscription.status as any,
				currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
				currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
				cancelAtPeriodEnd: false,
				stripeSubscriptionId,
				stripeCustomerId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			const subscription = await this.userSubscriptionsRepository.create(subscriptionData);
			return { success: true, subscription };
		} catch (error) {
			console.error('Error handling Stripe subscription success:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to handle subscription success';
			return { success: false, error: errorMessage };
		}
	}

	// Sync subscription status with Stripe
	async syncSubscriptionWithStripe(subscriptionId: string): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findById(subscriptionId);
			if (!subscription || !subscription.stripeSubscriptionId) {
				return { success: false, error: 'Subscription not found or missing Stripe ID' };
			}

			const stripeSubscription = await this.stripeService.getSubscription(subscription.stripeSubscriptionId);
			
			// Update subscription with Stripe data
			const updatedSubscription = await this.userSubscriptionsRepository.update(
				subscriptionId,
				{
					status: stripeSubscription.status as any,
					currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
					currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
					cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
					updatedAt: new Date().toISOString()
				}
			);

			console.log(`✅ USER PLAN UPDATED: User ${subscription.userId} plan status changed to '${stripeSubscription.status}' for plan ${subscription.planId}`);

			// Handle specific status changes
			switch (stripeSubscription.status) {
				case 'past_due':
					console.log(`⚠️ USER PLAN PAST DUE: User ${subscription.userId} has payment issues`);
					// Could trigger email notification or grace period logic
					break;
				case 'unpaid':
					console.log(`🚫 USER PLAN SUSPENDED: User ${subscription.userId} access suspended due to unpaid subscription`);
					// User access should be restricted
					break;
				case 'canceled':
					console.log(`❌ USER PLAN CANCELLED: User ${subscription.userId} subscription was canceled`);
					// Handle cleanup if needed
					break;
				case 'active':
					console.log(`✅ USER PLAN ACTIVE: User ${subscription.userId} has full access to plan ${subscription.planId}`);
					// Ensure user has full access
					break;
				case 'trialing':
					console.log(`🔄 USER PLAN TRIAL: User ${subscription.userId} is in trial period for plan ${subscription.planId}`);
					break;
				case 'incomplete':
					console.log(`⏳ USER PLAN PENDING: User ${subscription.userId} payment action required for plan ${subscription.planId}`);
					break;
				case 'incomplete_expired':
					console.log(`💀 USER PLAN EXPIRED: User ${subscription.userId} incomplete period expired for plan ${subscription.planId}`);
					break;
				default:
					console.log(`🔄 USER PLAN STATUS CHANGE: User ${subscription.userId} plan status changed to ${stripeSubscription.status} for plan ${subscription.planId}`);
			}

			return { success: true, subscription: updatedSubscription };
		} catch (error) {
			console.error('Error syncing subscription with Stripe:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to sync subscription with Stripe';
			return { success: false, error: errorMessage };
		}
	}

	// Cancel subscription in Stripe
	async cancelSubscriptionInStripe(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findById(subscriptionId);
			if (!subscription || !subscription.stripeSubscriptionId) {
				return { success: false, error: 'Subscription not found or missing Stripe ID' };
			}

			// Cancel in Stripe
			const stripeSubscription = await this.stripeService.cancelSubscription(
				subscription.stripeSubscriptionId,
				cancelAtPeriodEnd
			);

			// Update local subscription
			const updateData: any = {
				status: stripeSubscription.status as any,
				cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
				updatedAt: new Date().toISOString()
			};

			// If immediate cancellation, revert to free plan
			if (!cancelAtPeriodEnd) {
				updateData.planId = 'free-plan';
				updateData.status = 'active'; // Free plan is always active
				updateData.stripeSubscriptionId = null; // Remove Stripe reference
				updateData.stripeCustomerId = null;
			}

			const updatedSubscription = await this.userSubscriptionsRepository.update(
				subscriptionId,
				updateData
			);

			return { success: true, subscription: updatedSubscription };
		} catch (error) {
			console.error('Error canceling subscription in Stripe:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription in Stripe';
			return { success: false, error: errorMessage };
		}
	}

	// Reactivate subscription in Stripe
	async reactivateSubscriptionInStripe(subscriptionId: string): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findById(subscriptionId);
			if (!subscription || !subscription.stripeSubscriptionId) {
				return { success: false, error: 'Subscription not found or missing Stripe ID' };
			}

			// Reactivate in Stripe
			const stripeSubscription = await this.stripeService.reactivateSubscription(
				subscription.stripeSubscriptionId
			);

			// Update local subscription
			const updatedSubscription = await this.userSubscriptionsRepository.update(
				subscriptionId,
				{
					status: stripeSubscription.status as any,
					cancelAtPeriodEnd: false,
					updatedAt: new Date().toISOString()
				}
			);

			return { success: true, subscription: updatedSubscription };
		} catch (error) {
			console.error('Error reactivating subscription in Stripe:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate subscription in Stripe';
			return { success: false, error: errorMessage };
		}
	}

	// Handle Stripe webhooks
	async handleStripeWebhook(payload: string, signature: string, workerHost: string): Promise<{
		success: boolean;
		message?: string;
		error?: string;
		
	}> {

		try {
			const event = await this.stripeService.constructWebhookEvent(
				payload,
				signature,
				this.#env.STRIPE_WEBHOOK_SECRET
			);
			
			// Process the event based on its type
			switch (event.type) {
				case 'checkout.session.completed':
					await this.handleCheckoutSessionCompleted(event.data.object);
					break;
				case 'customer.subscription.created':
					await this.handleSubscriptionCreated(event.data.object);
					break;
				case 'customer.subscription.updated':
					await this.handleSubscriptionUpdated(event.data.object);
					break;
				case 'customer.subscription.deleted':
					await this.handleSubscriptionDeleted(event.data.object);
					break;
				case 'invoice.payment_succeeded':
					await this.handleInvoicePaymentSucceeded(event.data.object);
					break;
				case 'invoice.payment_failed':
					await this.handleInvoicePaymentFailed(event.data.object);
					break;
				default:
					console.log('Unhandled event type:', event.type);
			}

			return { success: true, message: `Processed ${event.type} event` };
		} catch (error) {
			console.error('❌ Error handling Stripe webhook:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
			return { success: false, error: errorMessage };
		}
	}

	private async handleCheckoutSessionCompleted(checkoutSession: any) {
		// If this checkout session created a subscription, we need to create our local subscription record
		if (checkoutSession.subscription && checkoutSession.metadata) {
			const userId = checkoutSession.metadata.userId;
			const planId = checkoutSession.metadata.planId;
			const billingCycle = checkoutSession.metadata.billingCycle;
			
			if (userId && planId && billingCycle) {
				const subscriptionData = {
					id: crypto.randomUUID(),
					userId,
					planId,
					billingCycle: billingCycle as 'monthly' | 'yearly',
					status: 'incomplete' as const,
					currentPeriodStart: new Date().toISOString(),
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
					cancelAtPeriodEnd: false,
					stripeSubscriptionId: checkoutSession.subscription,
					stripeCustomerId: checkoutSession.customer,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				await this.userSubscriptionsRepository.create(subscriptionData);
				console.log(`✅ Subscription created for user ${userId} on plan ${planId}`);
			}
		}
	}

	private async handleSubscriptionCreated(stripeSubscription: any) {
		// Find existing subscription by user ID and update it with Stripe details
		if (stripeSubscription.metadata && stripeSubscription.metadata.userId) {
			const userId = stripeSubscription.metadata.userId;
			const planId = stripeSubscription.metadata.planId;
			const billingCycle = stripeSubscription.metadata.billingCycle;
			
			// Find the existing subscription for this user
			const existingSubscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			
			if (existingSubscription) {
				// Update the existing subscription with new plan and Stripe details
				// Preserve 'active' status if payment has already succeeded
				const newStatus = existingSubscription.status === 'active' ? 'active' : stripeSubscription.status;
				
				const updateData = {
					planId: planId, // Update the plan ID (this handles upgrades)
					billingCycle: billingCycle as 'monthly' | 'yearly',
					status: newStatus, // Don't downgrade from 'active' to 'incomplete'
					currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
					currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
					cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
					stripeSubscriptionId: stripeSubscription.id,
					stripeCustomerId: stripeSubscription.customer,
					updatedAt: new Date().toISOString()
				};

				await this.userSubscriptionsRepository.update(existingSubscription.id, updateData);
				console.log(`✅ User ${userId} plan updated to ${planId} with status: ${newStatus}`);
			} else {
				// No existing subscription found - create a new one (this handles new users or direct Stripe subscriptions)
				const subscriptionData = {
					id: crypto.randomUUID(),
					userId,
					planId,
					billingCycle: billingCycle as 'monthly' | 'yearly',
					status: stripeSubscription.status,
					currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
					currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
					cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
					stripeSubscriptionId: stripeSubscription.id,
					stripeCustomerId: stripeSubscription.customer,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				await this.userSubscriptionsRepository.create(subscriptionData);
				console.log(`✅ User ${userId} subscribed to plan ${planId} with status: ${stripeSubscription.status}`);
			}
		}
	}

	private async handleSubscriptionUpdated(stripeSubscription: any) {
		// Find and update the subscription
		const subscriptions = await this.userSubscriptionsRepository.findAll();
		const subscription = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscription.id);
		
		if (subscription) {
			await this.userSubscriptionsRepository.update(subscription.id, {
				status: stripeSubscription.status,
				currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
				currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
				cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
				updatedAt: new Date().toISOString()
			});
		}
	}

	private async handleSubscriptionDeleted(stripeSubscription: any) {
		// Find and update the subscription
		const subscriptions = await this.userSubscriptionsRepository.findAll();
		const subscription = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscription.id);
		
		if (subscription) {
			// When subscription is deleted/canceled, revert user to free plan with active status
			await this.userSubscriptionsRepository.update(subscription.id, {
				planId: 'free-plan', // Revert to free plan
				status: 'active', // Free plan is always active
				cancelAtPeriodEnd: false,
				stripeSubscriptionId: null, // Remove Stripe reference
				stripeCustomerId: null,
				updatedAt: new Date().toISOString()
			});
			console.log(`✅ User ${subscription.userId} subscription canceled, reverted to active free plan`);
		}
	}

	private async handleInvoicePaymentSucceeded(invoice: any) {
		// If this is a subscription invoice, ensure the subscription is active
		if (invoice.subscription) {
			// First try to get the subscription from Stripe to get metadata
			let userId = null;
			try {
				const stripeSubscription = await this.stripeService.getSubscription(invoice.subscription);
				userId = stripeSubscription?.metadata?.userId;
			} catch (error) {
				console.log('Could not fetch Stripe subscription metadata:', error);
			}
			
			// Find subscription by user ID (most reliable method)
			if (userId) {
				const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
				
				if (subscription) {
					// Update the subscription to active and ensure Stripe IDs are set
					await this.userSubscriptionsRepository.update(subscription.id, {
						stripeSubscriptionId: invoice.subscription,
						stripeCustomerId: invoice.customer,
						status: 'active',
						updatedAt: new Date().toISOString()
					});
					console.log(`✅ User ${userId} plan ${subscription.planId} activated after payment`);
					return;
				}
			}
			
			// Fallback: Try to find by Stripe IDs (original method)
			const subscriptions = await this.userSubscriptionsRepository.findAll();
			const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
			
			if (!subscription) {
				// Try to find by customer ID if subscription ID doesn't match
				const subscriptionByCustomer = subscriptions.find(s => s.stripeCustomerId === invoice.customer);
				
				if (subscriptionByCustomer) {
					// Update the subscription with the Stripe subscription ID and make it active
					await this.userSubscriptionsRepository.update(subscriptionByCustomer.id, {
						stripeSubscriptionId: invoice.subscription,
						status: 'active',
						updatedAt: new Date().toISOString()
					});
					console.log(`✅ User ${subscriptionByCustomer.userId} plan ${subscriptionByCustomer.planId} activated after payment`);
				}
			} else if (subscription.status !== 'active') {
				await this.userSubscriptionsRepository.update(subscription.id, {
					status: 'active',
					updatedAt: new Date().toISOString()
				});
				console.log(`✅ User ${subscription.userId} plan ${subscription.planId} reactivated after payment`);
			}
		}
	}

	private async handleInvoicePaymentFailed(invoice: any) {
		// If this is a subscription invoice, mark the subscription as past due
		if (invoice.subscription) {
			const subscriptions = await this.userSubscriptionsRepository.findAll();
			const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
			
			if (subscription) {
				await this.userSubscriptionsRepository.update(subscription.id, {
					status: 'past_due',
					updatedAt: new Date().toISOString()
				});
			}
		}
	}

	private async handleSubscriptionTrialWillEnd(stripeSubscription: any) {
		console.log('Subscription trial will end:', stripeSubscription.id);
		
		// Notify user that trial is ending soon
		const subscriptions = await this.userSubscriptionsRepository.findAll();
		const subscription = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscription.id);
		
		if (subscription) {
			// You could send an email notification here
			console.log(`Trial ending soon for subscription ${subscription.id}, user ${subscription.userId}`);
		}
	}

	async updatePlanPricingWithStripe(
		planId: string,
		monthlyPrice: number,
		yearlyPrice: number
	): Promise<{
		success: boolean;
		pricing?: SelectPlanPricing[];
		error?: string;
	}> {
		try {
			// Get the plan first
			const plan = await this.subscriptionPlansRepository.findById(planId);
			if (!plan) {
				return { success: false, error: 'Subscription plan not found' };
			}

			if (!plan.stripeProductId) {
				return { success: false, error: 'Plan has no Stripe product ID' };
			}

			// Get existing pricing
			const existingPricing = await this.planPricingRepository.findByPlanId(planId);
			
			// Archive old Stripe prices
			for (const pricing of existingPricing) {
				if (pricing.stripePriceId) {
					try {
						await this.stripeService.archivePrice(pricing.stripePriceId);
					} catch (stripeError) {
						console.warn('Failed to archive old Stripe price:', stripeError);
					}
				}
			}

			// Create new Stripe prices
			const monthlyStripePrice = await this.stripeService.createPrice({
				productId: plan.stripeProductId,
				unitAmount: Math.round(monthlyPrice * 100),
				currency: 'usd',
				interval: 'month',
				nickname: `${plan.name} - Monthly`
			});

			const yearlyStripePrice = await this.stripeService.createPrice({
				productId: plan.stripeProductId,
				unitAmount: Math.round(yearlyPrice * 100),
				currency: 'usd',
				interval: 'year',
				nickname: `${plan.name} - Yearly`
			});

			// Update monthly pricing
			const monthlyPricingId = `${planId}-monthly`;
			const existingMonthly = existingPricing.find(p => p.billingCycle === 'monthly');
			let monthlyPricing;
			
			if (existingMonthly) {
				monthlyPricing = await this.planPricingRepository.update(existingMonthly.id, {
					price: monthlyPrice,
					stripePriceId: monthlyStripePrice.id,
					updatedAt: new Date().toISOString()
				});
			} else {
				monthlyPricing = await this.planPricingRepository.create({
					id: monthlyPricingId,
					planId,
					billingCycle: 'monthly',
					price: monthlyPrice,
					stripePriceId: monthlyStripePrice.id,
					active: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}

			// Update yearly pricing
			const yearlyPricingId = `${planId}-yearly`;
			const existingYearly = existingPricing.find(p => p.billingCycle === 'yearly');
			let yearlyPricing;
			
			if (existingYearly) {
				yearlyPricing = await this.planPricingRepository.update(existingYearly.id, {
					price: yearlyPrice,
					stripePriceId: yearlyStripePrice.id,
					updatedAt: new Date().toISOString()
				});
			} else {
				yearlyPricing = await this.planPricingRepository.create({
					id: yearlyPricingId,
					planId,
					billingCycle: 'yearly',
					price: yearlyPrice,
					stripePriceId: yearlyStripePrice.id,
					active: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}

			return {
				success: true,
				pricing: [monthlyPricing, yearlyPricing].filter(Boolean) as SelectPlanPricing[]
			};
		} catch (error) {
			console.error('Error updating plan pricing:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to update plan pricing';
			return { success: false, error: errorMessage };
		}
	}

	// User Plan Status Methods
	async getUserPlanStatus(userId: string): Promise<{
		success: boolean;
		status: string | null;
		planId: string | null;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			if (!subscription) {
				return {
					success: true,
					status: null,
					planId: null,
					error: 'No subscription found for user'
				};
			}

			return {
				success: true,
				status: subscription.status,
				planId: subscription.planId,
				subscription
			};
		} catch (error) {
			console.error('Error getting user plan status:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to get user plan status';
			return {
				success: false,
				status: null,
				planId: null,
				error: errorMessage
			};
		}
	}

	// Fix free plans that are in canceled status
	async fixFreePlanStatuses(): Promise<{
		success: boolean;
		fixedCount: number;
		message: string;
		error?: string;
	}> {
		try {
			const allSubscriptions = await this.userSubscriptionsRepository.findAll();
			
			// Find free plans that are not active
			const brokenFreePlans = allSubscriptions.filter(sub => 
				sub.planId === 'free-plan' && sub.status !== 'active'
			);

			let fixedCount = 0;

			// Fix each broken free plan
			for (const subscription of brokenFreePlans) {
				await this.userSubscriptionsRepository.update(subscription.id, {
					status: 'active',
					cancelAtPeriodEnd: false,
					stripeSubscriptionId: null,
					stripeCustomerId: null,
					updatedAt: new Date().toISOString()
				});
				fixedCount++;
			}

			return {
				success: true,
				fixedCount,
				message: `Fixed ${fixedCount} free plan subscriptions`
			};
		} catch (error) {
			console.error('Error fixing free plan statuses:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to fix free plan statuses';
			return {
				success: false,
				fixedCount: 0,
				message: 'Failed to fix free plan statuses',
				error: errorMessage
			};
		}
	}
}
function getBaseUrl(c: any): { workerHost: any; } {
	throw new Error("Function not implemented.");
}

