import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const UserAccessResponseSchema = z.object({
  success: z.boolean(),
  hasAccess: z.boolean(),
  accessLevel: z.enum(['full', 'limited', 'none']).optional(),
  reason: z.string().optional(),
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
    description: z.string().nullable(),
    featuresJson: z.string(),
    apiRateLimit: z.number(),
    maxRequestsPerMonth: z.number(),
    active: z.boolean(),
  }).optional(),
}).openapi("UserAccessResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/user-subscriptions/access/{userId}",
      tags: ["User Subscriptions"],
      description: "Check user's subscription access level and status",
      request: {
        params: z.object({
          userId: z.string().min(1),
        }),
      },
      responses: {
        200: {
          description: "User access information retrieved successfully",
          content: {
            "application/json": { schema: UserAccessResponseSchema },
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

        const accessInfo = await billingService.checkUserAccess(userId);

        return c.json({
          success: true,
          hasAccess: accessInfo.hasAccess,
          accessLevel: accessInfo.accessLevel,
          reason: accessInfo.reason,
          subscription: accessInfo.subscription,
          plan: accessInfo.plan
        }, 200);
      } catch (error) {
        console.error('Error checking user access:', error);
        throw new HTTPException(500, { message: "Failed to check user access" });
      }
    }
  );