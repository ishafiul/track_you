import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";

const LogoutResponseSchema = z.object({
  message: z.string(),
}).openapi("LogoutResponse");

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/auth/logout',
      security: [{AUTH: []}],
      tags: ['Auth'],
      middleware: [authMiddleware],
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {schema: LogoutResponseSchema},
          },
        },
      },
    }),
    async (c) => {
      const auth = await c.env.AUTH_SERVICE.newAuth();
      const payload = c.get('auth');
      if (!payload || !payload.id) {
        throw new HTTPException(401, {message: 'Invalid JWT payload'});
      }
      const result = await auth.logout(payload.id);
      if (!result) {
        throw new HTTPException(500, {message: 'Logout failed: Something went wrong'});
      }

      // Successful logout response
      return c.json({message: 'Logout successful'}, 200);
    }
  );
