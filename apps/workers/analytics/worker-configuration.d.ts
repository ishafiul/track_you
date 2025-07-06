import { AnalyticsService } from "./src/index";

declare module "cloudflare:workers" {
  interface CloudflareBindings {
    ANALYTICS_SERVICE: Service<AnalyticsService>;
  }
}

declare global {
  interface Service<T> {
    new (): T;
  }
}
