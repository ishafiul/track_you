import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const CompleteSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  stripeSubscriptionId: z.string().min(1),
  stripeCustomerId: z.string().min(1),
}).openapi("CompleteSubscriptionRequest");

const CompleteSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  subscription: z.object({
    id: z.string(),
    userId: z.string(),
    planId: z.string(),
    status: z.string(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    cancelAtPeriodEnd: z.boolean(),
    stripeSubscriptionId: z.string().nullable(),
    stripeCustomerId: z.string().nullable(),
    stripePaymentLinkId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
}).openapi("CompleteSubscriptionResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions/complete",
      tags: ["User Subscriptions"],
      description: "Complete subscription after successful Stripe payment",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CompleteSubscriptionSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Subscription completed successfully",
          content: {
            "application/json": { schema: CompleteSubscriptionResponseSchema },
          },
        },
        400: {
          description: "Bad request or business logic error",
          content: {
            "application/json": { schema: CompleteSubscriptionResponseSchema },
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
        const body = CompleteSubscriptionSchema.parse(bodyJson);

        // Get the pending subscription
        const subscription = await billingService.getUserSubscription(body.subscriptionId);
        if (!subscription) {
          return c.json({
            success: false,
            error: 'Subscription not found'
          }, 400);
        }

        if (subscription.status !== 'incomplete') {
          return c.json({
            success: false,
            error: 'Subscription is not in pending state'
          }, 400);
        }

        // Complete the subscription with Stripe data
        const result = await billingService.handleStripeSubscriptionSuccess(
          body.stripeSubscriptionId,
          body.stripeCustomerId,
          subscription.planId,
          subscription.userId
        );

        if (!result.success) {
          return c.json({
            success: false,
            error: result.error
          }, 400);
        }

        // Delete the old pending subscription and return the new active one
        await billingService.deleteUserSubscription(body.subscriptionId);

        return c.json({
          success: true,
          subscription: result.subscription
        }, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to complete subscription" });
      }
    }
  ); 