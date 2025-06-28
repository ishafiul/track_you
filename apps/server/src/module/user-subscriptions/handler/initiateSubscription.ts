import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from 'uuid';

// Request schema for initiating subscription
const InitiateSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'yearly']),
  userEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).openapi("InitiateSubscriptionRequest");

// Response schema
const InitiateSubscriptionResponseSchema = z.object({
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
    stripePaymentLinkId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  checkoutUrl: z.string().optional(),
  error: z.string().optional(),
}).openapi("InitiateSubscriptionResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions/initiate",
      tags: ["User Subscriptions"],
      description: "Initiate subscription process with specific billing cycle - creates pending subscription and returns checkout URL",
      request: {
        body: {
          content: {
            "application/json": {
              schema: InitiateSubscriptionSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Subscription initiated successfully",
          content: {
            "application/json": { schema: InitiateSubscriptionResponseSchema },
          },
        },
        400: {
          description: "Bad request or business logic error",
          content: {
            "application/json": { schema: InitiateSubscriptionResponseSchema },
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
        const body = InitiateSubscriptionSchema.parse(bodyJson);

        // Check if user already has an active subscription
        const existingSubscription = await billingService.getUserActiveSubscription(body.userId);
        if (existingSubscription) {
          return c.json({
            success: false,
            error: 'User already has an active subscription'
          }, 400);
        }

        // Get the subscription plan
        const plan = await billingService.getSubscriptionPlan(body.planId);
        if (!plan) {
          return c.json({
            success: false,
            error: 'Subscription plan not found'
          }, 400);
        }

        // Check if pricing exists for the billing cycle
        const pricing = await billingService.getPlanPricingByPlanAndCycle(body.planId, body.billingCycle);
        if (!pricing) {
          return c.json({
            success: false,
            error: `Pricing not found for ${body.billingCycle} billing cycle`
          }, 400);
        }

        // Create pending subscription in database
        const subscriptionData = {
          id: uuidv4(),
          userId: body.userId,
          planId: body.planId,
          billingCycle: body.billingCycle,
          status: 'incomplete' as const,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + (body.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          stripePaymentLinkId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const subscription = await billingService.createUserSubscription(subscriptionData);

        // Create Stripe checkout session
        const checkoutResult = await billingService.createCheckoutSession(
          body.planId,
          body.billingCycle,
          body.userEmail,
          `${body.successUrl}?subscription_id=${subscription.id}`,
          body.cancelUrl
        );

        if (!checkoutResult.success) {
          // Clean up the subscription if checkout creation fails
          await billingService.deleteUserSubscription(subscription.id);
          return c.json({
            success: false,
            error: checkoutResult.error
          }, 400);
        }

        return c.json({
          success: true,
          subscription,
          checkoutUrl: checkoutResult.checkoutUrl
        }, 201);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to initiate subscription" });
      }
    }
  ); 