import {createRoute, z} from "@hono/zod-openapi";
import {HonoApp} from "../../../type";
import {HTTPException} from "hono/http-exception";
import {authMiddleware} from "../../../middleware/auth";
import {Permission} from "permission-manager-worker/src/entity/schema";

// Request schema
const CheckBlogPermissionsParamsSchema = z.object({
  blogId: z.string().min(1)
}).openapi('CheckBlogPermissionsParamsDto');

// Response schema
const CheckBlogPermissionsResponseSchema = z.object({
  permissions: z.array(z.enum(['view', 'edit', 'admin', 'delete', 'create', 'owner'])),
  allowed: z.record(z.enum(['view', 'edit', 'admin', 'delete', 'create', 'owner']), z.boolean())
}).openapi('CheckBlogPermissionsResponseDto');

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: 'get',
      path: '/permissions/blog/{blogId}/check',
      security: [{AUTH: []}],
      tags: ['Permissions'],
      middleware: [authMiddleware],
      request: {
        params: CheckBlogPermissionsParamsSchema
      },
      responses: {
        200: {
          description: 'Successfully checked blog permissions',
          content: {
            'application/json': {
              schema: CheckBlogPermissionsResponseSchema,
              example: {
                permissions: ['view', 'edit'],
                allowed: {
                  view: true,
                  edit: true,
                  delete: false,
                  create: false,
                  admin: false,
                  owner: false
                }
              }
            },
          },
        }
      },
    }),
    async (c) => {
      try {
        const permissionService = await c.env.PERMISSION_MANAGER.newPermissionManager();
        const { blogId } = c.req.valid('param');
        const user = c.get('user');
        
        if (!user?.id) {
          throw new HTTPException(401, { message: 'Unauthorized' });
        }
        
        // Check all possible permissions
        const allPermissions: Permission[] = ['view', 'edit', 'admin', 'delete', 'create', 'owner'];
        
        // Check each permission in parallel
        const results = await Promise.all(
          allPermissions.map(async (permission) => {
            const result = await permissionService.checkPermission({
              user: user.id,
              type: 'blog',
              id: blogId,
              permission,
              bypassCache: false
            });
            return { permission, allowed: result.allowed, allPermissions: result.permissions };
          })
        );
        
        // Collect all unique permissions the user has
        const uniquePermissions = new Set<Permission>();
        results.forEach(result => {
          if (result.allowed) {
            uniquePermissions.add(result.permission);
          }
          result.allPermissions.forEach(p => uniquePermissions.add(p));
        });
        
        // Create the allowed map
        const allowed = Object.fromEntries(
          allPermissions.map(permission => [
            permission,
            results.find(r => r.permission === permission)?.allowed || false
          ])
        );
        
        return c.json({
          permissions: Array.from(uniquePermissions),
          allowed
        }, 200);
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        if (error instanceof Error) {
          throw new HTTPException(400, { message: error.message });
        }
        throw new HTTPException(500, { message: 'An unexpected error occurred' });
      }
    }
  ); 