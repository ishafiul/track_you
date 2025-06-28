import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const UpdateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  featuresJson: z.string().min(1).optional(),
  apiRateLimit: z.number().int().positive().optional(),
  maxRequestsPerMonth: z.number().int().positive().optional(),
  active: z.boolean().optional(),
}).openapi("UpdateSubscriptionPlanRequest");

const UpdateSubscriptionPlanResponseSchema = z.object({
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
}).openapi("UpdateSubscriptionPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "put",
      path: "/subscription-plans/{id}",
      tags: ["Subscription Plans"],
      description: "Update a subscription plan",
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