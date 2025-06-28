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
      description: "Delete a subscription plan and archive it in Stripe",
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
        400: {
          description: "Bad request - plan has active subscriptions",
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

        // Use the new Stripe-aware delete method
        const result = await billingService.deleteSubscriptionPlanWithStripe(id);

        if (!result.success) {
          return c.json({
            success: false,
            message: result.error || "Failed to delete subscription plan"
          }, 400);
        }

        return c.json({
          success: true,
          message: "Subscription plan deleted successfully and archived in Stripe"
        }, 200);
      } catch (error) {
        console.error("Error deleting subscription plan:", error);
        return c.json({
          message: error instanceof Error ? error.message : "Failed to delete subscription plan"
        }, 500);
      }
    }
  ); 