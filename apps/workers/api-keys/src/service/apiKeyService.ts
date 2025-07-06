import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  apiKeys,
  apiKeyUsage,
  InsertApiKey,
  SelectApiKey,
  InsertApiKeyUsage,
  SelectApiKeyUsage,
} from "../../drizzle/schema";
import { Bindings } from "../config/bindings";

export class ApiKeyManager {
  private db: ReturnType<typeof drizzle>;

  constructor(private env: Bindings) {
    const client = createClient({
      url: env.TURSO_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    this.db = drizzle(client);
  }

  // Generate a new API key
  async generateApiKey(params: {
    userId: string;
    name: string;
    permissions: string[];
    expiresAt?: Date;
  }): Promise<{ success: boolean; data?: { apiKey: string; keyId: string }; error?: string }> {
    try {
      const keyId = uuidv4();
      const apiKey = this.generateSecureApiKey();
      const keyHash = await this.hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 12);

      const newApiKey: InsertApiKey = {
        id: keyId,
        userId: params.userId,
        name: params.name,
        keyHash,
        keyPrefix,
        permissions: JSON.stringify(params.permissions),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: params.expiresAt || null,
      };

      await this.db.insert(apiKeys).values(newApiKey);

      return {
        success: true,
        data: { apiKey, keyId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate API key",
      };
    }
  }

  // Validate an API key
  async validateApiKey(apiKey: string): Promise<{
    success: boolean;
    data?: SelectApiKey;
    error?: string;
  }> {
    try {
      const keyHash = await this.hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 12);

      const result = await this.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyHash, keyHash),
            eq(apiKeys.keyPrefix, keyPrefix),
            eq(apiKeys.isActive, true)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return { success: false, error: "Invalid API key" };
      }

      const apiKeyData = result[0];
      if (!apiKeyData) {
        return { success: false, error: "Invalid API key" };
      }

      // Check if key is expired
      if (apiKeyData.expiresAt && new Date() > new Date(apiKeyData.expiresAt)) {
        return { success: false, error: "API key expired" };
      }

      // Update last used timestamp
      await this.db
        .update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, apiKeyData.id));

      return { success: true, data: apiKeyData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate API key",
      };
    }
  }

  // Get all API keys for a user
  async getUserApiKeys(userId: string): Promise<{
    success: boolean;
    data?: SelectApiKey[];
    error?: string;
  }> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt));

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user API keys",
      };
    }
  }

  // Revoke an API key
  async revokeApiKey(
    userId: string,
    keyId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.db
        .update(apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to revoke API key",
      };
    }
  }

  // Log API key usage
  async logUsage(params: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    responseStatus: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const usageRecord: InsertApiKeyUsage = {
        id: uuidv4(),
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        method: params.method,
        responseStatus: params.responseStatus,
        requestCount: 1,
        timestamp: new Date(),
      };

      await this.db.insert(apiKeyUsage).values(usageRecord);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to log API usage",
      };
    }
  }

  // Get API key usage statistics
  async getUsageStats(apiKeyId: string): Promise<{
    success: boolean;
    data?: SelectApiKeyUsage[];
    error?: string;
  }> {
    try {
      const result = await this.db
        .select()
        .from(apiKeyUsage)
        .where(eq(apiKeyUsage.apiKeyId, apiKeyId))
        .orderBy(desc(apiKeyUsage.timestamp));

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get usage stats",
      };
    }
  }

  private generateSecureApiKey(): string {
    const prefix = "tk_";
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const key = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return prefix + key;
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
