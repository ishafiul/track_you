import { drizzle } from "drizzle-orm/singlestore";

export type DB = ReturnType<typeof getDb>;

export function getDb(env: Env) {
  return drizzle(env.POSTGRES_CONNECTION_STRING, {
  });
}
