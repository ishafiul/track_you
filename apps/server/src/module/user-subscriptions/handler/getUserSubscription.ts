import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/{id}",
      tags: ["User Subscriptions"],
      description: "Get user subscription by ID",
      request: { params: z.object({ id: z.string() }) },
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
        },
      },
    }),
    async (c: HonoContext) => c.json({ success: true }, 200)
  ); 