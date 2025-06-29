import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Skip middleware for static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) {
    return next();
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard'];
  
  // Routes that should redirect to dashboard if authenticated
  const authRoutes = ['/login'];

  // Check if user is authenticated (client-side check will be done in the page)
  // This is just for initial routing logic
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Let the page handle the auth check and redirect
    return next();
  }

  if (authRoutes.some(route => pathname.startsWith(route))) {
    // Let the page handle the auth check and redirect
    return next();
  }

  return next();
});

