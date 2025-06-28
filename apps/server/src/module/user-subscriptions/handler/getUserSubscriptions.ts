import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/user/{userId}",
      tags: ["User Subscriptions"],
      description: "Get all user subscriptions",
      request: { params: z.object({ userId: z.string() }) },
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
        },
      },
    }),
    async (c: HonoContext) => c.json({ success: true }, 200)
  ); 