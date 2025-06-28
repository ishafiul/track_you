import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";

// Response schema
const WebhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
}).openapi("WebhookResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/user-subscriptions/webhook/stripe",
      tags: ["User Subscriptions"],
      description: "Handle Stripe webhook events for subscription updates",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.any(),
            },
          },
        },
        header: z.object({
          'stripe-signature': z.string(),
        }),
      },
      responses: {
        200: {
          description: "Webhook processed successfully",
          content: {
            "application/json": { schema: WebhookResponseSchema },
          },
        },
        400: {
          description: "Bad request or webhook verification failed",
          content: {
            "application/json": { schema: WebhookResponseSchema },
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
        
        // Get the raw body and signature
        const body = await c.req.text();
        const signature = c.req.header('stripe-signature');

        if (!signature) {
          return c.json({
            success: false,
            error: 'Missing stripe-signature header'
          }, 400);
        }

        // Handle the webhook
        const result = await billingService.handleStripeWebhook(body, signature);

        if (!result.success) {
          return c.json({
            success: false,
            error: result.error
          }, 400);
        }

        return c.json({
          success: true,
          message: result.message || 'Webhook processed successfully'
        }, 200);
      } catch (error) {
        console.error('Webhook error:', error);
        throw new HTTPException(500, { message: "Failed to process webhook" });
      }
    }
  ); 