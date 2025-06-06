import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schemas';
import {Env} from "../type";

export type DB = ReturnType<typeof getDb>;

export function getDb(env: Env) {
  return drizzle(env.POSTGRES_CONNECTION_STRING, {
    schema,
  });
}
