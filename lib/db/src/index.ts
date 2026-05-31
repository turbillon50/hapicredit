import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
export { and, asc, count, eq, getTableColumns, gt, gte, ilike, inArray, isNull, lte, ne, sql, sum } from "drizzle-orm";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __credetiPool: pg.Pool | undefined;
}

// Build the pool, or — if DATABASE_URL is missing — a stub that throws
// only on first method invocation. We avoid throwing at module load so
// the serverless function still cold-starts when env vars are absent
// (lets the static frontend + /api/healthz keep working in demo mode).
function makePool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (url) {
    return new Pool({
      connectionString: url,
      max: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return new Proxy({} as pg.Pool, {
    get(_target, prop) {
      // Drizzle's node-postgres adapter inspects a couple of well-known
      // properties; return undefined for those so it can construct cleanly.
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return () => {
        throw new Error(
          "DATABASE_URL is not set. Configure it in Vercel " +
            "Settings → Environment Variables before hitting DB-backed routes.",
        );
      };
    },
  });
}

export const pool: pg.Pool =
  globalThis.__credetiPool ?? (globalThis.__credetiPool = makePool());

export const db = drizzle(pool, { schema });

export * from "./schema";
