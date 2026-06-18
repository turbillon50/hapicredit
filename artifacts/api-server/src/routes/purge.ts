import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.post("/admin/purge-demo-data", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const errors: string[] = [];
  const client = await pool.connect();

  try {
    // Delete in dependency order using raw pg client (avoids drizzle SQL builder issues)
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
    ];

    for (const table of deleteOrder) {
      try {
        await client.query(`DELETE FROM "${table}"`);
      } catch (e: any) {
        if (e?.message && !e.message.includes("does not exist")) {
          errors.push(`${table}: ${e.message}`);
        }
      }
    }

    // Sessions and users
    try {
      await client.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')`);
    } catch (e: any) { errors.push(`sessions: ${e?.message}`); }

    try {
      await client.query(`DELETE FROM users WHERE role != 'admin'`);
    } catch (e: any) { errors.push(`users: ${e?.message}`); }

  } finally {
    client.release();
  }

  res.json({
    ok: errors.length === 0,
    message: "Base de datos limpiada. La cuenta de administrador se mantiene activa.",
    errors: errors.length > 0 ? errors : undefined,
  });
});

export default router;
