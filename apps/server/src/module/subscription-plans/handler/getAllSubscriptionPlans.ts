import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Plan pricing schema
const PlanPricingSchema = z.object({
  id: z.string(),
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  price: z.number(),
  stripePriceId: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Response schema - updated to match new structure
const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  featuresJson: z.string(),
  apiRateLimit: z.number(),
  maxRequestsPerMonth: z.number(),
  active: z.boolean(),
  stripeProductId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  pricing: z.array(PlanPricingSchema).optional(),
}).openapi("SubscriptionPlan");

const GetAllSubscriptionPlansResponseSchema = z.object({
  success: z.boolean(),
  plans: z.array(SubscriptionPlanSchema),
}).openapi("GetAllSubscriptionPlansResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/subscription-plans",
      tags: ["Subscription Plans"],
      description: "Get all subscription plans with pricing information",
      responses: {
        200: {
          description: "Subscription plans retrieved successfully",
          content: {
            "application/json": { schema: GetAllSubscriptionPlansResponseSchema },
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
        const plansWithPricing = await billingService.getAllSubscriptionPlansWithPricing();

        const response = {
          success: true as const,
          plans: plansWithPricing || []
        };

        return c.json(response, 200);
      } catch (error) {
        console.error('Error getting subscription plans:', error);
        throw new HTTPException(500, { message: "Failed to get subscription plans" });
      }
    }
  ); 