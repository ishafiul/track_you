import { z } from "@hono/zod-openapi";

export const GetContentSchema = z.object({
  path: z.string().describe("Path to the content file in the repository"),
}).openapi("GetContentRequest");

export type GetContentDto = z.infer<typeof GetContentSchema>; 