import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const UsageEventsQuerySchema = z
  .object({
    apiKeyId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
  })
  .openapi('UsageEventsQuery');

const UsageEventSchema = z
  .object({
    id: z.string(),
    apiKeyId: z.string(),
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    responseTime: z.number(),
    requestSize: z.number().nullable(),
    responseSize: z.number().nullable(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
    timestamp: z.string(),
    metadata: z.record(z.unknown()).nullable(),
  })
  .openapi('UsageEvent');

const GetUsageEventsResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(UsageEventSchema),
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      total: z.number().optional(),
    }),
  })
  .openapi('GetUsageEventsResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/analytics/usage-events',
      tags: ['Analytics'],
      description: 'Get detailed usage events for API keys',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'usage_analytics', (c) => c.get('user')?.id || ''),
      ],
      request: {
        query: UsageEventsQuerySchema,
      },
      responses: {
        200: {
          description: 'Usage events retrieved successfully',
          content: {
            'application/json': { schema: GetUsageEventsResponseSchema },
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

      const { apiKeyId, startDate, endDate, limit, offset } = c.req.query();

      const analyticsManager = await c.env.ANALYTICS_SERVICE.analyticsManager();
      const result = await analyticsManager.getUserUsageEvents(user.id, {
        apiKeyId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to get usage events' });
      }

      const events =
        result.data?.map((event) => ({
          id: event.id,
          apiKeyId: event.apiKeyId,
          endpoint: event.endpoint,
          method: event.method,
          statusCode: event.statusCode,
          responseTime: event.responseTime,
          requestSize: event.requestSize,
          responseSize: event.responseSize,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          timestamp: event.timestamp.toISOString(),
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
        })) || [];

      return c.json(
        {
          success: true,
          data: events,
          pagination: {
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0,
          },
        },
        200
      );
    }
  );
