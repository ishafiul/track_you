import { MiddlewareFactory } from 'next-middleware-local';
import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from 'next/server';

export const authMiddleware: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    return next(request, _next);
  };
};
