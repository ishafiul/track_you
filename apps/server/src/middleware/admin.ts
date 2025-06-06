import {createMiddleware} from "hono/factory"
import {HTTPException} from "hono/http-exception";
import {HonoContext} from "../type";

export const adminMiddleware = createMiddleware(async (c: HonoContext, next) => {
  const user = c.get('user');
  if (user?.role !== 'admin') {
    throw new HTTPException(401, {message: 'Unauthorized: User is not admin'});
  }
  await next()
})
