import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Request schema for updating plan details
const UpdateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  featuresJson: z.string().min(1).optional(),
  apiRateLimit: z.number().int().positive().optional(),
  maxRequestsPerMonth: z.number().int().positive().optional(),
  active: z.boolean().optional(),
}).openapi("UpdateSubscriptionPlanRequest");

// Request schema for updating plan pricing
const UpdatePlanPricingSchema = z.object({
  monthlyPrice: z.number().positive(),
  yearlyPrice: z.number().positive(),
}).openapi("UpdatePlanPricingRequest");

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

// Plan schema
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
});

// Response schema
const UpdateSubscriptionPlanResponseSchema = z.object({
  success: z.boolean(),
  plan: SubscriptionPlanSchema.optional(),
  pricing: z.array(PlanPricingSchema).optional(),
  error: z.string().optional(),
}).openapi("UpdateSubscriptionPlanResponse");

export default (app: HonoApp) => {
  // Update plan details
  app.openapi(
    createRoute({
      method: "put",
      path: "/subscription-plans/{id}",
      tags: ["Subscription Plans"],
      description: "Update a subscription plan details",
      request: {
        params: z.object({
          id: z.string().min(1),
        }),
        body: {
          content: {
            "application/json": {
              schema: UpdateSubscriptionPlanSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Subscription plan updated successfully",
          content: {
            "application/json": { schema: UpdateSubscriptionPlanResponseSchema },
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
        const bodyJson = await c.req.json();
        const body = UpdateSubscriptionPlanSchema.parse(bodyJson);

        const plan = await billingService.updateSubscriptionPlan(id, body);

        if (!plan) {
          throw new HTTPException(404, { message: "Subscription plan not found" });
        }

        return c.json({
          success: true,
          plan
        }, 200);
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(500, { message: "Failed to update subscription plan" });
      }
    }
  );

  // Update plan pricing
  app.openapi(
    createRoute({
      method: "put",
      path: "/subscription-plans/{id}/pricing",
      tags: ["Subscription Plans"],
      description: "Update subscription plan pricing through Stripe",
      request: {
        params: z.object({
          id: z.string().min(1),
        }),
        body: {
          content: {
            "application/json": {
              schema: UpdatePlanPricingSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Subscription plan pricing updated successfully",
          content: {
            "application/json": { schema: UpdateSubscriptionPlanResponseSchema },
          },
        },
        400: {
          description: "Bad request or validation error",
          content: {
            "application/json": { schema: UpdateSubscriptionPlanResponseSchema },
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
        const bodyJson = await c.req.json();
        const body = UpdatePlanPricingSchema.parse(bodyJson);

        const result = await billingService.updatePlanPricingWithStripe(
          id,
          body.monthlyPrice,
          body.yearlyPrice
        );

        if (!result.success) {
          return c.json({
            success: false,
            error: result.error
          }, 400);
        }

        // Get the updated plan
        const plan = await billingService.getSubscriptionPlan(id);

        return c.json({
          success: true,
          plan: plan || undefined,
          pricing: result.pricing
        }, 200);
      } catch (error) {
        console.error('Error updating plan pricing:', error);
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(500, { message: "Failed to update subscription plan pricing" });
      }
    }
  );
}; 