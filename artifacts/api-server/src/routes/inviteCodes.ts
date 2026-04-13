import { Router, type IRouter } from "express";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import { db, inviteCodesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router: IRouter = Router();

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
}

// Generate invite code (admin → executive, exec → client)
router.post("/invite-codes/generate", requireAuth, async (req, res): Promise<void> => {
  const { role } = req.body;
  const userRole = req.userRole;

  if (userRole === "admin" && !["executive", "client"].includes(role)) {
    res.status(400).json({ error: "Admin solo puede generar códigos para asesores o acreditados" });
    return;
  }
  if (userRole === "executive" && role !== "client") {
    res.status(400).json({ error: "Asesor solo puede generar códigos para acreditados" });
    return;
  }
  if (userRole === "client") {
    res.status(403).json({ error: "Sin permiso para generar códigos" });
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const [newCode] = await db.insert(inviteCodesTable).values({
    code,
    role,
    createdById: req.userId!,
    parentId: req.userId!,
    isActive: true,
    expiresAt,
  }).returning();

  res.json({ code: newCode.code, role: newCode.role, expiresAt: newCode.expiresAt });
});

// List all codes I created
router.get("/invite-codes/mine", requireAuth, async (req, res): Promise<void> => {
  const codes = await db
    .select({
      id: inviteCodesTable.id,
      code: inviteCodesTable.code,
      role: inviteCodesTable.role,
      isActive: inviteCodesTable.isActive,
      expiresAt: inviteCodesTable.expiresAt,
      createdAt: inviteCodesTable.createdAt,
      usedAt: inviteCodesTable.usedAt,
      usedByName: usersTable.fullName,
    })
    .from(inviteCodesTable)
    .leftJoin(usersTable, eq(inviteCodesTable.usedById, usersTable.id))
    .where(eq(inviteCodesTable.createdById, req.userId!))
    .orderBy(inviteCodesTable.createdAt);

  res.json(codes);
});

// Deactivate / delete a code
router.delete("/invite-codes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [code] = await db.select().from(inviteCodesTable).where(eq(inviteCodesTable.id, id));
  if (!code) { res.status(404).json({ error: "Código no encontrado" }); return; }
  if (code.createdById !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "No tienes permiso" }); return;
  }

  await db.update(inviteCodesTable).set({ isActive: false }).where(eq(inviteCodesTable.id, id));
  res.json({ success: true });
});

// Validate a code (public — used before registration)
router.get("/invite-codes/validate/:code", async (req, res): Promise<void> => {
  const { code } = req.params;
  const now = new Date();

  const [found] = await db
    .select({
      id: inviteCodesTable.id,
      code: inviteCodesTable.code,
      role: inviteCodesTable.role,
      createdById: inviteCodesTable.createdById,
      parentId: inviteCodesTable.parentId,
      expiresAt: inviteCodesTable.expiresAt,
      creatorName: usersTable.fullName,
    })
    .from(inviteCodesTable)
    .leftJoin(usersTable, eq(inviteCodesTable.createdById, usersTable.id))
    .where(
      and(
        sql`lower(${inviteCodesTable.code}) = lower(${code})`,
        eq(inviteCodesTable.isActive, true),
        isNull(inviteCodesTable.usedById),
        gt(inviteCodesTable.expiresAt, now),
      )
    );

  if (!found) {
    res.status(404).json({ error: "Código inválido, usado o expirado" });
    return;
  }

  res.json({ valid: true, role: found.role, code: found.code, creatorName: found.creatorName });
});

export default router;
