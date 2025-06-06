import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Response schema for document types
const GetDocTypesResponseSchema = z.object({
  types: z.array(z.string())
}).openapi('GetDocTypesResponseDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/doc-types',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware], // Only requiring auth, not admin
      responses: {
        200: {
          description: 'Successfully retrieved document types',
          content: {
            'application/json': {
              schema: GetDocTypesResponseSchema,
              example: {
                types: ["user", "blog"]
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        // Extract the enum values from the schema definition
        // For a zod enum, we can get the enum values using the enum object
        const enumValues = Object.values(PermissionDocTypeSchema.enum);
        
        return c.json({
          types: enumValues
        }, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  );
