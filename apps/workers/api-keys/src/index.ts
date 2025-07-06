import { WorkerEntrypoint } from "cloudflare:workers";
import { Bindings } from "./config/bindings";
import { ApiKeyManager } from "./service/apiKeyService";

export class ApiKeyService extends WorkerEntrypoint<Bindings> {
  async apiKeyManager() {
    return new ApiKeyManager(this.env);
  }
}

export default {
  fetch() {
    return new Response("API Key Manager Service");
  }
}; 