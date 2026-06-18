import { Router } from "express";
import { db, sql } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.post("/admin/purge-demo-data", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const errors: string[] = [];

  // Safe whitelist — never interpolate user input
  const deleteOrder = [
    "support_tickets",
    "audit_log",
    "caja_movements",
    "payments",
    "commitments",
    "notes",
    "alerts",
    "credits",
    "clients",
    "public_requests",
    "invite_codes",
    "sessions",
  ];

  for (const table of deleteOrder) {
    try {
      // Drizzle raw SQL — table names are hardcoded above, not user input
      await db.execute({ sql: `DELETE FROM "${table}"`, params: [] } as any);
    } catch (e: any) {
      if (e?.message && !e.message.includes("does not exist")) {
        errors.push(`${table}: ${e.message}`);
      }
    }
  }

  // Delete non-admin users last (no FK deps at this point)
  try {
    await db.execute(sql`DELETE FROM users WHERE role != 'admin'`);
  } catch (e: any) {
    errors.push(`users: ${(e as any)?.message ?? "unknown"}`);
  }

  res.json({
    ok: errors.length === 0,
    message: "Base de datos limpiada. La cuenta de administrador se mantiene activa.",
    errors: errors.length > 0 ? errors : undefined,
  });
});

export default router;
