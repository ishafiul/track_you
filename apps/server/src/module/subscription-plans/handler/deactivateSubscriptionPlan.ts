import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const DeactivateSubscriptionPlanResponseSchema = z.object({
  success: z.boolean(),
  plan: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    billingCycle: z.string(),
    featuresJson: z.string(),
    apiRateLimit: z.number(),
    maxRequestsPerMonth: z.number(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).nullable(),
}).openapi("DeactivateSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "patch",
      path: "/subscription-plans/{id}/deactivate",
      tags: ["Subscription Plans"],
      description: "Deactivate a subscription plan",
      request: {
        params: z.object({
          id: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "Subscription plan deactivated successfully",
          content: {
            "application/json": { schema: DeactivateSubscriptionPlanResponseSchema },
          },
        },
        404: {
          description: "Subscription plan not found",
          content: {
            "application/json": { schema: z.object({ message: z.string() }) },
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

        const plan = await billingService.deactivateSubscriptionPlan(id);

        if (!plan) {
          throw new HTTPException(404, { message: "Subscription plan not found" });
        }

        return c.json({
          success: true,
          plan
        }, 200);
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(500, { message: "Failed to deactivate subscription plan" });
      }
    }
  ); 