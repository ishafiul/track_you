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

	async createPaymentLinkForPlan(planId: string, billingCycle: 'monthly' | 'yearly', successUrl: string, cancelUrl: string, metadata: Record<string, string>): Promise<{
		success: boolean;
		paymentLink?: string;
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
			const updatedSubscription = await this.userSubscriptionsRepository.update(
				subscriptionId,
				{
					status: stripeSubscription.status as any,
					cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
					updatedAt: new Date().toISOString()
				}
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
	async handleStripeWebhook(payload: string, signature: string,workerHost: string): Promise<{
		success: boolean;
		message?: string;
		error?: string;
		
	}> {
		try {
			const event = this.stripeService.constructWebhookEvent(
				payload,
				signature,
				this.#env.STRIPE_WEBHOOK_SECRET
			);

			// Check if event metadata contains host and matches workerHost
			const eventObj = event.data.object as any;
			const eventHost = eventObj?.metadata?.host;
			if (eventHost && eventHost !== workerHost) {
				return { 
					success: true, 
					message: `Event ignored - host mismatch (event: ${eventHost}, worker: ${workerHost})` 
				};
			}

			switch (event.type) {
				case 'customer.subscription.created':
				case 'customer.subscription.updated':
					await this.handleSubscriptionUpdated(event.data.object as any);
					break;
				case 'customer.subscription.deleted':
					await this.handleSubscriptionDeleted(event.data.object as any);
					break;
				case 'invoice.payment_succeeded':
					await this.handleInvoicePaymentSucceeded(event.data.object as any);
					break;
				case 'invoice.payment_failed':
					await this.handleInvoicePaymentFailed(event.data.object as any);
					break;
				case 'invoice.payment_action_required':
					await this.handleInvoicePaymentActionRequired(event.data.object as any);
					break;
				case 'customer.subscription.trial_will_end':
					await this.handleSubscriptionTrialWillEnd(event.data.object as any);
					break;
				default:
					console.log(`Unhandled event type: ${event.type}`);
			}

			return { success: true, message: `Handled ${event.type}` };
		} catch (error) {
			console.error('Error handling Stripe webhook:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to handle webhook';
			return { success: false, error: errorMessage };
		}
	}

	private async handleSubscriptionUpdated(stripeSubscription: any) {
		// Find subscription by Stripe ID and update
		const subscriptions = await this.userSubscriptionsRepository.findAll();
		const subscription = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscription.id);
		
		if (subscription) {
			const updateData = {
				status: stripeSubscription.status,
				currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
				currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
				cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
				updatedAt: new Date().toISOString()
			};

			await this.userSubscriptionsRepository.update(subscription.id, updateData);

			// Handle specific status changes
			switch (stripeSubscription.status) {
				case 'past_due':
					console.log(`Subscription ${subscription.id} is past due - user ${subscription.userId} has payment issues`);
					// Could trigger email notification or grace period logic
					break;
				case 'unpaid':
					console.log(`Subscription ${subscription.id} is unpaid - suspending access for user ${subscription.userId}`);
					// User access should be restricted
					break;
				case 'canceled':
					console.log(`Subscription ${subscription.id} was canceled for user ${subscription.userId}`);
					// Handle cleanup if needed
					break;
				case 'active':
					console.log(`Subscription ${subscription.id} is active for user ${subscription.userId}`);
					// Ensure user has full access
					break;
				case 'trialing':
					console.log(`Subscription ${subscription.id} is in trial for user ${subscription.userId}`);
					break;
				case 'incomplete':
					console.log(`Subscription ${subscription.id} is incomplete for user ${subscription.userId} - payment action required`);
					break;
				case 'incomplete_expired':
					console.log(`Subscription ${subscription.id} incomplete period expired for user ${subscription.userId}`);
					break;
				default:
					console.log(`Subscription ${subscription.id} status changed to ${stripeSubscription.status} for user ${subscription.userId}`);
			}
		}
	}

	private async handleSubscriptionDeleted(stripeSubscription: any) {
		// Find subscription by Stripe ID and mark as canceled
		const subscriptions = await this.userSubscriptionsRepository.findAll();
		const subscription = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscription.id);
		
		if (subscription) {
			await this.userSubscriptionsRepository.update(subscription.id, {
				status: 'canceled',
				updatedAt: new Date().toISOString()
			});
		}
	}

	private async handleInvoicePaymentSucceeded(invoice: any) {
		console.log('Invoice payment succeeded:', invoice.id);
		
		// If this is a subscription invoice, ensure the subscription is active
		if (invoice.subscription) {
			const subscriptions = await this.userSubscriptionsRepository.findAll();
			const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
			
			if (subscription && subscription.status !== 'active') {
				await this.userSubscriptionsRepository.update(subscription.id, {
					status: 'active',
					updatedAt: new Date().toISOString()
				});
				console.log(`Reactivated subscription ${subscription.id} after successful payment`);
			}
		}
	}

	private async handleInvoicePaymentFailed(invoice: any) {
		console.log('Invoice payment failed:', invoice.id);
		
		// If this is a subscription invoice, handle the payment failure
		if (invoice.subscription) {
			const subscriptions = await this.userSubscriptionsRepository.findAll();
			const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
			
			if (subscription) {
				// Check the attempt count and billing reason
				const attemptCount = invoice.attempt_count || 0;
				const nextPaymentAttempt = invoice.next_payment_attempt;
				
				if (attemptCount >= 4 || !nextPaymentAttempt) {
					// Final attempt failed - suspend the subscription
					await this.userSubscriptionsRepository.update(subscription.id, {
						status: 'unpaid',
						updatedAt: new Date().toISOString()
					});
					console.log(`Suspended subscription ${subscription.id} after ${attemptCount} failed payment attempts`);
				} else {
					// Mark as past_due but keep trying
					await this.userSubscriptionsRepository.update(subscription.id, {
						status: 'past_due',
						updatedAt: new Date().toISOString()
					});
					console.log(`Marked subscription ${subscription.id} as past_due, attempt ${attemptCount}/4`);
				}
			}
		}
	}

	private async handleInvoicePaymentActionRequired(invoice: any) {
		console.log('Invoice payment action required:', invoice.id);
		
		// When payment requires additional action (like 3D Secure)
		if (invoice.subscription) {
			const subscriptions = await this.userSubscriptionsRepository.findAll();
			const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
			
			if (subscription) {
				await this.userSubscriptionsRepository.update(subscription.id, {
					status: 'incomplete',
					updatedAt: new Date().toISOString()
				});
				console.log(`Marked subscription ${subscription.id} as incomplete - payment action required`);
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
}
function getBaseUrl(c: any): { workerHost: any; } {
	throw new Error("Function not implemented.");
}

