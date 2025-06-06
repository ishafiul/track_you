import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {UserListSchema, UserSchema} from "user-worker/src/entity/user";
import {adminMiddleware} from "../../../middleware/admin";
import {GetUsersDto, GetUsersSchema} from "user-worker/src/dto/user";

export const CreateUserSchema = z.object({
  email: z.string().email(),
}).openapi('CreateUserDto')

export type CreateUserDto = z.infer<typeof CreateUserSchema>;


export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/users',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [authMiddleware],
      request: {
        query: GetUsersSchema,
      },
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {schema: UserListSchema},
          },
        },
      },
    }),
    async (c) => {
      const userService = await c.env.USER_SERVICE.newUser();
      GetUsersSchema.superRefine((val, ctx)=>{

      })
      const params = GetUsersSchema.parse(c.req.query())
      const user = await userService.getUserList(params)
      // Successful logout response
      return c.json(user, 200);
    }
  );
