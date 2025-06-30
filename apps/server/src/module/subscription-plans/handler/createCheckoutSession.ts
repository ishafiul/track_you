import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../../../middleware/auth";
import { getBaseUrl } from "../../../utils/url";

// Request schema for creating checkout session
const CreateCheckoutSessionSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).openapi("CreateCheckoutSessionRequest");

// Response schema
const CreateCheckoutSessionResponseSchema = z.object({
  success: z.boolean(),
  checkoutUrl: z.string().optional(),
  error: z.string().optional(),
}).openapi("CreateCheckoutSessionResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/subscription-plans/checkout-session",
      tags: ["Subscription Plans"],
      security: [{AUTH: []}],
      middleware: [authMiddleware],
      description: "Create a Stripe checkout session for a subscription plan with metadata support",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CreateCheckoutSessionSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Checkout session created successfully",
          content: {
            "application/json": { schema: CreateCheckoutSessionResponseSchema },
          },
        },
        400: {
          description: "Bad request or plan not found",
          content: {
            "application/json": { schema: CreateCheckoutSessionResponseSchema },
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
        const body = CreateCheckoutSessionSchema.parse(bodyJson);
        const { workerUrl, workerHost } = getBaseUrl(c);
        const auth = c.get('auth');
        const user = c.get('user');
        
        if (!auth?.userId) {
          throw new HTTPException(401, { message: 'Unauthorized' });
        }

        const result = await billingService.createCheckoutSessionForPlan({
          planId: body.planId,
          billingCycle: body.billingCycle,
          userEmail: user?.email || '',
          successUrl: body.successUrl,
          cancelUrl: body.cancelUrl,
          metadata: {
            host: workerHost,
            userId: auth.userId,
            planId: body.planId,
            billingCycle: body.billingCycle,
            source: 'checkout_session'
          }
        });

        if (!result.success) {
          return c.json({
            success: false,
            error: result.error
          }, 400);
        }

        return c.json({
          success: true,
          checkoutUrl: result.checkoutUrl
        }, 200);
      } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new HTTPException(500, { message: "Failed to create checkout session" });
      }
    }
  ); 