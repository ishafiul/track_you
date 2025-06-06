import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { GetContentSchema } from "../dto/getContent.dto";
import { Octokit } from "octokit";


const GetContentResponse = z.object({
  content: z.string(),
  sha: z.string(),
  path: z.string(),
}).openapi("GetContentResponse");

type GetContentResponseType = z.infer<typeof GetContentResponse>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "get",
      path: "/content",
      tags: ["Content"],
      security: [{AUTH: []}],
      description: "Get content from GitHub repository",
      request: {
        query: GetContentSchema,
      },
      responses: {
        200: {
          description: "Content retrieved successfully",
          content: {
            "application/json": {
              schema: GetContentResponse,
            },
          },
        },
      },
    }),
    async (c) => {
      const env = c.env;
      const query = c.req.query();
      const { path } = GetContentSchema.parse(query);

      const octokit = new Octokit({
        auth: env.GITHUB_TOKEN,
      });

      const { data } = await octokit.rest.repos.getContent({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        ref: env.GITHUB_BRANCH || "main",
      });

      if (!("content" in data)) {
        throw new HTTPException(404, { message: "Content not found" });
      }

      const content = atob(data.content);

      const responseData: GetContentResponseType = {
        content,
        sha: data.sha,
        path: data.path,
      };

      return c.json(responseData);
    }
  );
