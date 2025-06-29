import {HonoContext} from "../type";
export function getBaseUrl(c: HonoContext) {
  const workerUrl = new URL(c.req.url);
  const workerOrigin = workerUrl.origin;
  const workerHost = workerUrl.host;
  const workerDomain = workerHost.split('.').slice(-2).join('.');

  return {
    workerUrl,
    workerOrigin,
    workerHost,
    workerDomain,
  };
}
