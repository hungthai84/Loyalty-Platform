import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file for local development/migrations.
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!sqlHost || !sqlDbName || !user || !password) {
  console.warn("SQL_ADMIN_* environment variables are missing. Drizzle Kit may not be able to connect to the database.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost || "",
    user: user || "",
    password: password || "",
    database: sqlDbName || "",
    ssl: false,
  },
  verbose: true,
});
