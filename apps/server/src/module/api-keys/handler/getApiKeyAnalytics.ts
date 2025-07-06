import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

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
      description: 'Get API key usage analytics',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'usage_analytics', (c) => c.get('user')?.id || ''),
      ],
      request: {
        query: AnalyticsQuerySchema,
      },
      responses: {
        200: {
          description: 'API key analytics',
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

      const analytics =
        result.data?.map((stat: any) => ({
          id: stat.id,
          date: type === 'monthly' ? stat.month : stat.date,
          totalRequests: stat.totalRequests,
          successfulRequests: stat.successfulRequests,
          failedRequests: stat.failedRequests,
          averageResponseTime: stat.averageResponseTime,
          totalDataTransferred: stat.totalDataTransferred,
          uniqueEndpoints: stat.uniqueEndpoints,
        })) || [];

      return c.json(
        {
          success: true,
          data: analytics,
        },
        200
      );
    }
  );
