import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions",
      tags: ["User Subscriptions"],
      description: "Create a user subscription",
      responses: {
        201: {
          description: "User subscription created successfully",
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
        },
      },
    }),
    async (c: HonoContext) => {
      return c.json({ success: true }, 201);
    }
  ); 