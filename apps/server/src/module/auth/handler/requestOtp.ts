import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {RequestOtpDto, RequestOtpSchema} from "auth-worker/src/dto/request-otp.dto";

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/auth/reqOtp',
      tags: ['Auth'],
      request: {
        body: {
          content: {
            'application/json': {
              schema: RequestOtpSchema,
              example: {
                email: 'shafiulislam20@gmail.com',
                deviceUuid: '2bf002f4-96e8-43a5-9d0c-38067886be6a',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'OTP sent successfully',
          content: {
            'application/json': {schema: z.object({message: z.string()})},
          },
        },
      },
    }),
    async (c: HonoContext) => {
      const auth = await c.env.AUTH_SERVICE.newAuth();
      const mailService = await c.env.EMAIL_SERVICE.newEmail();
      const userService = await c.env.USER_SERVICE.newUser();

      const bodyJson = await c.req.json<RequestOtpDto>();
      const body = RequestOtpSchema.parse(bodyJson);

      const user = await userService.findUserOrCreate(body.email);
      if (!user) {
        throw new HTTPException(404, {message: 'User not found'});
      }
      c.executionCtx.waitUntil(auth.reqOtp(body, user).then(value => mailService.sentOtp(body.email, value.otp)))
      return c.json({message: 'OTP sent successfully'}, 200);
    }
  );
