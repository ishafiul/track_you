import { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, gte, lte } from 'drizzle-orm';
import { 
	userSubscriptions, 
	insertUserSubscriptionsSchema, 
	selectUserSubscriptionsSchema,
	updateUserSubscriptionsSchema 
} from '../../drizzle/schema';
import type { z } from 'zod';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

type InsertUserSubscription = z.infer<typeof insertUserSubscriptionsSchema>;
type SelectUserSubscription = z.infer<typeof selectUserSubscriptionsSchema>;
type UpdateUserSubscription = z.infer<typeof updateUserSubscriptionsSchema>;

export class UserSubscriptionsRepository {
	constructor(private db: LibSQLDatabase) {}

	async create(data: InsertUserSubscription): Promise<SelectUserSubscription> {
		const [result] = await this.db.insert(userSubscriptions).values(data).returning();
		return result;
	}

	async findById(id: string): Promise<SelectUserSubscription | undefined> {
		const [result] = await this.db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.id, id))
			.limit(1);
		return result;
	}

	async findByUserId(userId: string): Promise<SelectUserSubscription[]> {
		return await this.db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId));
	}

	async findActiveByUserId(userId: string): Promise<SelectUserSubscription | undefined> {
		const [result] = await this.db
			.select()
			.from(userSubscriptions)
			.where(and(
				eq(userSubscriptions.userId, userId),
				eq(userSubscriptions.status, 'active')
			))
			.limit(1);
		return result;
	}

	async findByPlanId(planId: string): Promise<SelectUserSubscription[]> {
		return await this.db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.planId, planId));
	}

	async findExpiring(beforeDate: string): Promise<SelectUserSubscription[]> {
		return await this.db
			.select()
			.from(userSubscriptions)
			.where(and(
				eq(userSubscriptions.status, 'active'),
				lte(userSubscriptions.currentPeriodEnd, beforeDate)
			));
	}

	async update(id: string, data: Partial<UpdateUserSubscription>): Promise<SelectUserSubscription | undefined> {
		const [result] = await this.db
			.update(userSubscriptions)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(userSubscriptions.id, id))
			.returning();
		return result;
	}

	async cancel(id: string, cancelAtPeriodEnd: boolean = true): Promise<SelectUserSubscription | undefined> {
		const updateData: Partial<UpdateUserSubscription> = {
			cancelAtPeriodEnd,
			updatedAt: new Date().toISOString()
		};

		if (!cancelAtPeriodEnd) {
			updateData.status = 'canceled';
		}

		return await this.update(id, updateData);
	}

	async reactivate(id: string): Promise<SelectUserSubscription | undefined> {
		return await this.update(id, {
			status: 'active',
			cancelAtPeriodEnd: false
		});
	}

	async delete(id: string): Promise<void> {
		await this.db
			.delete(userSubscriptions)
			.where(eq(userSubscriptions.id, id));
	}
} 