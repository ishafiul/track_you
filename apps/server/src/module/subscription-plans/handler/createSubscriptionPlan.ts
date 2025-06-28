import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Request schema for creating a subscription plan with both monthly and yearly pricing
const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  featuresJson: z.string().min(1),
  apiRateLimit: z.number().int().positive(),
  maxRequestsPerMonth: z.number().int().positive(),
  monthlyPrice: z.number().positive(),
  yearlyPrice: z.number().positive(),
}).openapi("CreateSubscriptionPlanRequest");

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
const CreateSubscriptionPlanResponseSchema = z.object({
  success: z.boolean(),
  plan: SubscriptionPlanSchema.optional(),
  pricing: z.array(PlanPricingSchema).optional(),
  error: z.string().optional(),
}).openapi("CreateSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/subscription-plans",
      tags: ["Subscription Plans"],
      description: "Create a new subscription plan with monthly and yearly pricing options",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CreateSubscriptionPlanSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Subscription plan created successfully",
          content: {
            "application/json": { schema: CreateSubscriptionPlanResponseSchema },
          },
        },
        400: {
          description: "Bad request or validation error",
          content: {
            "application/json": { schema: CreateSubscriptionPlanResponseSchema },
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
        console.log("BILLING_SERVICE available:", !!c.env.BILLING_SERVICE);
        if (!c.env.BILLING_SERVICE) {
          return c.json({
            message: "Billing service not available - check service bindings"
          }, 500);
        }
        
        const billingService = await c.env.BILLING_SERVICE.billing();
        console.log("Billing service instance created:", !!billingService);
        
        const bodyJson = await c.req.json();
        const body = CreateSubscriptionPlanSchema.parse(bodyJson);

        // Call the billing service to create plan with both pricing options
        const result = await billingService.createSubscriptionPlanWithStripe({
          name: body.name,
          description: body.description,
          featuresJson: body.featuresJson,
          apiRateLimit: body.apiRateLimit,
          maxRequestsPerMonth: body.maxRequestsPerMonth,
          monthlyPrice: body.monthlyPrice,
          yearlyPrice: body.yearlyPrice
        });

        if (!result.success) {
          return c.json({ 
            success: false, 
            error: result.error || 'Failed to create subscription plan' 
          }, 400);
        }

        return c.json({ 
          success: true, 
          plan: result.plan,
          pricing: result.pricing
        }, 201);
      } catch (error) {
        console.error('Error creating subscription plan:', error);
        
        // More specific error handling
        if (error instanceof z.ZodError) {
          return c.json({ 
            success: false, 
            error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
          }, 400);
        }

        return c.json({
          message: error instanceof Error ? error.message : "Failed to create subscription plan"
        }, 500);
      }
    }
  ); 