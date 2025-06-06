import { z } from "@hono/zod-openapi";

export const UpdateContentSchema = z.object({
  content: z.string().describe("Content to be updated"),
  path: z.string().describe("Path to the content file in the repository"),
  message: z.string().optional().describe("Commit message for the update"),
}).openapi("UpdateContentRequest");

export type UpdateContentDto = z.infer<typeof UpdateContentSchema>; 