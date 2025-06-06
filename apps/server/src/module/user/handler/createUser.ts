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
      method: 'post',
      path: '/users',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: CreateUserSchema,
              example: {
                email: 'shafiulislam20@gmail.com'
              },
            },
          },
        },
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
      const {email} = await c.req.json<CreateUserDto>();
      const user = await userService.findUserOrCreate(email)
      // Successful logout response
      return c.json(user, 200);
    }
  );
