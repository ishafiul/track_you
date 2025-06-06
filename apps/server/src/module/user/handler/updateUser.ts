import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {UserSchema} from "user-worker/src/entity/user";
import {permissionMiddleware} from "../../../middleware/permission";
import { updateUsersSchema } from "user-worker/drizzle/schema";


const UpdateUserBodySchema = updateUsersSchema.omit({ role: true, createdAt: true, updatedAt: true,id: true, email: true }).openapi('UpdateUserBodyDto');

export type UpdateUserDto = z.infer<typeof UpdateUserBodySchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/users/{id}',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [
        authMiddleware, 
        permissionMiddleware("user", "edit", (c) => {
          const params = c.req.param();
          return params.id;
        })
      ],
      request: {
        params: z.object({
          id: z.string()
        }),
        body: {
          content: {
            'application/json': {
              schema: UpdateUserBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'User updated successfully',
          content: {
            'application/json': {schema: UserSchema},
          },
        }
      },
    }),
    async (c) => {
      const userService = await c.env.USER_SERVICE.newUser();
      
      // Get path params and body
      const params = c.req.param();
      const body = await c.req.valid('json');
      
      // Check if user exists
      const existingUser = await userService.findUserById(params.id);
      if (!existingUser) {
        throw new HTTPException(404, { message: 'User not found' });
      }

      // Update user
      const updatedUser = await userService.updateUser(params.id, body);
      if (!updatedUser) {
        throw new HTTPException(500, { message: 'Failed to update user' });
      }

      return c.json(updatedUser, 200);
    }
  );
