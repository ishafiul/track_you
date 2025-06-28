import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import type { Bindings } from "../config/bindings";

export function getDb(env: Bindings): LibSQLDatabase {
	const url = env.TURSO_URL;
	if (!url) throw new Error("TURSO_URL is not defined");

	const authToken = env.TURSO_AUTH_TOKEN;
	if (!authToken) throw new Error("TURSO_AUTH_TOKEN is not defined");

	return drizzle(createClient({ url, authToken }));
}
