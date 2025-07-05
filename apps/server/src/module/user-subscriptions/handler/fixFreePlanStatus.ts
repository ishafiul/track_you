import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const FixFreePlanStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  fixedCount: z.number(),
}).openapi("FixFreePlanStatusResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions/fix-free-plans",
      tags: ["User Subscriptions"],
      description: "Fix free plans that are in canceled status - they should always be active",
      responses: {
        200: {
          description: "Free plans fixed successfully",
          content: { 
            "application/json": { schema: FixFreePlanStatusResponseSchema },
          },
        },
        500: {
          description: "Server error",
          content: { 
            "application/json": { schema: z.object({ message: z.string() }) },
          },
        },
      },
    }),
    async (c: HonoContext) => {
      try {
        const billingService = await c.env.BILLING_SERVICE.billing();

        // Use the new method to fix free plan statuses
        const result = await billingService.fixFreePlanStatuses();

        return c.json({
          success: result.success,
          message: result.message,
          fixedCount: result.fixedCount
        }, 200);
      } catch (error) {
        console.error('Error fixing free plan status:', error);
        throw new HTTPException(500, { message: "Failed to fix free plan status" });
      }
    }
  ); 