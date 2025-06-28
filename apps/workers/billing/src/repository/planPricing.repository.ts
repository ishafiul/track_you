import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { 
  planPricing, 
  insertPlanPricingSchema, 
  selectPlanPricingSchema,
  updatePlanPricingSchema
} from '../../drizzle/schema';
import { z } from 'zod';

type InsertPlanPricing = z.infer<typeof insertPlanPricingSchema>;
type SelectPlanPricing = z.infer<typeof selectPlanPricingSchema>;
type UpdatePlanPricing = z.infer<typeof updatePlanPricingSchema>;

export class PlanPricingRepository {
  constructor(private db: LibSQLDatabase) {}

  async create(pricingData: InsertPlanPricing): Promise<SelectPlanPricing> {
    const [pricing] = await this.db.insert(planPricing).values(pricingData).returning();
    return pricing;
  }

  async findById(id: string): Promise<SelectPlanPricing | null> {
    const [pricing] = await this.db.select().from(planPricing).where(eq(planPricing.id, id));
    return pricing || null;
  }

  async findByPlanId(planId: string): Promise<SelectPlanPricing[]> {
    return await this.db.select().from(planPricing).where(eq(planPricing.planId, planId));
  }

  async findByPlanAndCycle(planId: string, billingCycle: 'monthly' | 'yearly'): Promise<SelectPlanPricing | null> {
    const [pricing] = await this.db
      .select()
      .from(planPricing)
      .where(
        and(
          eq(planPricing.planId, planId),
          eq(planPricing.billingCycle, billingCycle)
        )
      );
    return pricing || null;
  }

  async findActivePricing(): Promise<SelectPlanPricing[]> {
    return await this.db.select().from(planPricing).where(eq(planPricing.active, true));
  }

  async update(id: string, updateData: Partial<UpdatePlanPricing>): Promise<SelectPlanPricing | null> {
    const [pricing] = await this.db
      .update(planPricing)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(planPricing.id, id))
      .returning();
    return pricing || null;
  }

  async deactivate(id: string): Promise<SelectPlanPricing | null> {
    return this.update(id, { active: false });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(planPricing).where(eq(planPricing.id, id));
  }

  async deleteByPlanId(planId: string): Promise<void> {
    await this.db.delete(planPricing).where(eq(planPricing.planId, planId));
  }
} 