import {pgTable, text} from 'drizzle-orm/pg-core';
import { z } from '@hono/zod-openapi'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const locations = pgTable(
	'locations',
	{
		id: text('id').primaryKey(),
		latitude: text('latitude').notNull(),
		longitude: text('longitude').notNull(),
		altitude: text('altitude').notNull(),
		accuracy: text('accuracy').notNull(),
		bearing: text('bearing').notNull(),
		timestamp: text('timestamp').notNull(),
		userId: text('user_id').notNull(),
		subscriptionId: text('subscription_id').notNull(),
		createdAt: text('created_at').notNull().default(new Date().toISOString()),
		updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
	},
);

export const insertLocationsSchema = createInsertSchema(locations);
export const selectLocationsSchema = createSelectSchema(locations);
export type SelectLocation = z.infer<typeof selectLocationsSchema>;



