'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.stackMiddlewares = stackMiddlewares;
const server_1 = require('next/server');
function stackMiddlewares(functions = [], index = 0) {
  const current = functions[index];
  if (current) {
    const next = stackMiddlewares(functions, index + 1);
    return current(next);
  }
  return () => server_1.NextResponse.next();
}
