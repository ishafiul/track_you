import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from '../type';

export const apiKeyAuthMiddleware = createMiddleware(async (c: HonoContext, next) => {
  const apiKey = c.req.header('x-api-key') || c.req.header('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    throw new HTTPException(401, { message: 'API key required' });
  }

  try {
    const apiKeyManager = await c.env.API_KEY_SERVICE.apiKeyManager();
    const result = await apiKeyManager.validateApiKey(apiKey);

    if (!result.success || !result.data) {
      throw new HTTPException(401, { message: result.error || 'Invalid API key' });
    }

    const apiKeyData = result.data;

    // Set minimal user context from API key using proper UserEntity structure
    const fakeUser = {
      id: apiKeyData.userId,
      email: '',
      firstName: null,
      lastName: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      avatar: null,
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    c.set('user', fakeUser);

    // Track API usage for analytics
    const analyticsManager = await c.env.ANALYTICS_SERVICE.analyticsManager();
    const startTime = Date.now();

    await next();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log API usage asynchronously
    const userAgent = c.req.header('user-agent');
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for');

    // Run analytics tracking without blocking the response
    analyticsManager
      .trackApiUsage({
        userId: apiKeyData.userId,
        apiKeyId: apiKeyData.id,
        endpoint: c.req.url,
        method: c.req.method,
        statusCode: c.res.status,
        responseTime,
        userAgent,
        ipAddress,
      })
      .catch((error) => {
        console.error('Failed to track API usage:', error);
      });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});
