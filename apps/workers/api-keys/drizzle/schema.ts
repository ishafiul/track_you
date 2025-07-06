import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  permissions: text("permissions").notNull(), // JSON string of permissions
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUsed: integer("last_used", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const apiKeyUsage = sqliteTable("api_key_usage", {
  id: text("id").primaryKey(),
  apiKeyId: text("api_key_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  responseStatus: integer("response_status").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export const InsertApiKeySchema = createInsertSchema(apiKeys);
export const SelectApiKeySchema = createSelectSchema(apiKeys);
export const InsertApiKeyUsageSchema = createInsertSchema(apiKeyUsage);
export const SelectApiKeyUsageSchema = createSelectSchema(apiKeyUsage);

export type InsertApiKey = typeof apiKeys.$inferInsert;
export type SelectApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKeyUsage = typeof apiKeyUsage.$inferInsert;
export type SelectApiKeyUsage = typeof apiKeyUsage.$inferSelect; 