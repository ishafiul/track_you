import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Response schema
const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  billingCycle: z.enum(['monthly', 'yearly']),
  featuresJson: z.string(),
  apiRateLimit: z.number(),
  maxRequestsPerMonth: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
      description: "Get all subscription plans",
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
        const plans = await billingService.getAllSubscriptionPlans();

        const response = {
          success: true as const,
          plans: (plans || []).map(plan => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            billingCycle: plan.billingCycle as 'monthly' | 'yearly',
            featuresJson: plan.featuresJson,
            apiRateLimit: plan.apiRateLimit,
            maxRequestsPerMonth: plan.maxRequestsPerMonth,
            active: plan.active,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          }))
        };

        return c.json(response, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to get subscription plans" });
      }
    }
  ); 