import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";

// Request params schema
const GetGroupMembersParamsSchema = z.object({
  group: z.string().min(1)
}).openapi('GetGroupMembersParamsDto');

// Response schema for group members
const GetGroupMembersResponseSchema = z.object({
  users: z.array(z.string())
}).openapi('GetGroupMembersResponseDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/groups/{group}/members',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        params: GetGroupMembersParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully retrieved group members',
          content: {
            'application/json': {
              schema: GetGroupMembersResponseSchema,
              example: {
                users: ["john", "alice", "bob"]
              }
            },
          },
        },
        404: {
          description: 'Group not found',
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
        const { group } = c.req.valid('param');
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        
        // Now we can use the getGroupMembers method from the permission manager
        const result = await permissionService.getGroupMembers({ group });
        
        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  ); 