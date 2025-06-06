# NextJS Middleware Helper

A utility package for composing and stacking NextJS middleware functions.

## Usage

```typescript
import { stackMiddlewares, MiddlewareFactory } from 'middleware';
import { NextResponse } from 'next/server';

// Create your middleware functions
const withAuth: MiddlewareFactory = (next) => async (request) => {
  // Your auth logic here
  return next(request);
};

const withLogging: MiddlewareFactory = (next) => async (request) => {
  console.log(`Request: ${request.url}`);
  return next(request);
};

// Compose middleware
export default stackMiddlewares([withLogging, withAuth]);
```
