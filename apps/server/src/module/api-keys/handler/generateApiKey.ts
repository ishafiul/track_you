import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const GenerateApiKeySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
    expiresAt: z.string().optional(),
  })
  .openapi('GenerateApiKeyRequest');

const GenerateApiKeyResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.object({
      keyId: z.string(),
      apiKey: z.string(),
      name: z.string(),
      permissions: z.array(z.string()),
      expiresAt: z.string().nullable(),
    }),
  })
  .openapi('GenerateApiKeyResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api-keys/generate',
      tags: ['API Keys'],
      description: 'Generate a new API key (requires active subscription)',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'api_key_create', (c) => c.get('user')?.id || ''),
      ],
      request: {
        body: {
          content: {
            'application/json': {
              schema: GenerateApiKeySchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'API key generated successfully',
          content: {
            'application/json': { schema: GenerateApiKeyResponseSchema },
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
        403: {
          description: 'Forbidden - No active subscription',
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

      const body = await c.req.json();
      const { name, permissions, expiresAt } = GenerateApiKeySchema.parse(body);

      // Check if user has active subscription
      const billingService = await c.env.BILLING_SERVICE.billing();
      const subscription = await billingService.getUserActiveSubscription(user.id);

      if (!subscription || subscription.status !== 'active') {
        throw new HTTPException(403, {
          message: 'Active subscription required to generate API keys',
        });
      }

      // Generate API key
      const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
      const result = await apiKeyManager.generateApiKey({
        userId: user.id,
        name,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      if (!result.success || !result.data) {
        throw new HTTPException(500, { message: result.error || 'Failed to generate API key' });
      }

      return c.json(
        {
          success: true,
          data: {
            keyId: result.data.keyId,
            apiKey: result.data.apiKey,
            name,
            permissions,
            expiresAt: expiresAt || null,
          },
        },
        201
      );
    }
  );
