import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const DeleteSubscriptionPlanResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
}).openapi("DeleteSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "delete",
      path: "/subscription-plans/{id}",
      tags: ["Subscription Plans"],
      description: "Delete a subscription plan",
      request: {
        params: z.object({
          id: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "Subscription plan deleted successfully",
          content: {
            "application/json": { schema: DeleteSubscriptionPlanResponseSchema },
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
        const { id } = c.req.param();
        const billingService = await c.env.BILLING_SERVICE.billing();

        await billingService.deleteSubscriptionPlan(id);

        return c.json({
          success: true,
          message: "Subscription plan deleted successfully"
        }, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to delete subscription plan" });
      }
    }
  ); 