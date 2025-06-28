import { RpcTarget } from "cloudflare:workers";
import {Bindings} from "../config/bindings";
import {drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { SubscriptionPlansRepository } from "../repository/subscription-plans.repository";
import { UserSubscriptionsRepository } from "../repository/user-subscriptions.repository";
import { getDb } from "../utils/getDb";
import type { z } from 'zod';
import { 
	insertSubscriptionPlansSchema, 
	selectSubscriptionPlansSchema,
	updateSubscriptionPlansSchema,
	insertUserSubscriptionsSchema,
	selectUserSubscriptionsSchema,
	updateUserSubscriptionsSchema
} from '../../drizzle/schema';

type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlansSchema>;
type SelectSubscriptionPlan = z.infer<typeof selectSubscriptionPlansSchema>;
type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlansSchema>;
type InsertUserSubscription = z.infer<typeof insertUserSubscriptionsSchema>;
type SelectUserSubscription = z.infer<typeof selectUserSubscriptionsSchema>;
type UpdateUserSubscription = z.infer<typeof updateUserSubscriptionsSchema>;

export class Billing extends RpcTarget {
	#env: Bindings;
	private readonly db: LibSQLDatabase;
	private readonly subscriptionPlansRepository: SubscriptionPlansRepository;
	private readonly userSubscriptionsRepository: UserSubscriptionsRepository;

	constructor(env: Bindings) {
		super();
		this.#env = env;
		this.db = getDb(env);
		this.subscriptionPlansRepository = new SubscriptionPlansRepository(this.db);
		this.userSubscriptionsRepository = new UserSubscriptionsRepository(this.db);
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
	async subscribeUserToPlan(userId: string, planId: string, periodStart: string, periodEnd: string): Promise<{
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
			return { success: false, error: 'Failed to create subscription' };
		}
	}

	async upgradePlan(userId: string, newPlanId: string): Promise<{
		success: boolean;
		subscription?: SelectUserSubscription;
		error?: string;
	}> {
		try {
			// Get current active subscription
			const currentSubscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
			if (!currentSubscription) {
				return { success: false, error: 'No active subscription found' };
			}

			// Check if new plan exists and is active
			const newPlan = await this.subscriptionPlansRepository.findById(newPlanId);
			if (!newPlan || !newPlan.active) {
				return { success: false, error: 'New subscription plan not found or inactive' };
			}

			// Update subscription to new plan
			const updatedSubscription = await this.userSubscriptionsRepository.update(
				currentSubscription.id,
				{ planId: newPlanId }
			);

			return { success: true, subscription: updatedSubscription };
		} catch (error) {
			return { success: false, error: 'Failed to upgrade subscription' };
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

			const updatedSubscription = await this.userSubscriptionsRepository.update(
				subscriptionId,
				{
					currentPeriodStart: subscription.currentPeriodEnd,
					currentPeriodEnd: newPeriodEnd,
					status: 'active',
					cancelAtPeriodEnd: false
				}
			);

			return { success: true, subscription: updatedSubscription };
		} catch (error) {
			return { success: false, error: 'Failed to renew subscription' };
		}
	}

	async checkUserAccess(userId: string): Promise<{
		hasAccess: boolean;
		subscription?: SelectUserSubscription;
		plan?: SelectSubscriptionPlan;
	}> {
		const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
		if (!subscription) {
			return { hasAccess: false };
		}

		// Check if subscription is expired
		const now = new Date().toISOString();
		if (subscription.currentPeriodEnd < now) {
			return { hasAccess: false, subscription };
		}

		const plan = await this.subscriptionPlansRepository.findById(subscription.planId);
		return { 
			hasAccess: true, 
			subscription, 
			plan: plan || undefined 
		};
	}
}
