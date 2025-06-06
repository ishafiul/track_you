import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Request schema
const GrantRoleToMultipleBodySchema = z.object({
  subject: z.string().min(1),
  type: PermissionDocTypeSchema,
  ids: z.array(z.string().min(1)),
  role: z.string().min(1),
  expires_at: z.number().nullable().optional().default(null)
}).openapi('GrantRoleToMultipleBodyDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/permissions/grant-multiple',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: GrantRoleToMultipleBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully granted roles',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean()
              }),
              example: {
                ok: true
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const { subject, type, ids, role, expires_at = null } = await c.req.valid('json');
        
        const result = await permissionService.grantRoleToMultiple({
          subject,
          type,
          ids,
          role,
          expires_at
        });
        
        return c.json(result, 200);
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  ); 