import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/admin/purge-all-data", async (req, res): Promise<void> => {
  const secret = req.headers["x-purge-key"];
  const expected = process.env.CLERK_SECRET_KEY;

  if (!expected || secret !== expected) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.execute(sql`
    TRUNCATE TABLE
      caja_movements,
      payments,
      commitments,
      notes,
      alerts,
      credits,
      clients,
      sessions,
      invite_codes,
      public_requests,
      users
    RESTART IDENTITY CASCADE
  `);

  res.json({ ok: true, message: "All data purged successfully" });
});

export default router;
