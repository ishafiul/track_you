import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const ApiKeyUsageQuerySchema = z
  .object({
    keyId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['daily', 'monthly']).default('daily'),
  })
  .openapi('ApiKeyUsageQuery');

const ApiKeyUsageStatsSchema = z
  .object({
    apiKeyId: z.string(),
    apiKeyName: z.string(),
    stats: z.array(
      z.object({
        date: z.string(),
        totalRequests: z.number(),
        successfulRequests: z.number(),
        failedRequests: z.number(),
        averageResponseTime: z.number(),
        totalDataTransferred: z.number(),
        uniqueEndpoints: z.number(),
      })
    ),
    summary: z.object({
      totalRequests: z.number(),
      successRate: z.number(),
      averageResponseTime: z.number(),
      totalDataTransferred: z.number(),
      uniqueEndpoints: z.number(),
    }),
  })
  .openapi('ApiKeyUsageStats');

const GetApiKeyUsageResponseSchema = z
  .object({
    success: z.boolean(),
    data: ApiKeyUsageStatsSchema,
  })
  .openapi('GetApiKeyUsageResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/analytics/api-key-usage',
      tags: ['Analytics'],
      description: 'Get detailed usage analytics for a specific API key',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'usage_analytics', (c) => c.get('user')?.id || ''),
      ],
      request: {
        query: ApiKeyUsageQuerySchema,
      },
      responses: {
        200: {
          description: 'API key usage analytics retrieved successfully',
          content: {
            'application/json': { schema: GetApiKeyUsageResponseSchema },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
          },
        },
        404: {
          description: 'API key not found',
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

      const { keyId, startDate, endDate, type } = c.req.query();

      try {
        const [apiKeyManager, analyticsManager] = await Promise.all([
          c.env.API_KEY_SERVICE.apiKeyManager(),
          c.env.ANALYTICS_SERVICE.analyticsManager(),
        ]);

        // Verify API key belongs to user
        const apiKeysResult = await apiKeyManager.getUserApiKeys(user.id);
        const apiKeys = apiKeysResult.data || [];
        const apiKey = apiKeys.find((key) => key.id === keyId);

        if (!apiKey) {
          throw new HTTPException(404, { message: 'API key not found' });
        }

        // Get usage stats
        let statsResult;
        if (type === 'monthly') {
          statsResult = await analyticsManager.getMonthlyUsageStats(user.id, {
            apiKeyId: keyId,
            startMonth: startDate,
            endMonth: endDate,
          });
        } else {
          statsResult = await analyticsManager.getDailyUsageStats(user.id, {
            apiKeyId: keyId,
            startDate,
            endDate,
          });
        }

        if (!statsResult.success) {
          throw new HTTPException(500, {
            message: statsResult.error || 'Failed to get usage stats',
          });
        }

        const stats = statsResult.data || [];

        // Calculate summary
        const totalRequests = stats.reduce((sum, stat) => sum + stat.totalRequests, 0);
        const totalSuccessful = stats.reduce((sum, stat) => sum + stat.successfulRequests, 0);
        const totalFailed = stats.reduce((sum, stat) => sum + stat.failedRequests, 0);
        const totalResponseTime = stats.reduce(
          (sum, stat) => sum + stat.averageResponseTime * stat.totalRequests,
          0
        );
        const totalDataTransferred = stats.reduce(
          (sum, stat) => sum + stat.totalDataTransferred,
          0
        );
        const maxUniqueEndpoints = Math.max(...stats.map((stat) => stat.uniqueEndpoints), 0);

        const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;
        const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

        const formattedStats = stats.map((stat) => ({
          date: type === 'monthly' ? (stat as any).month : (stat as any).date,
          totalRequests: stat.totalRequests,
          successfulRequests: stat.successfulRequests,
          failedRequests: stat.failedRequests,
          averageResponseTime: stat.averageResponseTime,
          totalDataTransferred: stat.totalDataTransferred,
          uniqueEndpoints: stat.uniqueEndpoints,
        }));

        return c.json(
          {
            success: true,
            data: {
              apiKeyId: keyId,
              apiKeyName: apiKey.name,
              stats: formattedStats,
              summary: {
                totalRequests,
                successRate: Math.round(successRate * 100) / 100,
                averageResponseTime: Math.round(averageResponseTime * 100) / 100,
                totalDataTransferred,
                uniqueEndpoints: maxUniqueEndpoints,
              },
            },
          },
          200
        );
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        console.error('Error getting API key usage analytics:', error);
        throw new HTTPException(500, { message: 'Failed to get API key usage analytics' });
      }
    }
  );
