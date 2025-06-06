import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {permissionMiddleware} from "../../../middleware/permission";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/users/{id}',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [
        authMiddleware,
        permissionMiddleware("user", "delete", (c) => {
          const params = c.req.param();
          return params.id;
        })
      ],
      request: {
        params: z.object({
          id: z.string()
        })
      },
      responses: {
        200: {
          description: 'User deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                message: z.string()
              })
            },
          },
        }
      },
    }),
    async (c) => {
      const userService = await c.env.USER_SERVICE.newUser();
      const params = c.req.param();

      // Check if user exists
      const existingUser = await userService.findUserById(params.id);
      if (!existingUser) {
        throw new HTTPException(404, { message: 'User not found' });
      }

      // Delete user
      const success = await userService.deleteUser(params.id);
      if (!success) {
        throw new HTTPException(500, { message: 'Failed to delete user' });
      }

      return c.json({
        success: true,
        message: 'User deleted successfully'
      }, 200);
    }
  ); 