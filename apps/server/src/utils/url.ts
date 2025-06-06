import {HonoContext} from "../type";

export function getBaseUrl(c: HonoContext) {
  const workerUrl = new URL(c.req.url);
  const workerHost = workerUrl.origin;

  return {
    workerUrl,
    workerHost,
  };
}
