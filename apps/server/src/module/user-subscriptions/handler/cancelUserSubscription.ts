import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

const CancelSubscriptionRequestSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(true),
}).openapi("CancelSubscriptionRequest");

const CancelSubscriptionResponseSchema = z.object({
  success: z.boolean(),
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
  message: z.string().optional(),
  error: z.string().optional(),
}).openapi("CancelSubscriptionResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "patch",
      path: "/user-subscriptions/{id}/cancel",
      tags: ["User Subscriptions"],
      description: "Cancel user subscription - cancels in Stripe and reverts to free plan",
      request: { 
        params: z.object({ id: z.string() }),
        body: {
          content: {
            "application/json": {
              schema: CancelSubscriptionRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Subscription canceled successfully",
          content: { 
            "application/json": { schema: CancelSubscriptionResponseSchema },
          },
        },
        400: {
          description: "Bad request",
          content: { 
            "application/json": { schema: CancelSubscriptionResponseSchema },
          },
        },
        404: {
          description: "Subscription not found",
          content: { 
            "application/json": { schema: CancelSubscriptionResponseSchema },
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
        const bodyJson = await c.req.json();
        const body = CancelSubscriptionRequestSchema.parse(bodyJson);
        const billingService = await c.env.BILLING_SERVICE.billing();

        // Get the subscription
        const subscription = await billingService.getUserSubscription(id);
        if (!subscription) {
          return c.json({
            success: false,
            error: 'Subscription not found'
          }, 404);
        }

        // Check if subscription is already canceled
        if (subscription.status === 'canceled') {
          return c.json({
            success: false,
            error: 'Subscription is already canceled'
          }, 400);
        }

        // Check if it's a free plan - free plans cannot be canceled
        if (subscription.planId === 'free-plan') {
          return c.json({
            success: false,
            error: 'Free plan cannot be canceled'
          }, 400);
        }

        // Cancel subscription in Stripe if it has a Stripe subscription ID
        if (subscription.stripeSubscriptionId) {
          const stripeResult = await billingService.cancelSubscriptionInStripe(
            subscription.id,
            body.cancelAtPeriodEnd
          );

          if (!stripeResult.success) {
            return c.json({
              success: false,
              error: stripeResult.error || 'Failed to cancel subscription in Stripe'
            }, 400);
          }

          const message = body.cancelAtPeriodEnd 
            ? 'Subscription will be canceled at the end of the current billing period'
            : 'Subscription canceled immediately';

          return c.json({
            success: true,
            subscription: stripeResult.subscription,
            message
          }, 200);
        } else {
          // For local subscriptions without Stripe (shouldn't happen in normal flow)
          const canceledSubscription = await billingService.cancelUserSubscription(id, body.cancelAtPeriodEnd);
          
          if (!canceledSubscription) {
            return c.json({
              success: false,
              error: 'Failed to cancel subscription'
            }, 400);
          }

          return c.json({
            success: true,
            subscription: canceledSubscription,
            message: 'Subscription canceled successfully'
          }, 200);
        }
      } catch (error) {
        console.error('Error canceling subscription:', error);
        throw new HTTPException(500, { message: "Failed to cancel subscription" });
      }
    }
  ); 