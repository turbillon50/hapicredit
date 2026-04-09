import { Router, type IRouter } from "express";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, inviteCodesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";
import { sendInviteCodeEmail } from "../lib/email";

const router: IRouter = Router();

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
}

// Generate invite code (admin → executive, executive → client)
router.post("/invite-codes/generate", requireAuth, async (req, res): Promise<void> => {
  const { role } = req.body;

  const userRole = req.userRole;

  // Validate role hierarchy
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

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

// List codes I created
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
    .where(eq(inviteCodesTable.createdById, req.userId!));

  res.json(codes);
});

// Validate a code (public — used before registration)
router.get("/invite-codes/validate/:code", async (req, res): Promise<void> => {
  const { code } = req.params;
  const now = new Date();

  const [found] = await db
    .select()
    .from(inviteCodesTable)
    .where(
      and(
        eq(inviteCodesTable.code, code.toUpperCase()),
        eq(inviteCodesTable.isActive, true),
        isNull(inviteCodesTable.usedById),
        gt(inviteCodesTable.expiresAt, now),
      )
    );

  if (!found) {
    res.status(404).json({ error: "Código inválido, usado o expirado" });
    return;
  }

  // If admin code, check max 2 admins
  if (found.role === "admin") {
    const adminCount = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    if (adminCount.length >= 2) {
      res.status(400).json({ error: "Límite de administradores alcanzado" });
      return;
    }
  }

  res.json({ valid: true, role: found.role });
});

// Request a code (public — no auth needed, generates a client code)
router.post("/invite-codes/request", async (req, res): Promise<void> => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  const [newCode] = await db.insert(inviteCodesTable).values({
    code,
    role: "client",
    createdById: null,
    parentId: null,
    isActive: true,
    expiresAt,
  }).returning();

  res.json({ code: newCode.code, expiresAt: newCode.expiresAt });
});

// Send invite code by email
router.post("/invite-codes/send-email", requireAuth, async (req, res): Promise<void> => {
  const { code, toEmail, toName } = req.body;
  if (!code || !toEmail) {
    res.status(400).json({ error: "Se requiere codigo y correo destino" });
    return;
  }

  const now = new Date();
  const [found] = await db
    .select({ code: inviteCodesTable.code, role: inviteCodesTable.role, expiresAt: inviteCodesTable.expiresAt, createdById: inviteCodesTable.createdById })
    .from(inviteCodesTable)
    .where(
      and(
        eq(inviteCodesTable.code, code.toUpperCase()),
        eq(inviteCodesTable.isActive, true),
        isNull(inviteCodesTable.usedById),
        gt(inviteCodesTable.expiresAt, now),
      )
    );

  if (!found) {
    res.status(404).json({ error: "Codigo invalido, usado o expirado" });
    return;
  }

  // Verify ownership
  if (found.createdById !== req.userId) {
    res.status(403).json({ error: "No tienes permiso para compartir este codigo" });
    return;
  }

  const [inviter] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, req.userId!));

  await sendInviteCodeEmail({
    to: toEmail,
    inviteeName: toName,
    code: found.code,
    role: found.role,
    inviterName: inviter?.fullName || "HapiCredit",
    expiresAt: found.expiresAt,
  });

  res.json({ success: true });
});

export default router;
