import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../../../middleware/auth";
import { getBaseUrl } from "../../../utils/url";

// Request schema for creating payment link
const CreatePaymentLinkSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).openapi("CreatePaymentLinkRequest");

// Response schema
const CreatePaymentLinkResponseSchema = z.object({
  success: z.boolean(),
  paymentLink: z.string().optional(),
  error: z.string().optional(),
}).openapi("CreatePaymentLinkResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/subscription-plans/payment-link",
      tags: ["Subscription Plans"],
      security: [{AUTH: []}],
      middleware: [authMiddleware],
      description: "Create a Stripe payment link for a subscription plan with specific billing cycle",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CreatePaymentLinkSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Payment link created successfully",
          content: {
            "application/json": { schema: CreatePaymentLinkResponseSchema },
          },
        },
        400: {
          description: "Bad request or plan not found",
          content: {
            "application/json": { schema: CreatePaymentLinkResponseSchema },
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
        const body = CreatePaymentLinkSchema.parse(bodyJson);
        const { workerUrl,workerHost } = getBaseUrl(c);
        const payload = c.get('auth');
        if (!payload?.userId) {
          throw new HTTPException(401, { message: 'Unauthorized' });
        }
        const result = await billingService.createPaymentLinkForPlan({
          planId: body.planId,
          billingCycle: body.billingCycle,
          successUrl: body.successUrl,
          cancelUrl: body.cancelUrl,
          metadata: {
            host: workerHost,
            userId: payload?.userId,
            planId: body.planId,
            billingCycle: body.billingCycle
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
          paymentLink: result.paymentLink
        }, 200);
      } catch (error) {
        throw new HTTPException(500, { message: "Failed to create payment link" });
      }
    }
  ); 