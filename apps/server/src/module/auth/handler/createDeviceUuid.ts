import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp, HonoContext} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {
  CreateDeviceUuidDto,
  CreateDeviceUuidSchema
} from "auth-worker/src/dto/create-device-uuid.dto";


const CreateDeviceUuidApiSchema = CreateDeviceUuidSchema.omit({
  ipAddress: true,
  city: true,
  countryCode: true,
  isp: true,
  colo: true,
  timezone: true
})

export type CreateDeviceUuidApiDto = z.infer<typeof CreateDeviceUuidApiSchema>;

const CreateDeviceUuidApiResponseSchema = z.object({deviceUuid: z.string()}).openapi('CreateDeviceUuidResponse')

export type CreateDeviceUuidApiEntity = z.infer<typeof CreateDeviceUuidApiResponseSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/auth/createDeviceUuid",
      tags: ["Auth"],
      description: "Endpoint to create a device UUID",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CreateDeviceUuidApiSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Respond with device UUID',
          content: {
            'application/json': {schema: CreateDeviceUuidApiResponseSchema},
          },
        },
      },
    }),
    async (c) => {

      const auth = await c.env.AUTH_SERVICE.newAuth();
      const cfData = c.req.raw['cf'] || {};
      const bodyJson = {
        ...await c.req.json(),
        ipAddress: c.req.header('cf-connecting-ip'),
        isp: cfData['asOrganization'] || null,
        colo: cfData['colo'] || null,
        longitude: cfData['longitude'] || null,
        latitude: cfData['latitude'] || null,
        timezone: cfData['timezone'] || null,
        countryCode: cfData['country'] || null,
        city: cfData['city'] || null,
      };
      const body = CreateDeviceUuidSchema.parse(bodyJson);

      const deviceUuidEntity = await auth.createDeviceUuid(body);
      if (!deviceUuidEntity) {
        throw new HTTPException(409, {message: 'Failed to create Device UUID'});
      }
      return c.json(deviceUuidEntity, 201);
    }
  );
