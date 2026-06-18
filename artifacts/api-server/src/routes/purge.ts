import { Router } from "express";
import { db, eq, ne, sessionsTable, sql, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.post("/admin/purge-demo-data", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const adminId = req.userId!;

  // Delete all financial / operational data in dependency order
  const tables = [
    "support_tickets", "audit_log", "caja_movements", "payments",
    "commitments", "notes", "alerts", "credits", "clients", "public_requests"
  ];
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DELETE FROM ${table}`));
    } catch (_e) {
      // table may not exist yet — ignore
    }
  }
  // Reset sequences
  const seqTables = ["clients", "credits", "payments", "notes", "public_requests"];
  for (const table of seqTables) {
    try {
      await db.execute(sql.raw(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`));
    } catch (_e) { /* ignore */ }
  }

  // Delete sessions for non-admin users
  await db.execute(sql`
    DELETE FROM sessions
    WHERE user_id IN (
      SELECT id FROM users WHERE role != 'admin'
    )
  `);

  // Delete invite_codes created by non-admins
  await db.execute(sql`
    DELETE FROM invite_codes
    WHERE created_by_id IN (
      SELECT id FROM users WHERE role != 'admin'
    )
  `);

  // Delete non-admin users (executives, clients)
  await db.execute(sql`
    DELETE FROM users WHERE role != 'admin'
  `);

  res.json({ ok: true, message: "Datos demo eliminados. La cuenta de administrador se mantiene activa." });
});

export default router;
