import { HonoContext } from '../type';
import { jwt } from 'hono/jwt';
import { Next } from 'hono';
import { SelectAuth } from '../../../workers/auth/drizzle/schema';
import { HTTPException } from 'hono/http-exception';
import { UserEntity } from '../../../workers/user/src/entity/user';

export const authMiddleware = async (c: HonoContext, next: Next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET! });
  await jwtMiddleware(c, async () => {
    const payload = c.get('jwtPayload');
    if (!payload || !payload.authID) {
      throw new HTTPException(401, { message: 'Invalid JWT payload' });
    }
    const cache = caches.default;
    const userIdCacheKey = `https://auth-service.midleware/userId:${payload.authID}`;
    const userCacheKey = `https://auth-service.midleware/user:${payload.authID}`;

    // Try cache first
    let authInfo: SelectAuth | null | undefined = await cache
      .match(userIdCacheKey)
      ?.then((res) => res?.json());
    let user: UserEntity | null | undefined = await cache
      .match(userCacheKey)
      ?.then((res) => res?.json());

    // TODO: need to check last refresh time authenticated based on that

    if (!authInfo || !user) {
      const authService = await c.env.AUTH_SERVICE.newAuth();
      const userService = await c.env.USER_SERVICE.newUser();
      authInfo = await authService.findAuthByAuthId(payload.authID);
      // Cache results
      if (authInfo) {
        user = await userService.findUserById(authInfo.userId);
        c.executionCtx.waitUntil(
          cache.put(
            userIdCacheKey,
            new Response(JSON.stringify(authInfo), {
              headers: {
                'content-type': 'application/json',
                'cache-control': 'max-age=7200',
              },
            })
          )
        );
      }
      if (user) {
        c.executionCtx.waitUntil(
          cache.put(
            userCacheKey,
            new Response(JSON.stringify(user), {
              headers: {
                'content-type': 'application/json',
                'cache-control': 'max-age=7200',
              },
            })
          )
        );
      }
    }

    c.set('user', user);
    c.set('auth', authInfo);
    await next();
  });
};
