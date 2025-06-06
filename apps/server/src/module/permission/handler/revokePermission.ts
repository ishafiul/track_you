import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Request schema for revoking permissions
export const RevokePermissionSchema = z.object({
  subject: z.string().regex(/^user:[a-zA-Z0-9_-]+$|^group:[a-zA-Z0-9_-]+$/),
  type: PermissionDocTypeSchema,
  id: z.string().min(1) // Can be "*" for wildcard
}).openapi('RevokePermissionDto');

export type RevokePermissionDto = z.infer<typeof RevokePermissionSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/permissions/revoke',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: RevokePermissionSchema,
              example: {
                subject: 'user:123',
                type: 'blog',
                id: '*' // Wildcard - revoke for all blogs
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Permission revoked successfully',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean(),
              })
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string()
              })
            }
          }
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const payload = await c.req.json<RevokePermissionDto>();
        
        // Pass directly to revokeRole method
        const result = await permissionService.revokeRole({
          subject: payload.subject,
          type: payload.type,
          id: payload.id // Can be "*" for wildcard
        });

        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  );
