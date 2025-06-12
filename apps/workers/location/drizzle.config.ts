import type { Config } from "drizzle-kit";

require("dotenv").config();
export default {
	schema: "./drizzle/schema.ts",
	out: "./drizzle/migrations",
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.POSTGRES_CONNECTION_STRING!,
	},
} satisfies Config;
