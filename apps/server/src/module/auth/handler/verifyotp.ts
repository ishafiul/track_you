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

      // Create JWT payload
      const jwtPayload = {
        authID: auth.id,
      };

      // Sign and return the JWT
      const accessToken = await sign(jwtPayload, c.env.JWT_SECRET!);

      return c.json({accessToken, userId: user.id}, 200);
    }
  );
