import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';

const DashboardStatsSchema = z
  .object({
    totalApiKeys: z.number(),
    activeApiKeys: z.number(),
    totalRequests: z.number(),
    requestsToday: z.number(),
    requestsThisMonth: z.number(),
    successRate: z.number(),
    averageResponseTime: z.number(),
    topEndpoints: z.array(
      z.object({
        endpoint: z.string(),
        requests: z.number(),
        percentage: z.number(),
      })
    ),
    recentUsage: z.array(
      z.object({
        date: z.string(),
        requests: z.number(),
        errors: z.number(),
      })
    ),
  })
  .openapi('DashboardStats');

const GetDashboardResponseSchema = z
  .object({
    success: z.boolean(),
    data: DashboardStatsSchema,
  })
  .openapi('GetDashboardResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/analytics/dashboard',
      tags: ['Analytics'],
      description: 'Get dashboard analytics overview for permitted API keys',
      middleware: [authMiddleware],
      responses: {
        200: {
          description: 'Dashboard analytics retrieved successfully',
          content: {
            'application/json': { schema: GetDashboardResponseSchema },
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

      try {
        const [apiKeyManager, analyticsManager] = await Promise.all([
          c.env.API_KEY_SERVICE.apiKeyManager(),
          c.env.ANALYTICS_SERVICE.analyticsManager(),
        ]);

        // Get user's API keys and filter by permission
        const apiKeysResult = await apiKeyManager.getUserApiKeys(user.id);
        const allApiKeys = apiKeysResult.data || [];

        const permissionManager = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const permittedApiKeys = [];

        // Filter API keys based on analytics permissions
        for (const key of allApiKeys) {
          try {
            const permissionResult = await permissionManager.checkPermission({
              user: user.id,
              type: 'api_key',
              id: key.id,
              permission: 'usage_analytics',
              bypassCache: false,
            });

            if (permissionResult.allowed) {
              permittedApiKeys.push(key);
            }
          } catch (error) {
            console.error(`Error checking analytics permission for API key ${key.id}:`, error);
          }
        }

        const totalApiKeys = permittedApiKeys.length;
        const activeApiKeys = permittedApiKeys.filter((key) => key.isActive).length;

        // Get recent daily stats (last 7 days) - only for permitted keys
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);

        const dailyStatsResult = await analyticsManager.getDailyUsageStats(user.id, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });

        let dailyStats = dailyStatsResult.data || [];

        // Filter daily stats to only include permitted API keys
        const permittedKeyIds = permittedApiKeys.map((key) => key.id);
        dailyStats = dailyStats.filter(
          (stat) => !stat.apiKeyId || permittedKeyIds.includes(stat.apiKeyId)
        );

        // Calculate totals
        const totalRequests = dailyStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
        const totalSuccessful = dailyStats.reduce((sum, stat) => sum + stat.successfulRequests, 0);
        const totalFailed = dailyStats.reduce((sum, stat) => sum + stat.failedRequests, 0);
        const totalResponseTime = dailyStats.reduce(
          (sum, stat) => sum + stat.averageResponseTime * stat.totalRequests,
          0
        );

        const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;
        const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

        // Get today's requests
        const today = new Date().toISOString().split('T')[0];
        const todayStats = dailyStats.find((stat) => stat.date === today);
        const requestsToday = todayStats?.totalRequests || 0;

        // Get this month's requests
        const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        const monthlyStatsResult = await analyticsManager.getMonthlyUsageStats(user.id, {
          startMonth: thisMonth,
          endMonth: thisMonth,
        });

        let monthlyStats = monthlyStatsResult.data || [];
        // Filter monthly stats to only include permitted API keys
        monthlyStats = monthlyStats.filter(
          (stat) => !stat.apiKeyId || permittedKeyIds.includes(stat.apiKeyId)
        );

        const requestsThisMonth = monthlyStats.reduce((sum, stat) => sum + stat.totalRequests, 0);

        // Get recent usage events to build top endpoints - only for permitted API keys
        const recentEventsResult = await analyticsManager.getUserUsageEvents(user.id, {
          limit: 1000, // Get more events for better endpoint analysis
        });
        let recentEvents = recentEventsResult.data || [];

        // Filter events to only include permitted API keys
        recentEvents = recentEvents.filter(
          (event) => !event.apiKeyId || permittedKeyIds.includes(event.apiKeyId)
        );

        // Calculate top endpoints
        const endpointMap = new Map<string, number>();
        recentEvents.forEach((event) => {
          const count = endpointMap.get(event.endpoint) || 0;
          endpointMap.set(event.endpoint, count + 1);
        });

        const topEndpoints = Array.from(endpointMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([endpoint, requests]) => ({
            endpoint,
            requests,
            percentage: totalRequests > 0 ? (requests / totalRequests) * 100 : 0,
          }));

        // Build recent usage data
        const recentUsage = dailyStats
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((stat) => ({
            date: stat.date,
            requests: stat.totalRequests,
            errors: stat.failedRequests,
          }));

        return c.json(
          {
            success: true,
            data: {
              totalApiKeys,
              activeApiKeys,
              totalRequests,
              requestsToday,
              requestsThisMonth,
              successRate: Math.round(successRate * 100) / 100,
              averageResponseTime: Math.round(averageResponseTime * 100) / 100,
              topEndpoints,
              recentUsage,
            },
          },
          200
        );
      } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        throw new HTTPException(500, { message: 'Failed to get dashboard analytics' });
      }
    }
  );
