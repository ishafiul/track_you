import { OpenAPIHono } from '@hono/zod-openapi';
import { Context } from 'hono';
import { AuthService } from 'auth-worker/src';
import { UserService } from 'user-worker/src';
import { EmailService } from 'mail-worker/src';
import { PermissionService } from 'permission-manager-worker/src';
import { UserEntity } from 'user-worker/src/entity/user';
import { SelectAuth } from 'auth-worker/drizzle/schema';
import { LocationService } from 'location-worker/src';
import { BillingService } from 'billing-worker/src';
import { ApiKeyService } from '../../../workers/api-keys/src';
import { AnalyticsService } from '../../../workers/analytics/src';

export type Bindings = {
  ENVIRONMENT: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  BETTER_AUTH_SECRET: string;
  POSTGRES_CONNECTION_STRING: string;
  JWT_SECRET: string;
} & Services;

type Services = {
  AUTH_SERVICE: Service<AuthService>;
  USER_SERVICE: Service<UserService>;
  EMAIL_SERVICE: Service<EmailService>;
  PERMISSION_MANAGER: Service<PermissionService>;
  LOCATION_SERVICE: Service<LocationService>;
  BILLING_SERVICE: Service<BillingService>;
  API_KEY_SERVICE: Service<ApiKeyService>;
  ANALYTICS_SERVICE: Service<AnalyticsService>;
};

export type HonoTypes = {
  Bindings: Bindings;
  Variables: {
    user?: UserEntity | null | undefined;
    auth?: SelectAuth | null | undefined;
    apiKey?: any;
  };
};

export type HonoApp = OpenAPIHono<HonoTypes>;
export type HonoContext = Context<HonoTypes>;
