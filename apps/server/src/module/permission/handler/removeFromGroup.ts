import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";

// Request schema for removing a user from a group
export const RemoveFromGroupSchema = z.object({
  user: z.string().min(1),
  group: z.string().min(1)
}).openapi('RemoveFromGroupDto');

export type RemoveFromGroupDto = z.infer<typeof RemoveFromGroupSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/permissions/groups/remove-member',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: RemoveFromGroupSchema,
              example: {
                user: "john",
                group: "marketing"
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'User removed from group successfully',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean(),
              })
            },
          },
        },
        400: {
          description: 'Invalid request',
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
        const payload = await c.req.json<RemoveFromGroupDto>();
        
        // Call the removeFromGroup method from the permission manager worker
        const result = await permissionService.removeFromGroup({
          user: payload.user,
          group: payload.group
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