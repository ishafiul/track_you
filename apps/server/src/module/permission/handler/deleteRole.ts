import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Add the deleteRole method to the permission manager first
// This is a placeholder until you add it to the actual worker

// Request params schema
const DeleteRoleParamsSchema = z.object({
  type: PermissionDocTypeSchema,
  role: z.string().min(1)
}).openapi('DeleteRoleParamsDto');

export type DeleteRoleParamsDto = z.infer<typeof DeleteRoleParamsSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/permissions/roles/{type}/{role}',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: DeleteRoleParamsSchema
      },
      responses: {
        200: {
          description: 'Role deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean()
              })
            },
          },
        },
        404: {
          description: 'Role not found',
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
        const { type, role } = c.req.valid('param');
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        
        // First, check if the role exists
        const roles = await permissionService.listRoles({ type });
        
        if (!roles.roles[role]) {
          throw new HTTPException(404, { message: `Role '${role}' not found for type '${type}'` });
        }
        
        // Now use the deleteRole method we implemented in the worker
        const result = await permissionService.deleteRole({
          type,
          role
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