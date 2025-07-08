import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';

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
      description: 'Get all API keys that the authenticated user has permission to view',
      middleware: [authMiddleware],
      responses: {
        200: {
          description: "User's permitted API keys",
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

      // Get all API keys for the user from the database
      const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
      const result = await apiKeyManager.getUserApiKeys(user.id);

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to get API keys' });
      }

      // Get permission manager to check permissions for each API key
      const permissionManager = await c.env.PERMISSION_MANAGER.newPermissionManager();

      // Filter API keys based on permissions - only return keys the user can view
      const permittedApiKeys = [];
      for (const key of result.data || []) {
        try {
          // Check if user has 'view' permission on this specific API key OR on wildcard (*)
          const permissionResult = await permissionManager.checkPermission({
            user: user.id,
            type: 'api_key',
            id: key.id,
            permission: 'view',
            bypassCache: false,
          });

          if (permissionResult.allowed) {
            permittedApiKeys.push({
              id: key.id,
              name: key.name,
              keyPrefix: key.keyPrefix,
              permissions: JSON.parse(key.permissions),
              isActive: key.isActive,
              lastUsed: key.lastUsed ? key.lastUsed.toISOString() : null,
              createdAt: key.createdAt.toISOString(),
              expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null,
            });
          }
        } catch (error) {
          console.error(`Error checking permission for API key ${key.id}:`, error);
          // Skip this key if permission check fails
        }
      }

      return c.json(
        {
          success: true,
          data: permittedApiKeys,
        },
        200
      );
    }
  );
