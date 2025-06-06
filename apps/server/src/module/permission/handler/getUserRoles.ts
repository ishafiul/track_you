import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Request and response schemas
const GetUserRolesParamsSchema = z.object({
  type: PermissionDocTypeSchema,
  userId: z.string().min(1)
}).openapi('GetUserRolesParamsDto');

const GetUserRolesResponseSchema = z.object({
  roles: z.array(z.object({
    type: PermissionDocTypeSchema,
    id: z.string(),
    role: z.string(),
    expires_at: z.number().nullable().optional()
  }))
}).openapi('GetUserRolesResponseDto');

export type GetUserRolesParamsDto = z.infer<typeof GetUserRolesParamsSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/users/{userId}/roles/{type}',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: GetUserRolesParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved user roles',
          content: {
            'application/json': {
              schema: GetUserRolesResponseSchema,
              example: {
                roles: [
                  {
                    type: "document",
                    id: "doc123",
                    role: "editor",
                    expires_at: null
                  }
                ]
              }
            },
          },
        },
        404: {
          description: 'User not found or has no roles',
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
        const { type, userId } = c.req.valid('param');
        
        // Get user roles directly using the new method
        const result = await permissionService.getUserRoles(userId, type);
        
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