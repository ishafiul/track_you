import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema, PermissionSchema} from "permission-manager-worker/src/entity/schema";

export const SetRoleSchema = z.object({
  type: PermissionDocTypeSchema,
  role: z.string().min(1),
  permissions: z.array(PermissionSchema),
  inherits: z.array(z.string().min(1)).optional()
}).openapi('SetRoleDto')

export type SetRoleDto = z.infer<typeof SetRoleSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/permissions/role',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: SetRoleSchema,
              example: {
                type: 'user',
                role: 'editor',
                permissions: ['view', 'edit'],
                inherits: []
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Role defined successfully',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean(),
              })
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const payload = await c.req.json<SetRoleDto>();

        const result = await permissionService.defineRole({
          type: payload.type,
          role: payload.role,
          permissions: payload.permissions,
          inherits: payload.inherits || []
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
