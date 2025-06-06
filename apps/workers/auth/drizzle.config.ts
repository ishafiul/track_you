import type { Config } from "drizzle-kit";

require("dotenv").config();
console.log(process.env.TURSO_URL)
console.log(process.env.TURSO_AUTH_TOKEN)
export default {
	schema: "./drizzle/schema.ts",
	out: "./drizzle/migrations",
	dialect: "turso",
	dbCredentials: {
		url: process.env.TURSO_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
} satisfies Config;
