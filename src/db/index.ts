import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to create a new connection pool using the environment variables provided by the platform.
export const createPool = () => {
  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  if (!host || !user || !password || !database) {
    const missing = [];
    if (!host) missing.push("SQL_HOST");
    if (!user) missing.push("SQL_USER");
    if (!password) missing.push("SQL_PASSWORD");
    if (!database) missing.push("SQL_DB_NAME");
    console.warn(`Database connection parameters are missing: ${missing.join(", ")}. Database functionality will be unavailable until provisioned.`);
  }

  return new Pool({
    host: host,
    user: user,
    password: password,
    database: database,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
// Note: We use the explicit extension .ts for ESM compatibility as per skill instructions.
export const db = drizzle(pool, { schema });
