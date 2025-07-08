import { createRoute, z } from '@hono/zod-openapi';
import { HonoApp, HonoContext } from '../../../type';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../../../middleware/auth';
import { permissionMiddleware } from '../../../middleware/permission';

const RevokeApiKeyResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi('RevokeApiKeyResponse');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/api-keys/{keyId}',
      tags: ['API Keys'],
      description: 'Revoke an API key',
      middleware: [
        authMiddleware,
        permissionMiddleware('api_key', 'delete', (c) => c.req.param('keyId')),
      ],
      request: {
        params: z.object({
          keyId: z.string(),
        }),
      },
      responses: {
        200: {
          description: 'API key revoked successfully',
          content: {
            'application/json': { schema: RevokeApiKeyResponseSchema },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': { schema: z.object({ message: z.string() }) },
          },
        },
        403: {
          description: 'Forbidden',
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

      const keyId = c.req.param('keyId');

      const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
      const result = await apiKeyManager.revokeApiKey(user.id, keyId);

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to revoke API key' });
      }

      return c.json(
        {
          success: true,
          message: 'API key revoked successfully',
        },
        200
      );
    }
  );
