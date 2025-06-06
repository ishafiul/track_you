import { NextMiddleware } from 'next/server';
import { MiddlewareFactory } from './types';
export declare function stackMiddlewares(
  functions?: MiddlewareFactory[],
  index?: number
): NextMiddleware;
