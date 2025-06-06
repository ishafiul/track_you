import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";

// Response schema for listing groups
const ListGroupsResponseSchema = z.object({
  groups: z.array(z.string())
}).openapi('ListGroupsResponseDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/groups',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      responses: {
        200: {
          description: 'Successfully retrieved groups',
          content: {
            'application/json': {
              schema: ListGroupsResponseSchema,
              example: {
                groups: ["marketing", "editors", "admins"]
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        
        // Now we use the actual listGroups method implemented in the worker
        const result = await permissionService.listGroups();
        
        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  ); 