import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp, HonoContext } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from 'uuid';
// Response schema for a location item
const LocationItemSchema = z.object({
  id: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  altitude: z.string(),
  accuracy: z.string(),
  bearing: z.string(),
  timestamp: z.string(),
  userId: z.string(),
  subscriptionId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("LocationItem");

// Response schema for the get locations endpoint
const GetLocationsResponseSchema = z.object({
  success: z.boolean(),
  locations: z.array(LocationItemSchema),
}).openapi("GetLocationsResponse");

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/location/get",
      tags: ["Location"],
      description: "Endpoint to get user's location data",
      responses: {
        200: {
          description: "User's location data",
          content: {
            "application/json": { schema: GetLocationsResponseSchema },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": { schema: z.object({ message: z.string() }) },
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
      // Check if user is authenticated

      const locationService = await c.env.LOCATION_SERVICE.newLocation();
      const userId =uuidv4();

      const result = await locationService.getLocationsByUserId(userId);

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || "Failed to fetch location data" });
      }

      // Return data in the expected format
      return c.json({
        success: true,
        locations: result.locations || []
      }, 200);
    }
  );
