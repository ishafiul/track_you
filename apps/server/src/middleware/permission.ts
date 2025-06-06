import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { HonoContext } from "../type";
import {Permission, PermissionDocType} from "../../../workers/permission-manager/src/entity/schema";


export const permissionMiddleware = (type: PermissionDocType, permission: Permission, getResourceId: (c: HonoContext) => string) =>
  createMiddleware(async (c: HonoContext, next) => {
    const user = c.get("user");
    if (!user) throw new HTTPException(401, { message: "Unauthorized: No user" });

    const id = getResourceId(c); // e.g. from params, body, etc.
    const pm = await c.env.PERMISSION_MANAGER.newPermissionManager();
    const result = await pm.checkPermission({
      user: user.id,
      type,
      id,
      permission,
      bypassCache: false,
    });

    if (!result.allowed) throw new HTTPException(403, { message: "Forbidden" });
    await next();
  });
