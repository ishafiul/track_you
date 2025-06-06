import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {UserSchema} from "user-worker/src/entity/user";
import {adminMiddleware} from "../../../middleware/admin";
import {permissionMiddleware} from "../../../middleware/permission";

export const CreateUserSchema = z.object({
  email: z.string().email(),
}).openapi('CreateUserDto')

export type CreateUserDto = z.infer<typeof CreateUserSchema>;


export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/users/{id}',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [authMiddleware, permissionMiddleware("user", "create", (c) => {
        const params = c.req.param()
        return params.id
      })],
      request: {
        params: z.object({
          id: z.string()
        })
      },
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {schema: UserSchema},
          },
        },
      },
    }),
    async (c) => {
      const userService = await c.env.USER_SERVICE.newUser();
      const params = c.req.param()
      const user = await userService.findUserById(params.id)
      // Successful logout response
      return c.json(user, 200);
    }
  );
