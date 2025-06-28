import { sql } from 'drizzle-orm/sql';
import {
	sqliteTable,
	text,
	integer,
	real,
} from 'drizzle-orm/sqlite-core';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';


export const subscriptionPlans = sqliteTable(
	'subscription_plans',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		price: real('price').notNull(),
		billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).notNull(),
		featuresJson: text('features_json').notNull(),
		apiRateLimit: integer('api_rate_limit').notNull(),
		maxRequestsPerMonth: integer('max_requests_per_month').notNull(),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);

export const insertSubscriptionPlansSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlansSchema = createSelectSchema(subscriptionPlans);
export const updateSubscriptionPlansSchema = createUpdateSchema(subscriptionPlans);

export const userSubscriptions = sqliteTable(
	'user_subscriptions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		planId: text('plan_id').notNull(),
		status: text('status', { enum: ['active', 'canceled', 'past_due', 'unpaid'] }).notNull(),
		currentPeriodStart: text('current_period_start').notNull(),
		currentPeriodEnd: text('current_period_end').notNull(),
		cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);

export const insertUserSubscriptionsSchema = createInsertSchema(userSubscriptions);
export const selectUserSubscriptionsSchema = createSelectSchema(userSubscriptions);
export const updateUserSubscriptionsSchema = createUpdateSchema(userSubscriptions);


