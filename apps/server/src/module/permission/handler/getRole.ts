import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema, PermissionSchema} from "permission-manager-worker/src/entity/schema";

// Define the expected role response schema
const RoleSchema = z.object({
  permissions: z.array(PermissionSchema),
  inherits: z.array(z.string())
});

// Request and response schemas
const GetRoleParamsSchema = z.object({
  type: PermissionDocTypeSchema,
  role: z.string().min(1)
}).openapi('GetRoleParamsDto');

const GetRoleResponseSchema = z.object({
  role: z.string(),
  permissions: z.array(PermissionSchema),
  inherits: z.array(z.string())
}).openapi('GetRoleResponseDto');

export type GetRoleParamsDto = z.infer<typeof GetRoleParamsSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/roles/{type}/{role}',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: GetRoleParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved role',
          content: {
            'application/json': {
              schema: GetRoleResponseSchema,
              example: {
                role: "editor",
                permissions: ["view", "edit"],
                inherits: ["viewer"]
              }
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
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const { type, role } = c.req.valid('param');
        
        // Get all roles first (we'll need to add a getRole method to the permission manager ideally)
        const result = await permissionService.listRoles({ type });
        
        // Find the specific role
        if (!result.roles[role]) {
          throw new HTTPException(404, { message: `Role '${role}' not found for type '${type}'` });
        }
        
        // Return the role with its name included
        return c.json({
          role,
          permissions: result.roles[role].permissions,
          inherits: result.roles[role].inherits
        }, 200);
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