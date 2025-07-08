import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';

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
      description: 'Get detailed usage events for permitted API keys',
      middleware: [authMiddleware],
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
        403: {
          description: 'Forbidden - No permission to view events for this API key',
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

      try {
        const permissionManager = await c.env.PERMISSION_MANAGER.newPermissionManager();

        // If specific API key is requested, check permission for it
        if (apiKeyId) {
          const permissionResult = await permissionManager.checkPermission({
            user: user.id,
            type: 'api_key',
            id: apiKeyId,
            permission: 'usage_analytics',
            bypassCache: false,
          });

          if (!permissionResult.allowed) {
            throw new HTTPException(403, {
              message: 'You do not have permission to view events for this API key',
            });
          }
        }

        const analyticsManager = await c.env.ANALYTICS_SERVICE.analyticsManager();

        // Get all events
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

        let events = result.data || [];

        // If no specific API key was requested, filter events to only include permitted API keys
        if (!apiKeyId && events.length > 0) {
          const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
          const apiKeysResult = await apiKeyManager.getUserApiKeys(user.id);
          const allApiKeys = apiKeysResult.data || [];

          const permittedKeyIds: string[] = [];

          // Check permission for each API key
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
                permittedKeyIds.push(key.id);
              }
            } catch (error) {
              console.error(`Error checking analytics permission for API key ${key.id}:`, error);
            }
          }

          // Filter events to only include permitted API keys
          events = events.filter(
            (event) => !event.apiKeyId || permittedKeyIds.includes(event.apiKeyId)
          );
        }

        const formattedEvents = events.map((event) => ({
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
        }));

        return c.json(
          {
            success: true,
            data: formattedEvents,
            pagination: {
              limit: parseInt(limit) || 50,
              offset: parseInt(offset) || 0,
            },
          },
          200
        );
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        console.error('Error getting usage events:', error);
        throw new HTTPException(500, { message: 'Failed to get usage events' });
      }
    }
  );
