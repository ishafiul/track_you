import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {adminMiddleware} from "../../../middleware/admin";
import {PermissionDocTypeSchema} from "permission-manager-worker/src/entity/schema";

// Request schema for setting permissions
export const SetPermissionSchema = z.object({
  subject: z.string().regex(/^user:[a-zA-Z0-9_-]+$|^group:[a-zA-Z0-9_-]+$/),
  type: PermissionDocTypeSchema,
  id: z.string().min(1), // Can be "*" for wildcard
  role: z.string().min(1),
  expires_at: z.number().nullable().optional()
}).openapi('SetPermissionDto');

export type SetPermissionDto = z.infer<typeof SetPermissionSchema>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'post',
      path: '/permissions/grant',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware, adminMiddleware],
      request: {
        body: {
          content: {
            'application/json': {
              schema: SetPermissionSchema,
              example: {
                subject: 'user:123',
                type: 'blog',
                id: '*', // Wildcard - applies to all blogs
                role: 'editor',
                expires_at: null
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Permission granted successfully',
          content: {
            'application/json': {
              schema: z.object({
                ok: z.boolean(),
              })
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string()
              })
            }
          }
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const payload = await c.req.json<SetPermissionDto>();
        
        // Pass directly to grantRole method - it already supports all we need
        const result = await permissionService.grantRole({
          subject: payload.subject,
          type: payload.type,
          id: payload.id, // Can be "*" for wildcard
          role: payload.role,
          expires_at: payload.expires_at ?? null
        });

        return c.json(result, 200);
      } catch (error) {
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  );
