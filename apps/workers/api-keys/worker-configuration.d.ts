import { ApiKeyService } from "./src/index";

declare module "cloudflare:workers" {
  interface CloudflareBindings {
    API_KEY_SERVICE: Service<ApiKeyService>;
  }
}

declare global {
  interface Service<T> {
    new (): T;
  }
}
