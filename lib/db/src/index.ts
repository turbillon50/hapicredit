import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Serverless-friendly pool. The pool is created once per warm Lambda and
// torn down at cold-start. `max: 1` keeps connection count bounded across
// many warm functions sharing the same DB.
declare global {
  // eslint-disable-next-line no-var
  var __credetiPool: pg.Pool | undefined;
}

export const pool: pg.Pool =
  globalThis.__credetiPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (!globalThis.__credetiPool) {
  globalThis.__credetiPool = pool;
}

export const db = drizzle(pool, { schema });

export * from "./schema";
