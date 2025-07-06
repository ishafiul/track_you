import { WorkerEntrypoint } from "cloudflare:workers";
import { Bindings } from "./config/bindings";
import { AnalyticsManager } from "./service/analyticsService";

export class AnalyticsService extends WorkerEntrypoint<Bindings> {
  async analyticsManager() {
    return new AnalyticsManager(this.env);
  }
}

export default {
  fetch() {
    return new Response("Analytics Service");
  }
}; 