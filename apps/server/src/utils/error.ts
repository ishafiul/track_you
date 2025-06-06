import {Logger} from "./logger";
import {Context} from "hono";
import {HTTPException} from "hono/http-exception";

export function onError(logger: Logger, err: Error, c: Context) {
  if (isHTTPException(err)) {
    const {status, message} = err;

    logger.error('http exception', {message, status});
    return c.json({message: message || 'Something went wrong'}, status);
  }

  logger.error('error', {message: err.message, stack: err.stack, status: 500});
  return c.json({message: 'Internal Server Error'}, 500);
}

function isHTTPException(err: Error): err is HTTPException {
  return err.constructor.name.toLowerCase().includes('httpexception');
}
