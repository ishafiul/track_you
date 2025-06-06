import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema, PermissionSchema} from "permission-manager-worker/src/entity/schema";

// Request query schema
const GetGroupPermissionsQuerySchema = z.object({
  group: z.string().optional()
}).openapi('GetGroupPermissionsQueryDto');

// Resource permission schema
const ResourcePermissionSchema = z.object({
  type: PermissionDocTypeSchema,
  id: z.string(),
  role: z.string(),
  expires_at: z.number().nullable().optional()
});

// Response schema for group permissions
const GetGroupPermissionsResponseSchema = z.object({
  groups: z.record(z.string(), z.array(ResourcePermissionSchema))
}).openapi('GetGroupPermissionsResponseDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/groups/permissions',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        query: GetGroupPermissionsQuerySchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved group permissions',
          content: {
            'application/json': {
              schema: GetGroupPermissionsResponseSchema,
              example: {
                groups: {
                  "marketing": [
                    {
                      type: "blog",
                      id: "*",
                      role: "editor",
                      expires_at: null
                    }
                  ],
                  "admins": [
                    {
                      type: "user",
                      id: "*",
                      role: "admin",
                      expires_at: null
                    },
                    {
                      type: "blog",
                      id: "*",
                      role: "admin",
                      expires_at: null
                    }
                  ]
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
        const { group } = c.req.query();
        
        // Get permissions for all groups or a specific group
        const result = await permissionService.getGroupPermissions({ group });
        
        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  ); 