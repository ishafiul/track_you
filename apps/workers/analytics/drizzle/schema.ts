import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const apiUsageEvents = sqliteTable("api_usage_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  apiKeyId: text("api_key_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: real("response_time").notNull(), // in milliseconds
  requestSize: integer("request_size"), // in bytes
  responseSize: integer("response_size"), // in bytes
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  metadata: text("metadata"), // JSON string for additional data
});

export const dailyUsageStats = sqliteTable("daily_usage_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  apiKeyId: text("api_key_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalRequests: integer("total_requests").notNull().default(0),
  successfulRequests: integer("successful_requests").notNull().default(0),
  failedRequests: integer("failed_requests").notNull().default(0),
  averageResponseTime: real("average_response_time").notNull().default(0),
  totalDataTransferred: integer("total_data_transferred").notNull().default(0), // in bytes
  uniqueEndpoints: integer("unique_endpoints").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const monthlyUsageStats = sqliteTable("monthly_usage_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  apiKeyId: text("api_key_id").notNull(),
  month: text("month").notNull(), // YYYY-MM format
  totalRequests: integer("total_requests").notNull().default(0),
  successfulRequests: integer("successful_requests").notNull().default(0),
  failedRequests: integer("failed_requests").notNull().default(0),
  averageResponseTime: real("average_response_time").notNull().default(0),
  totalDataTransferred: integer("total_data_transferred").notNull().default(0), // in bytes
  uniqueEndpoints: integer("unique_endpoints").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const InsertApiUsageEventSchema = createInsertSchema(apiUsageEvents);
export const SelectApiUsageEventSchema = createSelectSchema(apiUsageEvents);
export const InsertDailyUsageStatsSchema = createInsertSchema(dailyUsageStats);
export const SelectDailyUsageStatsSchema = createSelectSchema(dailyUsageStats);
export const InsertMonthlyUsageStatsSchema = createInsertSchema(monthlyUsageStats);
export const SelectMonthlyUsageStatsSchema = createSelectSchema(monthlyUsageStats);

export type InsertApiUsageEvent = typeof apiUsageEvents.$inferInsert;
export type SelectApiUsageEvent = typeof apiUsageEvents.$inferSelect;
export type InsertDailyUsageStats = typeof dailyUsageStats.$inferInsert;
export type SelectDailyUsageStats = typeof dailyUsageStats.$inferSelect;
export type InsertMonthlyUsageStats = typeof monthlyUsageStats.$inferInsert;
export type SelectMonthlyUsageStats = typeof monthlyUsageStats.$inferSelect;
