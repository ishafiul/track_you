import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Request schema for creating a subscription plan
const CreateSubscriptionPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  billingCycle: z.enum(['monthly', 'yearly']),
  featuresJson: z.string().min(1),
  apiRateLimit: z.number().int().positive(),
  maxRequestsPerMonth: z.number().int().positive(),
  active: z.boolean().optional().default(true),
}).openapi("CreateSubscriptionPlanRequest");

// Response schema
const CreateSubscriptionPlanResponseSchema = z.object({
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
  }),
}).openapi("CreateSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/subscription-plans",
      tags: ["Subscription Plans"],
      description: "Create a new subscription plan",
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
          description: "Bad request",
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
        const billingService = await c.env.BILLING_SERVICE.billing();
        const bodyJson = await c.req.json();
        const body = CreateSubscriptionPlanSchema.parse(bodyJson);

        const plan = await billingService.createSubscriptionPlan(body);

        return c.json({
          success: true,
          plan
        }, 201);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to create subscription plan" });
      }
    }
  ); 