import { Router, type IRouter } from "express";
import { db, inviteCodesTable, ne, sessionsTable, sql, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/admin/purge-demo-data", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const adminId = req.userId!;

  // Delete all financial / operational data
  await db.execute(sql`
    TRUNCATE TABLE
      caja_movements,
      payments,
      commitments,
      notes,
      alerts,
      credits,
      clients,
      public_requests
    RESTART IDENTITY CASCADE
  `);

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
