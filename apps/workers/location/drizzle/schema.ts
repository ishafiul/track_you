import { sql } from 'drizzle-orm/sql';
import {
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';


export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull().unique(),
		firstName: text('first_name'),
		lastName: text('last_name'),
		phone: text('phone'),
		address: text('address'),
		city: text('city'),
		state: text('state'),
		zip: text('zip'),
		country: text('country'),
		avatar: text('avatar'),
		role: text('role',{ enum: ['user', 'admin'] }).notNull().default('user'),
		createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
	},
);
export const insertUsersSchema = createInsertSchema(users);
export const selectUsersSchema = createSelectSchema(users);
export const updateUsersSchema = createUpdateSchema(users);


