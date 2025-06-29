import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const UserSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.string(),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("UserSubscription");

const PlanDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  featuresJson: z.string(),
  apiRateLimit: z.number(),
  maxRequestsPerMonth: z.number(),
  active: z.boolean(),
}).openapi("PlanDetails");

const GetUserActiveSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  subscription: UserSubscriptionSchema.nullable(),
  plan: PlanDetailsSchema.nullable(),
}).openapi("GetUserActiveSubscriptionResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/active/{userId}",
      tags: ["User Subscriptions"],
      description: "Get user's active subscription with plan details",
      request: {
        params: z.object({
          userId: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "User's active subscription retrieved successfully",
          content: {
            "application/json": { schema: GetUserActiveSubscriptionResponseSchema },
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
        const { userId } = c.req.param();
        const billingService = await c.env.BILLING_SERVICE.billing();

        const subscription = await billingService.getUserActiveSubscription(userId);
        let plan = null;

        if (subscription) {
          plan = await billingService.getSubscriptionPlan(subscription.planId);
        }

        return c.json({
          success: true,
          subscription,
          plan
        }, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to get user's active subscription" });
      }
    }
  ); 