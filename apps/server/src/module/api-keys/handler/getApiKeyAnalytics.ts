import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';

const AnalyticsQuerySchema = z
  .object({
    keyId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['daily', 'monthly']).default('daily'),
  })
  .openapi('AnalyticsQuery');

const UsageStatsSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    totalRequests: z.number(),
    successfulRequests: z.number(),
    failedRequests: z.number(),
    averageResponseTime: z.number(),
    totalDataTransferred: z.number(),
    uniqueEndpoints: z.number(),
  })
  .openapi('UsageStats');

const GetAnalyticsResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(UsageStatsSchema),
  })
  .openapi('GetAnalyticsResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api-keys/analytics',
      tags: ['API Keys'],
      description: 'Get API key usage analytics for permitted API keys',
      middleware: [authMiddleware],
      request: {
        query: AnalyticsQuerySchema,
      },
      responses: {
        200: {
          description: 'API key analytics for permitted keys',
          content: {
            'application/json': { schema: GetAnalyticsResponseSchema },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
          },
        },
        403: {
          description: 'Forbidden - No permission to view analytics for specified API key',
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
      const permissionManager = await c.env.PERMISSION_MANAGER.newPermissionManager();

      // If a specific keyId is requested, check permission for that key
      if (keyId) {
        const permissionResult = await permissionManager.checkPermission({
          user: user.id,
          type: 'api_key',
          id: keyId,
          permission: 'usage_analytics',
          bypassCache: false,
        });

        if (!permissionResult.allowed) {
          throw new HTTPException(403, {
            message: 'You do not have permission to view analytics for this API key',
          });
        }
      }

      const analyticsManager = await c.env.ANALYTICS_SERVICE.analyticsManager();

      let result;
      if (type === 'monthly') {
        result = await analyticsManager.getMonthlyUsageStats(user.id, {
          apiKeyId: keyId,
          startMonth: startDate,
          endMonth: endDate,
        });
      } else {
        result = await analyticsManager.getDailyUsageStats(user.id, {
          apiKeyId: keyId,
          startDate,
          endDate,
        });
      }

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to get analytics' });
      }

      // If no specific keyId was requested, filter analytics results to only include permitted API keys
      let filteredAnalytics: any[] = result.data || [];

      if (!keyId && filteredAnalytics.length > 0) {
        // Get list of API keys the user has analytics permission for
        const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
        const userApiKeysResult = await apiKeyManager.getUserApiKeys(user.id);

        if (userApiKeysResult.success && userApiKeysResult.data) {
          const permittedKeyIds: string[] = [];

          // Check permission for each API key
          for (const key of userApiKeysResult.data) {
            try {
              const permissionResult = await permissionManager.checkPermission({
                user: user.id,
                type: 'api_key',
                id: key.id,
                permission: 'usage_analytics',
                bypassCache: false,
              });

              if (permissionResult.allowed) {
                permittedKeyIds.push(key.id);
              }
            } catch (error) {
              console.error(`Error checking analytics permission for API key ${key.id}:`, error);
            }
          }

          // Filter analytics to only include permitted API keys
          filteredAnalytics = filteredAnalytics.filter(
            (stat: any) => !stat.apiKeyId || permittedKeyIds.includes(stat.apiKeyId)
          );
        }
      }

      const analytics = filteredAnalytics.map((stat: any) => ({
        id: stat.id,
        date: type === 'monthly' ? stat.month || stat.date : stat.date,
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
          data: analytics,
        },
        200
      );
    }
  );
