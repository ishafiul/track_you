import { sql } from 'drizzle-orm/sql';
import {
	sqliteTable,
	text,
	integer,
	real,
} from 'drizzle-orm/sqlite-core';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';

// Main subscription plans table - contains features and limits
export const subscriptionPlans = sqliteTable(
	'subscription_plans',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		featuresJson: text('features_json').notNull(),
		apiRateLimit: integer('api_rate_limit').notNull(),
		maxRequestsPerMonth: integer('max_requests_per_month').notNull(),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		stripeProductId: text('stripe_product_id'),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);

// Plan pricing table - contains pricing for different billing cycles
export const planPricing = sqliteTable(
	'plan_pricing',
	{
		id: text('id').primaryKey(),
		planId: text('plan_id').notNull().references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
		billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).notNull(),
		price: real('price').notNull(),
		stripePriceId: text('stripe_price_id'),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);

// User subscriptions table - references plan and billing cycle
export const userSubscriptions = sqliteTable(
	'user_subscriptions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		planId: text('plan_id').notNull().references(() => subscriptionPlans.id),
		billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).notNull(),
		status: text('status', { enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'] }).notNull(),
		currentPeriodStart: text('current_period_start').notNull(),
		currentPeriodEnd: text('current_period_end').notNull(),
		cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
		stripeSubscriptionId: text('stripe_subscription_id'),
		stripeCustomerId: text('stripe_customer_id'),
		stripePaymentLinkId: text('stripe_payment_link_id'),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);

// Schema exports for subscription plans
export const insertSubscriptionPlansSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlansSchema = createSelectSchema(subscriptionPlans);
export const updateSubscriptionPlansSchema = createUpdateSchema(subscriptionPlans);

// Schema exports for plan pricing
export const insertPlanPricingSchema = createInsertSchema(planPricing);
export const selectPlanPricingSchema = createSelectSchema(planPricing);
export const updatePlanPricingSchema = createUpdateSchema(planPricing);

// Schema exports for user subscriptions
export const insertUserSubscriptionsSchema = createInsertSchema(userSubscriptions);
export const selectUserSubscriptionsSchema = createSelectSchema(userSubscriptions);
export const updateUserSubscriptionsSchema = createUpdateSchema(userSubscriptions);


