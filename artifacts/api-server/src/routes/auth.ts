import { Router, type IRouter } from "express";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, usersTable, sessionsTable, inviteCodesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { LoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  const hash = hashPassword(password);
  if (user.passwordHash !== hash) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  res.json({
    token,
    user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role },
  });
});

// Register with invite code
router.post("/auth/register", async (req, res): Promise<void> => {
  const { code, username, password, fullName, email } = req.body;

  if (!code || !username || !password || !fullName) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  const now = new Date();

  const [inviteCode] = await db
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

  if (!inviteCode) {
    res.status(400).json({ error: "Código inválido, ya usado o expirado" });
    return;
  }

  if (inviteCode.role === "admin") {
    const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length >= 2) {
      res.status(400).json({ error: "Límite de administradores alcanzado" });
      return;
    }
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length) {
    res.status(400).json({ error: "Ese nombre de usuario ya existe" });
    return;
  }

  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: hashPassword(password),
    fullName,
    email: email || null,
    role: inviteCode.role,
    parentId: inviteCode.parentId,
    isActive: true,
  }).returning();

  await db.update(inviteCodesTable)
    .set({ usedById: newUser.id, usedAt: new Date(), isActive: false })
    .where(eq(inviteCodesTable.id, inviteCode.id));

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role },
  });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const token = req.headers.authorization?.slice(7);
  if (token) await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  res.json({ id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role });
});

export default router;
