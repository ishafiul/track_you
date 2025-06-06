import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema, PermissionSchema, Permission} from "permission-manager-worker/src/entity/schema";

// Define the expected role response schema
const RoleSchema = z.object({
  permissions: z.array(PermissionSchema),
  inherits: z.array(z.string())
});

// Request and response schemas
const GetRolesParamsSchema = z.object({
  type: PermissionDocTypeSchema
}).openapi('GetRolesParamsDto');

const GetRolesResponseSchema = z.object({
  roles: z.record(z.string(), RoleSchema)
}).openapi('GetRolesResponseDto');

export type GetRolesParamsDto = z.infer<typeof GetRolesParamsSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/roles/{type}',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: GetRolesParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved all roles',
          content: {
            'application/json': {
              schema: GetRolesResponseSchema,
              example: {
                roles: {
                  "editor": {
                    permissions: ["view", "edit"],
                    inherits: []
                  },
                  "admin": {
                    permissions: ["view", "edit", "delete", "create", "admin"],
                    inherits: ["editor"]
                  }
                }
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const { type } = c.req.valid('param');
        
        // Now we can use the actual listRoles method in the permission manager
        const result = await permissionService.listRoles({ type });
        
        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  );
