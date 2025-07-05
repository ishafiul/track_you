import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const GetUserPlanStatusResponseSchema = z.object({
  success: z.boolean(),
  status: z.string().nullable(),
  planId: z.string().nullable(),
  subscription: z.object({
    id: z.string(),
    userId: z.string(),
    planId: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']),
    status: z.string(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    cancelAtPeriodEnd: z.boolean(),
    stripeSubscriptionId: z.string().nullable(),
    stripeCustomerId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
}).openapi("GetUserPlanStatusResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/plan-status/{userId}",
      tags: ["User Subscriptions"],
      description: "Get user's current plan status (pending/complete flow)",
      request: {
        params: z.object({
          userId: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "User plan status retrieved successfully",
          content: {
            "application/json": { schema: GetUserPlanStatusResponseSchema },
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

        const result = await billingService.getUserPlanStatus(userId);

        return c.json(result, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to get user plan status" });
      }
    }
  ); 