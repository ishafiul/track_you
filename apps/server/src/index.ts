import { OpenAPIHono, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { HonoTypes } from './type';
import { Logger } from './utils/logger';
import { onError } from './utils/error';
import contentManagerRoute from './module/contenetManager/route';
import authRoute from './module/auth/route';
import userRoute from './module/user/route';
import permissionRoute from './module/permission/route';
import locationRoute from './module/location/route';
import subscriptionPlansRoute from './module/subscription-plans/route';
import userSubscriptionsRoute from './module/user-subscriptions/route';
import apiKeysRoute from './module/api-keys/route';
import analyticsRoute from './module/analytics/route';

const app = new OpenAPIHono<HonoTypes>();
app.use(logger());
app.get('/', async (c) => {
  const auth = await c.env.AUTH_SERVICE.newAuth();
  return c.text('Api Server');
});

const allowedOrigins = ['http://localhost:4321'];

app.use('*', cors());
app.openAPIRegistry.registerComponent('securitySchemes', 'AUTH', {
  type: 'http',
  name: 'Authorization',
  scheme: 'bearer',
  in: 'header',
  description: 'Bearer token',
});

// Original API docs for non-auth routes
app.doc('/doc', {
  info: {
    title: 'API Documentation',
    version: 'v1',
  },
  openapi: '3.1.0',
});

// UI for API docs
app.get('/docs', swaggerUI({ url: '/doc' }));

// UI for Auth API docs
app.get('/auth-docs', swaggerUI({ url: '/auth-api' }));

authRoute(app);
userRoute(app);
permissionRoute(app);
contentManagerRoute(app);
locationRoute(app);
subscriptionPlansRoute(app);
userSubscriptionsRoute(app);
apiKeysRoute(app);
analyticsRoute(app);

app.onError(async (err, c) => {
  const logger = new Logger('ROOT');
  return onError(logger, err, c);
});

export default app;
