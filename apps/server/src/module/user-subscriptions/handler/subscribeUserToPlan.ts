import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const SubscribeUserToPlanSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
}).openapi("SubscribeUserToPlanRequest");

const SubscribeUserToPlanResponseSchema = z.object({
  success: z.boolean(),
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
  error: z.string().optional(),
}).openapi("SubscribeUserToPlanResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions/subscribe",
      tags: ["User Subscriptions"],
      description: "Subscribe a user to a plan",
      request: {
        body: {
          content: {
            "application/json": {
              schema: SubscribeUserToPlanSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: "User subscribed successfully",
          content: {
            "application/json": { schema: SubscribeUserToPlanResponseSchema },
          },
        },
        400: {
          description: "Bad request or business logic error",
          content: {
            "application/json": { schema: SubscribeUserToPlanResponseSchema },
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
        const body = SubscribeUserToPlanSchema.parse(bodyJson);

        const result = await billingService.subscribeUserToPlan(
          body.userId,
          body.planId,
          body.periodStart,
          body.periodEnd
        );

        if (!result.success) {
          return c.json(result, 400);
        }

        return c.json(result, 201);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to subscribe user to plan" });
      }
    }
  ); 