import { Router } from "express";
import { db, sql } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router = Router();

// Liveness — does not touch the DB. Used by uptime monitors that should
// not wake a cold-started Postgres just to confirm the process is up.
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness — confirms DATABASE_URL is configured and Postgres responds.
// 200 on success, 503 on failure so load balancers route around bad instances.
router.get("/health", async (_req, res) => {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    res.json({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      demoMode: process.env.DEMO_MODE_ENABLED === "true",
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      database: "unreachable",
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
});

export default router;
