import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { apiKeyAuthMiddleware } from '../../../middleware/apiKeyAuth';

// Schema for location data
const InsertLocationSchema = z
  .object({
    latitude: z.string().min(1),
    longitude: z.string().min(1),
    altitude: z.string().min(1),
    accuracy: z.string().min(1),
    bearing: z.string().min(1),
    timestamp: z.string().min(1),
    subscriptionId: z.string().min(1),
  })
  .openapi('InsertLocationRequest');

// Response schema
const InsertLocationResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi('InsertLocationResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/location/insert',
      tags: ['Location'],
      description: 'Endpoint to insert a new location (API key required)',
      middleware: [apiKeyAuthMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: InsertLocationSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Location inserted successfully',
          content: {
            'application/json': { schema: InsertLocationResponseSchema },
          },
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
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

      const locationService = await c.env.LOCATION_SERVICE.newLocation();
      const bodyJson = await c.req.json();
      const body = InsertLocationSchema.parse(bodyJson);

      // Add user ID to location data
      const locationData = {
        ...body,
        userId: user.id,
      };

      const result = await locationService.insertLocation(locationData);

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to insert location' });
      }

      return c.json({ success: true, message: 'Location inserted successfully' }, 201);
    }
  );
