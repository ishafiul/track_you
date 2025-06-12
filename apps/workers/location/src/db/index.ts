import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Env } from "../config/context";

export type DB = ReturnType<typeof getDb>;

export function getDb(env: Env) {
  neonConfig.fetchConnectionCache = true;
  const sql = neon(env.POSTGRES_CONNECTION_STRING);
  return drizzle(sql);
}
