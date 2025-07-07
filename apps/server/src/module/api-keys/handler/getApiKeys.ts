import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const ApiKeyItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    keyPrefix: z.string(),
    permissions: z.array(z.string()),
    isActive: z.boolean(),
    lastUsed: z.string().nullable(),
    createdAt: z.string(),
    expiresAt: z.string().nullable(),
  })
  .openapi('ApiKeyItem');

const GetApiKeysResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(ApiKeyItemSchema),
  })
  .openapi('GetApiKeysResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api-keys',
      tags: ['API Keys'],
      description: 'Get all API keys for the authenticated user',
      middleware: [authMiddleware, permissionMiddleware('api_key', 'api_key_manage', (c) => '*')],
      responses: {
        200: {
          description: "User's API keys",
          content: {
            'application/json': { schema: GetApiKeysResponseSchema },
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

      const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
      const result = await apiKeyManager.getUserApiKeys(user.id);

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to get API keys' });
      }

      const apiKeys =
        result.data?.map((key) => ({
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          permissions: JSON.parse(key.permissions),
          isActive: key.isActive,
          lastUsed: key.lastUsed ? key.lastUsed.toISOString() : null,
          createdAt: key.createdAt.toISOString(),
          expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null,
        })) || [];

      return c.json(
        {
          success: true,
          data: apiKeys,
        },
        200
      );
    }
  );
