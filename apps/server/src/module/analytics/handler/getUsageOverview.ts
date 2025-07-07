import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const UsageOverviewQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '90d']).default('30d'),
  })
  .openapi('UsageOverviewQuery');

const UsageOverviewSchema = z
  .object({
    period: z.string(),
    totalApiKeys: z.number(),
    totalRequests: z.number(),
    successfulRequests: z.number(),
    failedRequests: z.number(),
    successRate: z.number(),
    averageResponseTime: z.number(),
    totalDataTransferred: z.number(),
    dailyBreakdown: z.array(
      z.object({
        date: z.string(),
        requests: z.number(),
        successRate: z.number(),
        averageResponseTime: z.number(),
      })
    ),
    topApiKeys: z.array(
      z.object({
        keyId: z.string(),
        keyName: z.string(),
        requests: z.number(),
        percentage: z.number(),
      })
    ),
    statusCodeBreakdown: z.array(
      z.object({
        statusCode: z.number(),
        count: z.number(),
        percentage: z.number(),
      })
    ),
  })
  .openapi('UsageOverview');

const GetUsageOverviewResponseSchema = z
  .object({
    success: z.boolean(),
    data: UsageOverviewSchema,
  })
  .openapi('GetUsageOverviewResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/analytics/overview',
      tags: ['Analytics'],
      description: 'Get comprehensive usage analytics overview',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'usage_analytics', (c) => c.get('user')?.id || ''),
      ],
      request: {
        query: UsageOverviewQuerySchema,
      },
      responses: {
        200: {
          description: 'Usage overview retrieved successfully',
          content: {
            'application/json': { schema: GetUsageOverviewResponseSchema },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
          },
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
          },
        },
      },
    }),
    async (c: HonoContext) => {
      const user = c.get('user');
      if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

      const { period } = c.req.query();

      try {
        const [apiKeyManager, analyticsManager] = await Promise.all([
          c.env.API_KEY_SERVICE.apiKeyManager(),
          c.env.ANALYTICS_SERVICE.analyticsManager(),
        ]);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
        }

        // Get API keys
        const apiKeysResult = await apiKeyManager.getUserApiKeys(user.id);
        const apiKeys = apiKeysResult.data || [];
        const totalApiKeys = apiKeys.length;

        // Get daily stats for the period
        const dailyStatsResult = await analyticsManager.getDailyUsageStats(user.id, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });

        const dailyStats = dailyStatsResult.data || [];

        // Calculate totals
        const totalRequests = dailyStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
        const successfulRequests = dailyStats.reduce(
          (sum, stat) => sum + stat.successfulRequests,
          0
        );
        const failedRequests = dailyStats.reduce((sum, stat) => sum + stat.failedRequests, 0);
        const totalResponseTime = dailyStats.reduce(
          (sum, stat) => sum + stat.averageResponseTime * stat.totalRequests,
          0
        );
        const totalDataTransferred = dailyStats.reduce(
          (sum, stat) => sum + stat.totalDataTransferred,
          0
        );

        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
        const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

        // Get daily breakdown
        const dailyBreakdown = dailyStats.map((stat) => ({
          date: stat.date,
          requests: stat.totalRequests,
          successRate:
            stat.totalRequests > 0 ? (stat.successfulRequests / stat.totalRequests) * 100 : 0,
          averageResponseTime: stat.averageResponseTime,
        }));

        // Get API key breakdown
        const apiKeyStatsMap = new Map<string, { requests: number; name: string }>();
        dailyStats.forEach((stat) => {
          const current = apiKeyStatsMap.get(stat.apiKeyId) || { requests: 0, name: '' };
          const apiKey = apiKeys.find((key) => key.id === stat.apiKeyId);
          apiKeyStatsMap.set(stat.apiKeyId, {
            requests: current.requests + stat.totalRequests,
            name: apiKey?.name || 'Unknown',
          });
        });

        const topApiKeys = Array.from(apiKeyStatsMap.entries())
          .sort((a, b) => b[1].requests - a[1].requests)
          .slice(0, 10)
          .map(([keyId, data]) => ({
            keyId,
            keyName: data.name,
            requests: data.requests,
            percentage: totalRequests > 0 ? (data.requests / totalRequests) * 100 : 0,
          }));

        // Get recent events for status code breakdown
        const recentEventsResult = await analyticsManager.getUserUsageEvents(user.id, {
          startDate,
          endDate,
          limit: 10000, // Get more events for better analysis
        });

        const recentEvents = recentEventsResult.data || [];
        const statusCodeMap = new Map<number, number>();
        recentEvents.forEach((event) => {
          const count = statusCodeMap.get(event.statusCode) || 0;
          statusCodeMap.set(event.statusCode, count + 1);
        });

        const statusCodeBreakdown = Array.from(statusCodeMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([statusCode, count]) => ({
            statusCode,
            count,
            percentage: recentEvents.length > 0 ? (count / recentEvents.length) * 100 : 0,
          }));

        return c.json(
          {
            success: true,
            data: {
              period,
              totalApiKeys,
              totalRequests,
              successfulRequests,
              failedRequests,
              successRate: Math.round(successRate * 100) / 100,
              averageResponseTime: Math.round(averageResponseTime * 100) / 100,
              totalDataTransferred,
              dailyBreakdown,
              topApiKeys,
              statusCodeBreakdown,
            },
          },
          200
        );
      } catch (error) {
        console.error('Error getting usage overview:', error);
        throw new HTTPException(500, { message: 'Failed to get usage overview' });
      }
    }
  );
