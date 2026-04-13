import { Router, type IRouter } from "express";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, usersTable, sessionsTable, inviteCodesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { LoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { sendWelcomeEmail } from "../lib/email";

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
    user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, treeId: user.treeId },
  });
});

// ─── Register via invite code ─────────────────────────────────────────────────
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

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length) {
    res.status(400).json({ error: "Ese nombre de usuario ya existe" });
    return;
  }

  // Resolve treeId from parent
  let treeId: number | null = null;
  if (inviteCode.parentId) {
    const [parent] = await db.select({ treeId: usersTable.treeId, role: usersTable.role, id: usersTable.id }).from(usersTable).where(eq(usersTable.id, inviteCode.parentId));
    if (parent) {
      // If parent is admin, their treeId is their own id; propagate it
      treeId = parent.treeId ?? parent.id;
    }
  }

  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: hashPassword(password),
    fullName,
    email: email || null,
    role: inviteCode.role,
    parentId: inviteCode.parentId,
    treeId,
    isActive: true,
  }).returning();

  await db.update(inviteCodesTable)
    .set({ usedById: newUser.id, usedAt: new Date(), isActive: false })
    .where(eq(inviteCodesTable.id, inviteCode.id));

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  if (newUser.email) {
    sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }).catch(() => {});
  }

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId },
  });
});

// ─── Clerk sync ───────────────────────────────────────────────────────────────
router.post("/auth/clerk-sync", async (req, res): Promise<void> => {
  const { clerkId, email, fullName, role: requestedRole, inviteCode } = req.body;
  if (!email) { res.status(400).json({ error: "Se requiere email" }); return; }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (existingUser) {
    if (!existingUser.isActive) { res.status(401).json({ error: "Cuenta inactiva" }); return; }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: existingUser.id, token, expiresAt });
    res.json({ token, user: { id: existingUser.id, username: existingUser.username, fullName: existingUser.fullName, email: existingUser.email, role: existingUser.role, treeId: existingUser.treeId } });
    return;
  }

  if (!requestedRole || !inviteCode) {
    res.json({ needsCode: true });
    return;
  }

  const now = new Date();
  const [invCode] = await db.select().from(inviteCodesTable).where(
    and(
      eq(inviteCodesTable.code, inviteCode),
      eq(inviteCodesTable.isActive, true),
      isNull(inviteCodesTable.usedById),
      gt(inviteCodesTable.expiresAt, now),
    )
  );

  if (!invCode) {
    res.status(400).json({ error: "Código inválido, ya usado o expirado" });
    return;
  }

  let treeId: number | null = null;
  if (invCode.parentId) {
    const [parent] = await db.select({ treeId: usersTable.treeId, id: usersTable.id }).from(usersTable).where(eq(usersTable.id, invCode.parentId));
    if (parent) treeId = parent.treeId ?? parent.id;
  }

  const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  let username = emailPrefix;
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length) username = `${emailPrefix}_${Date.now().toString().slice(-4)}`;

  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: null as any,
    fullName: fullName || emailPrefix,
    email,
    role: requestedRole as string,
    parentId: invCode.parentId,
    treeId,
    isActive: true,
  }).returning();

  await db.update(inviteCodesTable)
    .set({ usedById: newUser.id, usedAt: new Date(), isActive: false })
    .where(eq(inviteCodesTable.id, invCode.id));

  if (newUser.email) {
    sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }).catch(() => {});
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  res.json({ token, user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId } });
});

// ─── Check staff master password (step 2 validation before reaching step 3) ──
router.post("/auth/check-staff-password", async (req, res): Promise<void> => {
  const { staffPassword } = req.body;
  const masterCode = process.env.STAFF_MASTER_CODE ?? "lulamijuvisado";
  if (staffPassword && staffPassword === masterCode) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: "Contraseña de acceso incorrecta" });
  }
});

// ─── Staff registration with master code (admin only = tree root) ─────────────
router.post("/auth/register-staff", async (req, res): Promise<void> => {
  const { staffPassword, role, username, password, fullName, email } = req.body;

  const masterCode = process.env.STAFF_MASTER_CODE ?? "lulamijuvisado";
  if (!staffPassword || staffPassword !== masterCode) {
    res.status(401).json({ error: "Contraseña de acceso incorrecta" });
    return;
  }

  if (role !== "executive" && role !== "admin") {
    res.status(400).json({ error: "Rol inválido para registro de staff" });
    return;
  }

  if (!username || !password || !fullName) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  // Admins with master code are tree roots. Max 2 independent admins (= 2 trees).
  if (role === "admin") {
    const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length >= 2) {
      res.status(400).json({ error: "Límite de 2 administradores alcanzado. Cada árbol tiene su propio admin." });
      return;
    }
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length) {
    res.status(400).json({ error: "Ese nombre de usuario ya está tomado" });
    return;
  }

  // Insert with treeId = null first, then update for admins (tree root = own id)
  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: hashPassword(password),
    fullName,
    email: email || null,
    role,
    parentId: null,
    treeId: null, // set below for admins
    isActive: true,
  }).returning();

  // Admin is the root of their own tree
  if (role === "admin") {
    await db.update(usersTable).set({ treeId: newUser.id }).where(eq(usersTable.id, newUser.id));
    newUser.treeId = newUser.id;
  }
  // Executives registered with master code: treeId remains null until admin assigns them
  // (They will be placed in a tree when admin generates an invite code for them)

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  if (newUser.email) {
    sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }).catch(() => {});
  }

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId },
  });
});

// ─── Client self-registration (requires invite code from executive) ────────────
router.post("/auth/register-client", async (req, res): Promise<void> => {
  const { username, password, fullName, email, inviteCode } = req.body;

  if (!username || !password || !fullName) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length) {
    res.status(400).json({ error: "Ese nombre de usuario ya está tomado" });
    return;
  }

  let parentId: number | null = null;
  let treeId: number | null = null;

  // If invite code provided, validate and resolve tree
  if (inviteCode) {
    const now = new Date();
    const [inv] = await db.select().from(inviteCodesTable).where(
      and(
        eq(inviteCodesTable.code, inviteCode.toUpperCase()),
        eq(inviteCodesTable.isActive, true),
        isNull(inviteCodesTable.usedById),
        gt(inviteCodesTable.expiresAt, now),
      )
    );
    if (inv && inv.role === "client") {
      parentId = inv.parentId;
      if (inv.parentId) {
        const [parent] = await db.select({ treeId: usersTable.treeId, id: usersTable.id }).from(usersTable).where(eq(usersTable.id, inv.parentId));
        if (parent) treeId = parent.treeId ?? parent.id;
      }
      // Mark code used after user created
      await db.update(inviteCodesTable).set({ isActive: false }).where(eq(inviteCodesTable.id, inv.id));
    }
  }

  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: hashPassword(password),
    fullName,
    email: email || null,
    role: "client",
    parentId,
    treeId,
    isActive: true,
  }).returning();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  if (newUser.email) {
    sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }).catch(() => {});
  }

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId },
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
  res.json({ id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, treeId: user.treeId });
});

export default router;
