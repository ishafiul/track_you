import { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { 
	subscriptionPlans, 
	insertSubscriptionPlansSchema, 
	selectSubscriptionPlansSchema,
	updateSubscriptionPlansSchema 
} from '../../drizzle/schema';
import type { z } from 'zod';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlansSchema>;
type SelectSubscriptionPlan = z.infer<typeof selectSubscriptionPlansSchema>;
type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlansSchema>;

export class SubscriptionPlansRepository {
	constructor(private db: LibSQLDatabase) {}

	async create(data: InsertSubscriptionPlan): Promise<SelectSubscriptionPlan> {
		const [result] = await this.db.insert(subscriptionPlans).values(data).returning();
		return result;
	}

	async findById(id: string): Promise<SelectSubscriptionPlan | undefined> {
		const [result] = await this.db
			.select()
			.from(subscriptionPlans)
			.where(eq(subscriptionPlans.id, id))
			.limit(1);
		return result;
	}

	async findAll(): Promise<SelectSubscriptionPlan[]> {
		return await this.db.select().from(subscriptionPlans);
	}

	async findActive(): Promise<SelectSubscriptionPlan[]> {
		return await this.db
			.select()
			.from(subscriptionPlans)
			.where(eq(subscriptionPlans.active, true));
	}

	async update(id: string, data: Partial<UpdateSubscriptionPlan>): Promise<SelectSubscriptionPlan | undefined> {
		const [result] = await this.db
			.update(subscriptionPlans)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(subscriptionPlans.id, id))
			.returning();
		return result;
	}

	async delete(id: string): Promise<void> {
		await this.db
			.delete(subscriptionPlans)
			.where(eq(subscriptionPlans.id, id));
	}

	async deactivate(id: string): Promise<SelectSubscriptionPlan | undefined> {
		return await this.update(id, { active: false });
	}
} 