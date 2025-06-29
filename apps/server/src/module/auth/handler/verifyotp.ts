import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {sign} from "hono/jwt";
import {VerifyOtpDto, VerifyOtpSchema} from "auth-worker/src/dto/verify-otp.dto";
import {Permission, Role} from "permission-manager-worker/src/entity/schema";
import {ListRolesResponse} from "permission-manager-worker/src/dto/schema";

const VerifyOtpResponseSchema = z.object({
  accessToken: z.string(),
  userId: z.string(),
}).openapi("VerifyOtpResponse");

export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

// Helper function to ensure roles exist
async function ensureRolesExist(permissionService: any) {
  // Check and create viewer role if it doesn't exist
  const viewerRole = await permissionService.listRoles({ type: 'user' })
    .then((roles: ListRolesResponse) => roles.roles['viewer']);
  
  if (!viewerRole) {
    await permissionService.defineRole({
      type: 'user',
      role: 'viewer',
      permissions: ['view']
    });
  }

  // Check and create editor role if it doesn't exist
  const editorRole = await permissionService.listRoles({ type: 'user' })
    .then((roles: ListRolesResponse) => roles.roles['editor']);
  
  if (!editorRole) {
    await permissionService.defineRole({
      type: 'user',
      role: 'editor',
      permissions: ['edit'],
      inherits: ['viewer']
    });
  }

  // Check and create me role if it doesn't exist
  const meRole = await permissionService.listRoles({ type: 'user' })
    .then((roles: ListRolesResponse) => roles.roles['me']);
  
  if (!meRole) {
    await permissionService.defineRole({
      type: 'user',
      role: 'me',
      permissions: ['delete', 'owner'],
      inherits: ['editor']
    });
  }
}

// Helper function to ensure free plan exists and assign user to it
async function ensureUserHasFreePlan(billingService: any, userId: string) {
  try {
    // Check if user already has an active subscription
    const activeSubscription = await billingService.getUserActiveSubscription(userId);
    if (activeSubscription) {
      console.log(`User ${userId} already has active subscription:`, activeSubscription.id);
      return;
    }

    // Get all active plans to find the free plan
    const activePlans = await billingService.getActiveSubscriptionPlans();
    let freePlan = activePlans?.find((plan: any) => 
      plan.name.toLowerCase().includes('free')
    );

    // If no free plan exists, create one
    if (!freePlan) {
      console.log('No free plan found, creating default free plan...');
      const freePlanResult = await billingService.createSubscriptionPlanWithStripe({
        name: 'Free Plan',
        description: 'Free tier with basic features - automatically assigned to new users',
        featuresJson: JSON.stringify({
          features: [
            'Basic location tracking',
            '1,000 API requests per month',
            'Community support',
            'Basic dashboard access'
          ],
          limitations: [
            'Limited to 1,000 requests/month',
            'Basic rate limiting',
            'No premium features'
          ]
        }),
        apiRateLimit: 10, // 10 requests per minute
        maxRequestsPerMonth: 1000,
        monthlyPrice: 0,
        yearlyPrice: 0
      });

      if (freePlanResult.success && freePlanResult.plan) {
        freePlan = freePlanResult.plan;
      }

      if (!freePlan) {
        console.error('Failed to create or find free plan');
        return;
      }
    }

    // Create a free subscription for the user (no payment required)
    const currentDate = new Date();
    const nextYear = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    const subscriptionResult = await billingService.subscribeUserToPlan(
      userId,
      freePlan.id,
      'monthly', // Free plan uses monthly billing cycle
      currentDate.toISOString(),
      nextYear.toISOString()
    );

    if (subscriptionResult.success) {
      console.log(`Successfully assigned free plan to user ${userId}:`, subscriptionResult.subscription?.id);
    } else {
      console.error(`Failed to assign free plan to user ${userId}:`, subscriptionResult.error);
    }
  } catch (error) {
    console.error('Error in ensureUserHasFreePlan:', error);
    // Don't throw error here as it shouldn't block login
  }
}

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/auth/verifyOtp',
      tags: ['Auth'],
      request: {
        body: {
          content: {
            'application/json': {
              schema: VerifyOtpSchema,
              example: {
                email: 'shafiulislam20@gmail.com',
                deviceUuid: '2bf002f4-96e8-43a5-9d0c-38067886be6a',
                otp: 12345,
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Access Token',
          content: {
            'application/json': {schema: VerifyOtpResponseSchema},
          },
        },
      },
    }),
    async (c: HonoContext) => {
      const authService = await c.env.AUTH_SERVICE.newAuth();
      const userService = await c.env.USER_SERVICE.newUser();
      const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();

      // Parse and validate the request body
      const bodyJson = await c.req.json<VerifyOtpDto>();
      const body = VerifyOtpSchema.parse(bodyJson);

      // Find user, handle user not found
      const user = await userService.findUserOrCreate(body.email);
      if (!user) {
        throw new HTTPException(404, {message: 'User not found'});
      }

      // Verify OTP, handle invalid OTP scenario
      const auth = await authService.verifyOtp(body, user);
      if (!auth) {
        throw new HTTPException(401, {message: 'Invalid OTP'});
      }

      // Ensure roles exist and grant me role to user
      await ensureRolesExist(permissionService);
      await permissionService.grantRole({
        subject: `user:${user.id}`,
        type: 'user',
        id: user.id,
        role: 'me',
        expires_at: null
      });

      // Ensure user has a free plan if they don't have any active subscription
      if (c.env.BILLING_SERVICE) {
        try {
          const billingService = await c.env.BILLING_SERVICE.billing();
          // Run this asynchronously to not block the login response
          c.executionCtx.waitUntil(ensureUserHasFreePlan(billingService, user.id));
        } catch (error) {
          console.error('Failed to initialize billing service for free plan assignment:', error);
          // Don't block login if billing service fails
        }
      }

      // Create JWT payload
      const jwtPayload = {
        authID: auth.id,
      };

      // Sign and return the JWT
      const accessToken = await sign(jwtPayload, c.env.JWT_SECRET!);

      return c.json({accessToken, userId: user.id}, 200);
    }
  );
