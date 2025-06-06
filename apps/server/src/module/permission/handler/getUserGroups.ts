import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";

// Request and response schemas
const GetUserGroupsParamsSchema = z.object({
  userId: z.string().min(1)
}).openapi('GetUserGroupsParamsDto');

const GetUserGroupsResponseSchema = z.object({
  groups: z.array(z.string())
}).openapi('GetUserGroupsResponseDto');

export type GetUserGroupsParamsDto = z.infer<typeof GetUserGroupsParamsSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/users/{userId}/groups',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: GetUserGroupsParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved user groups',
          content: {
            'application/json': {
              schema: GetUserGroupsResponseSchema,
              example: {
                groups: ["marketing", "editors"]
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const { userId } = c.req.valid('param');
        
        // First get all groups
        const allGroups = await permissionService.listGroups();
        
        // Then check each group for the user's membership
        const userGroups: string[] = [];
        
        await Promise.all(allGroups.groups.map(async (group) => {
          const members = await permissionService.getGroupMembers({ group });
          if (members.users.includes(userId)) {
            userGroups.push(group);
          }
        }));
        
        return c.json({ groups: userGroups } as const, 200);
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