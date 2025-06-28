import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const CheckUserAccessResponseSchema = z.object({
  hasAccess: z.boolean(),
  subscription: z.object({
    id: z.string(),
    userId: z.string(),
    planId: z.string(),
    status: z.string(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    cancelAtPeriodEnd: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
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
  }).optional(),
}).openapi("CheckUserAccessResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/check-access/{userId}",
      tags: ["User Subscriptions"],
      description: "Check if user has valid subscription access",
      request: {
        params: z.object({
          userId: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "User access status retrieved successfully",
          content: {
            "application/json": { schema: CheckUserAccessResponseSchema },
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

        const result = await billingService.checkUserAccess(userId);

        return c.json(result, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to check user access" });
      }
    }
  );