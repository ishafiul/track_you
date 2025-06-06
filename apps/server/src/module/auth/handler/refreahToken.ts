import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {zValidator} from "@hono/zod-validator";
import {sign} from "hono/jwt";

const RefreshTokenResponseSchema = z.object({
    accessToken: z.string(),
}).openapi("RefreshTokenResponse");

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

const RefreshTokenDtoSchema = z.object({
    deviceUuid: z.string(),
}).openapi("RefreshTokenDto");

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

export default (app: HonoApp) =>
    app.openapi(
        createRoute({
            method: 'post',
            path: '/auth/refreshToken',
            tags: ['Auth'],
            middleware: [zValidator('json', z.object({deviceUuid: z.string()}))],
            request: {
                body: {
                    content: {
                        'application/json': {
                            schema: RefreshTokenDtoSchema,
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'New access token',
                    content: {
                        'application/json': {schema: RefreshTokenResponseSchema},
                    },
                },
            },

        }),
        // @ts-ignore
        async (c: HonoContext) => {
          const auth = await c.env.AUTH_SERVICE.newAuth();

            // Parse and validate the request body
            const bodyJson = await c.req.json<{ deviceUuid: string }>();
            const {deviceUuid} = z.object({deviceUuid: z.string()}).parse(bodyJson);

            // Find auth by device ID, throw if unauthorized
            const authResult = await auth.findAuthByDeviceId(deviceUuid);
            if (!authResult) {
                throw new HTTPException(401, {message: 'Unauthorized: Invalid device UUID'});
            }

            // Check if the auth can be refreshed, throw if not allowed
            const canRefresh = await auth.isCanRefresh(authResult.id);
            if (!canRefresh) {
                throw new HTTPException(401, {message: 'Unauthorized: Refresh not allowed'});
            }

            // Update the last refresh timestamp
            await auth.updateLastRefresh(authResult.id);

            // Create JWT payload and sign the token
            const jwtPayload = {
                authID: authResult.id,
                exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes expiration
            };
            const accessToken = await sign(jwtPayload, c.env.JWT_SECRET);

            // Return the new access token
            return c.json({accessToken}, 200);
        }
    );
