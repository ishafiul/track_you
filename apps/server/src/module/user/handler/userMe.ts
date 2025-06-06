import {createRoute} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {UserSchema} from "user-worker/src/entity/user";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/users/me',
      security: [{AUTH: []}],
      tags: ['Users'],
      middleware: [authMiddleware],
      responses: {
        200: {
          description: 'Get current user information',
          content: {
            'application/json': {schema: UserSchema},
          },
        },
      },
    }),
    async (c) => {
      const user = c.get('user');
      if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const userService = await c.env.USER_SERVICE.newUser();
      const userDetails = await userService.findUserById(user.id);
      
      if (!userDetails) {
        throw new HTTPException(404, { message: 'User not found' });
      }

      return c.json(userDetails, 200);
    }
  );
