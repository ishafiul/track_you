import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Pricing schema
const PlanPricingSchema = z.object({
  id: z.string(),
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  price: z.number(),
  stripePriceId: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("PlanPricing");

// Plan schema with pricing
const SubscriptionPlanWithPricingSchema = z.object({
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
  pricing: z.array(PlanPricingSchema),
}).openapi("SubscriptionPlanWithPricing");

const GetActiveSubscriptionPlansWithPricingResponseSchema = z.object({
  success: z.boolean(),
  plans: z.array(SubscriptionPlanWithPricingSchema),
}).openapi("GetActiveSubscriptionPlansWithPricingResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/subscription-plans/active-with-pricing",
      tags: ["Subscription Plans"],
      description: "Get all active subscription plans with their pricing details",
      responses: {
        200: {
          description: "Active subscription plans with pricing retrieved successfully",
          content: {
            "application/json": { schema: GetActiveSubscriptionPlansWithPricingResponseSchema },
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

        // Filter only active plans
        const activePlans = plansWithPricing.filter(plan => plan.active);

        const response = {
          success: true as const,
          plans: activePlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            featuresJson: plan.featuresJson,
            apiRateLimit: plan.apiRateLimit,
            maxRequestsPerMonth: plan.maxRequestsPerMonth,
            active: plan.active,
            stripeProductId: plan.stripeProductId,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
            pricing: plan.pricing.filter(p => p.active).map(pricing => ({
              id: pricing.id,
              planId: pricing.planId,
              billingCycle: pricing.billingCycle,
              price: pricing.price,
              stripePriceId: pricing.stripePriceId,
              active: pricing.active,
              createdAt: pricing.createdAt,
              updatedAt: pricing.updatedAt,
            }))
          }))
        };

        return c.json(response, 200);
      } catch (error) {
        console.error('Error getting subscription plans with pricing:', error);
        throw new HTTPException(500, { message: "Failed to get subscription plans with pricing" });
      }
    }
  ); 