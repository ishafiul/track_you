import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, desc, sql, between, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { Bindings } from "../config/bindings";
import {
  apiUsageEvents,
  dailyUsageStats,
  InsertApiUsageEvent,
  InsertDailyUsageStats,
  InsertMonthlyUsageStats,
  monthlyUsageStats,
  SelectApiUsageEvent,
  SelectDailyUsageStats,
  SelectMonthlyUsageStats,
} from "../../drizzle/schema";
import { RpcTarget } from "cloudflare:workers";

export class AnalyticsManager extends RpcTarget {
  private db: ReturnType<typeof drizzle>;

  constructor(private env: Bindings) {
    super();
    const client = createClient({
      url: env.TURSO_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    this.db = drizzle(client);
  }

  // Track API usage event
  async trackApiUsage(params: {
    userId: string;
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    requestSize?: number;
    responseSize?: number;
    userAgent?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const usageEvent: InsertApiUsageEvent = {
        id: uuidv4(),
        userId: params.userId,
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        requestSize: params.requestSize || null,
        responseSize: params.responseSize || null,
        userAgent: params.userAgent || null,
        ipAddress: params.ipAddress || null,
        timestamp: new Date(),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      };

      await this.db.insert(apiUsageEvents).values(usageEvent);

      // Trigger daily stats aggregation
      await this.aggregateDailyStats(params.userId, params.apiKeyId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track API usage",
      };
    }
  }

  // Get usage events for a user
  async getUserUsageEvents(
    userId: string,
    params?: {
      apiKeyId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ success: boolean; data?: SelectApiUsageEvent[]; error?: string }> {
    try {
      const conditions = [eq(apiUsageEvents.userId, userId)];

      if (params?.apiKeyId) {
        conditions.push(eq(apiUsageEvents.apiKeyId, params.apiKeyId));
      }

      if (params?.startDate && params?.endDate) {
        conditions.push(between(apiUsageEvents.timestamp, params.startDate, params.endDate));
      }

      // Build the query without intermediate variables to avoid type issues
      const baseQuery = this.db
        .select()
        .from(apiUsageEvents)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(apiUsageEvents.timestamp));

      // Execute query with limit and offset if provided
      let result;
      if (params?.limit !== undefined && params?.offset !== undefined) {
        result = await baseQuery.limit(params.limit).offset(params.offset);
      } else if (params?.limit !== undefined) {
        result = await baseQuery.limit(params.limit);
      } else if (params?.offset !== undefined) {
        result = await baseQuery.offset(params.offset);
      } else {
        result = await baseQuery;
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get usage events",
      };
    }
  }

  // Get daily usage statistics
  async getDailyUsageStats(
    userId: string,
    params?: {
      apiKeyId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ success: boolean; data?: SelectDailyUsageStats[]; error?: string }> {
    try {
      const conditions = [eq(dailyUsageStats.userId, userId)];

      if (params?.apiKeyId) {
        conditions.push(eq(dailyUsageStats.apiKeyId, params.apiKeyId));
      }

      if (params?.startDate && params?.endDate) {
        conditions.push(gte(dailyUsageStats.date, params.startDate));
        conditions.push(lte(dailyUsageStats.date, params.endDate));
      }

      const result = await this.db
        .select()
        .from(dailyUsageStats)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(dailyUsageStats.date));

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get daily usage stats",
      };
    }
  }

  // Get monthly usage statistics
  async getMonthlyUsageStats(
    userId: string,
    params?: {
      apiKeyId?: string;
      startMonth?: string;
      endMonth?: string;
    }
  ): Promise<{ success: boolean; data?: SelectMonthlyUsageStats[]; error?: string }> {
    try {
      const conditions = [eq(monthlyUsageStats.userId, userId)];

      if (params?.apiKeyId) {
        conditions.push(eq(monthlyUsageStats.apiKeyId, params.apiKeyId));
      }

      if (params?.startMonth && params?.endMonth) {
        conditions.push(gte(monthlyUsageStats.month, params.startMonth));
        conditions.push(lte(monthlyUsageStats.month, params.endMonth));
      }

      const result = await this.db
        .select()
        .from(monthlyUsageStats)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(monthlyUsageStats.month));

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get monthly usage stats",
      };
    }
  }

  // Aggregate daily statistics
  private async aggregateDailyStats(userId: string, apiKeyId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0]!; // YYYY-MM-DD format, non-null assertion since split always returns array

      const stats = await this.db
        .select({
          totalRequests: sql<number>`count(*)`,
          successfulRequests: sql<number>`count(case when ${apiUsageEvents.statusCode} >= 200 and ${apiUsageEvents.statusCode} < 300 then 1 end)`,
          failedRequests: sql<number>`count(case when ${apiUsageEvents.statusCode} >= 400 then 1 end)`,
          averageResponseTime: sql<number>`avg(${apiUsageEvents.responseTime})`,
          totalDataTransferred: sql<number>`sum(coalesce(${apiUsageEvents.requestSize}, 0) + coalesce(${apiUsageEvents.responseSize}, 0))`,
          uniqueEndpoints: sql<number>`count(distinct ${apiUsageEvents.endpoint})`,
        })
        .from(apiUsageEvents)
        .where(
          and(
            eq(apiUsageEvents.userId, userId),
            eq(apiUsageEvents.apiKeyId, apiKeyId),
            sql`date(${apiUsageEvents.timestamp}) = ${today}`
          )
        );

      if (stats && stats.length > 0 && stats[0]) {
        const firstStat = stats[0];
        const dailyStats: InsertDailyUsageStats = {
          id: uuidv4(),
          userId,
          apiKeyId,
          date: today,
          totalRequests: firstStat.totalRequests ?? 0,
          successfulRequests: firstStat.successfulRequests ?? 0,
          failedRequests: firstStat.failedRequests ?? 0,
          averageResponseTime: firstStat.averageResponseTime ?? 0,
          totalDataTransferred: firstStat.totalDataTransferred ?? 0,
          uniqueEndpoints: firstStat.uniqueEndpoints ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert or update daily stats
        await this.db.insert(dailyUsageStats).values(dailyStats).onConflictDoNothing();
      }
    } catch (error) {
      console.error("Error aggregating daily stats:", error);
    }
  }

  // Aggregate monthly statistics (to be called by cron job)
  async aggregateMonthlyStats(userId: string, apiKeyId: string, month: string): Promise<void> {
    try {
      const stats = await this.db
        .select({
          totalRequests: sql<number>`sum(${dailyUsageStats.totalRequests})`,
          successfulRequests: sql<number>`sum(${dailyUsageStats.successfulRequests})`,
          failedRequests: sql<number>`sum(${dailyUsageStats.failedRequests})`,
          averageResponseTime: sql<number>`avg(${dailyUsageStats.averageResponseTime})`,
          totalDataTransferred: sql<number>`sum(${dailyUsageStats.totalDataTransferred})`,
          uniqueEndpoints: sql<number>`max(${dailyUsageStats.uniqueEndpoints})`,
        })
        .from(dailyUsageStats)
        .where(
          and(
            eq(dailyUsageStats.userId, userId),
            eq(dailyUsageStats.apiKeyId, apiKeyId),
            sql`strftime('%Y-%m', ${dailyUsageStats.date}) = ${month}`
          )
        );

      if (stats && stats.length > 0 && stats[0]) {
        const firstStat = stats[0];
        const monthlyStats: InsertMonthlyUsageStats = {
          id: uuidv4(),
          userId,
          apiKeyId,
          month,
          totalRequests: firstStat.totalRequests ?? 0,
          successfulRequests: firstStat.successfulRequests ?? 0,
          failedRequests: firstStat.failedRequests ?? 0,
          averageResponseTime: firstStat.averageResponseTime ?? 0,
          totalDataTransferred: firstStat.totalDataTransferred ?? 0,
          uniqueEndpoints: firstStat.uniqueEndpoints ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert or update monthly stats
        await this.db.insert(monthlyUsageStats).values(monthlyStats).onConflictDoNothing();
      }
    } catch (error) {
      console.error("Error aggregating monthly stats:", error);
    }
  }
}
