import { createRoute, z } from "@hono/zod-openapi";
import { HonoApp } from "../../../type";
import { HTTPException } from "hono/http-exception";
import { UpdateContentSchema } from "../dto/updateContent.dto";
import { Octokit } from "octokit";

const UpdateContentResponse = z.object({
  success: z.boolean(),
  sha: z.string().optional(),
  commit: z.string(),
}).openapi("UpdateContentResponse");

type UpdateContentResponseType = z.infer<typeof UpdateContentResponse>;

export default (app: HonoApp) =>
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/content",
      tags: ["Content"],
      description: "Update content in GitHub repository",
      request: {
        body: {
          content: {
            "application/json": {
              schema: UpdateContentSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Content updated successfully",
          content: {
            "application/json": {
              schema: UpdateContentResponse,
            },
          },
        },
      },
    }),
    async (c) => {
      const env = c.env;
      const body = await c.req.json();
      const { content, path, message } = UpdateContentSchema.parse(body);

      const octokit = new Octokit({
        auth: env.GITHUB_TOKEN,
      });

      // Get parameters for API call
      const repo = env.GITHUB_REPO;
      const owner = env.GITHUB_OWNER;
      const branch = env.GITHUB_BRANCH || "main";
      const commitMessage = message || `Update ${path}`;

      // First, get the current file to get its SHA
      let fileSha = "";
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });

        if ("sha" in fileData) {
          fileSha = fileData.sha;
        }
      } catch (error) {
        // File might not exist yet, which is fine for creating new files
        console.log("File does not exist yet, creating new file", error);
      }

      // Update or create the file
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: commitMessage,
        content: btoa(content),
        branch,
        ...(fileSha ? { sha: fileSha } : {}),
      });

      const responseData: UpdateContentResponseType = {
        success: true,
        sha: response.data.content?.sha,
        commit: response.data.commit.sha,
      };

      return c.json(responseData);
    }
  );
