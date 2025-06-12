import { sql } from 'drizzle-orm';
import {
	integer,
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from '@hono/zod-openapi'

export const otps = sqliteTable(
	'otps',
	{
		id: text('id').primaryKey(),
		otp: integer('otp').notNull(),
		email: text('email').notNull(),
		deviceUuId: text('deviceUuId').notNull(),
		expiredAt: integer('expiredAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
	},
);
export const insertOtpSchema = createInsertSchema(otps);
export const selectOtpSchema = createSelectSchema(otps);

export const devices = sqliteTable(
	'devices',
	{
		id: text('id').primaryKey(),
		deviceType: text('device_type'),
		osName: text('os_name'),
		osVersion: text('os_version'),
		deviceModel: text('device_model'),
		isPhysicalDevice: text('is_physical_device'),
		appVersion: text('app_version'),
		ipAddress: text('ip_address'),
		city: text('city'),
		countryCode: text('country_code'),
		isp: text('isp'),
		colo: text('colo'),
		longitude: text('longitude'),
		latitude: text('latitude'),
		timezone: text('timezone'),
		fcmToken: text('fcmToken').unique(),
	},
);
export const InsertDevicesSchema = createInsertSchema(devices);
export const selectDevicesSchema = createSelectSchema(devices);

export const auths = sqliteTable(
	'auths',
	{
		id: text('id').primaryKey(),
		userId: text('userId').notNull(),
		deviceId: text('deviceId').notNull(),
		lastRefresh: integer('lastRefresh', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
	},
);
export const insertAuthsSchema = createInsertSchema(auths);
export const selectAuthsSchema = createSelectSchema(auths);
export type SelectAuth = z.infer<typeof selectAuthsSchema>;

