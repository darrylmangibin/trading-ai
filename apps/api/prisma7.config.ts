import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import {
  DatabaseConfigurationError,
  readMigrationConfiguration,
} from "./src/database/database.config.js";

if (process.env.NODE_ENV !== "test") {
  config({ path: fileURLToPath(new URL(".env", import.meta.url)), quiet: true });
}

const args = process.argv.slice(2);
const migration = args.includes("migrate");

// Command arguments, never an environment flag, select the mandatory migration guard.
if (
  migration &&
  args.some((argument) =>
    /^(?:--(?:url|shadow-database-url|schema|from[^=]*|to[^=]*)(?:=|$)|-s|--$)/u.test(argument),
  )
) {
  throw new DatabaseConfigurationError();
}

const datasource = migration
  ? readMigrationConfiguration(process.env.DATABASE_URL, process.env.SHADOW_DATABASE_URL)
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(datasource ? { datasource } : {}),
});
