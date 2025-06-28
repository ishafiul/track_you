import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Response schema
const SubscriptionPlanSchema = z.object({
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
}).openapi("SubscriptionPlan");

const GetSubscriptionPlanResponseSchema = z.object({
  success: z.boolean(),
  plan: SubscriptionPlanSchema.nullable(),
}).openapi("GetSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/subscription-plans/{id}",
      tags: ["Subscription Plans"],
      description: "Get a subscription plan by ID",
      request: {
        params: z.object({
          id: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "Subscription plan retrieved successfully",
          content: {
            "application/json": { schema: GetSubscriptionPlanResponseSchema },
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
        
        const plan = await billingService.getSubscriptionPlan(id);

        if (!plan) {
          throw new HTTPException(404, { message: "Subscription plan not found" });
        }

        return c.json({
          success: true,
          plan
        }, 200);
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(500, { message: "Failed to get subscription plan" });
      }
    }
  ); 