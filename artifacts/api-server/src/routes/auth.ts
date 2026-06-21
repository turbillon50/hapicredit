import { Router } from "express";
import { and, db, eq, gt, inviteCodesTable, isNull, pool, sessionsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { LoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { sendWelcomeEmail } from "../lib/email";
import { isValidStaffCode, isValidSuperadminCode } from "../lib/staffCode";
import { logger } from "../lib/logger";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "credeti_salt").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const authUserColumns = {
  id: usersTable.id,
  username: usersTable.username,
  passwordHash: usersTable.passwordHash,
  fullName: usersTable.fullName,
  email: usersTable.email,
  role: usersTable.role,
  parentId: usersTable.parentId,
  treeId: usersTable.treeId,
  isActive: usersTable.isActive,
};

const publicAuthUserColumns = {
  id: usersTable.id,
  username: usersTable.username,
  fullName: usersTable.fullName,
  email: usersTable.email,
  role: usersTable.role,
  treeId: usersTable.treeId,
};

type MasterLoginUser = {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  treeId: number | null;
};

type AuthMeUser = MasterLoginUser & {
  isActive: boolean;
};

async function selectFlexibleUserById(userId: number): Promise<AuthMeUser | null> {
  const columnResult = await pool.query<{ column_name: string }>(
    "select attname as column_name from pg_attribute where attrelid = 'users'::regclass and attnum > 0 and not attisdropped",
  );
  const columns = new Set(columnResult.rows.map(row => row.column_name));
  if (!columns.has("id") || !columns.has("role")) {
    throw new Error("users.id and users.role columns are required");
  }

  const selectParts = [
    "id",
    columns.has("username") ? "username" : "'user' as username",
    columns.has("full_name") ? "full_name as \"fullName\"" : "'Usuario' as \"fullName\"",
    columns.has("email") ? "email" : "null as email",
    "role",
    columns.has("tree_id") ? "tree_id as \"treeId\"" : "null as \"treeId\"",
    columns.has("is_active") ? "is_active as \"isActive\"" : "true as \"isActive\"",
  ];

  const result = await pool.query<AuthMeUser>(
    `select ${selectParts.join(", ")} from users where id = $1 limit 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

// Master staff code validator.
// Production: when STAFF_MASTER_CODE is set, ONLY that exact value is accepted.
//   The checked-in dev aliases never bypass the ops-configured secret.
// Local/dev: when no env code is configured, accept the legacy aliases.
// Production/Vercel: STAFF_MASTER_CODE must be configured.
export function isValidMasterCode(submitted: unknown): boolean {
  return isValidStaffCode(submitted);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select(authUserColumns)
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
  }).returning(publicAuthUserColumns);

  await db.update(inviteCodesTable)
    .set({ usedById: newUser.id, usedAt: new Date(), isActive: false })
    .where(eq(inviteCodesTable.id, inviteCode.id));

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  if (newUser.email) {
    try { await sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }); } catch (e) { console.error("[welcome-email]", e); }
  }

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId },
  });
});

// ─── Clerk sync ───────────────────────────────────────────────────────────────
router.post("/auth/clerk-sync", async (req, res): Promise<void> => {
  const { clerkId, email, fullName, role: requestedRole, inviteCode, staffPassword } = req.body;
  if (!email) { res.status(400).json({ error: "Se requiere email" }); return; }

  // Helper: generate unique username from email
  async function makeUsername(email: string) {
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "usuario";
    const taken = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, base));
    return taken.length ? `${base}_${Date.now().toString().slice(-4)}` : base;
  }

  const [existingUser] = await db.select(authUserColumns).from(usersTable).where(eq(usersTable.email, email));

  if (existingUser) {
    if (!existingUser.isActive) { res.status(401).json({ error: "Cuenta inactiva" }); return; }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: existingUser.id, token, expiresAt });
    res.json({ token, user: { id: existingUser.id, username: existingUser.username, fullName: existingUser.fullName, email: existingUser.email, role: existingUser.role, treeId: existingUser.treeId } });
    return;
  }

  // ── Path 1: Staff registration via master password ──────────────────────────
  if (isValidMasterCode(staffPassword) && requestedRole && ["admin", "executive"].includes(requestedRole)) {
    if (false) { /* admin limit removed for testing */ }
    const username = await makeUsername(email);
    const [newUser] = await db.insert(usersTable).values({
      username,
      passwordHash: 'CLERK_AUTH',
      fullName: fullName || username,
      email,
      role: requestedRole,
      parentId: null,
      treeId: null,
      isActive: true,
    }).returning(publicAuthUserColumns);

    if (requestedRole === "admin") {
      await db.update(usersTable).set({ treeId: newUser.id }).where(eq(usersTable.id, newUser.id));
      newUser.treeId = newUser.id;
    }

    try { await sendWelcomeEmail({ to: newUser.email!, fullName: newUser.fullName, username: newUser.username, role: newUser.role }); } catch (e) { console.error("[welcome-email]", e); }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });
    res.json({ token, user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId } });
    return;
  }

  // ── Path 2: Invite code registration ─────────────────────────────────────
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

  const username = await makeUsername(email);

  const [newUser] = await db.insert(usersTable).values({
    username,
    passwordHash: 'CLERK_AUTH',
    fullName: fullName || username,
    email,
    role: requestedRole as string,
    parentId: invCode.parentId,
    treeId: requestedRole === "admin" ? null : treeId, // admin treeId set below
    isActive: true,
  }).returning(publicAuthUserColumns);

  // Admin becomes root of their own sub-tree (each branch is a separate tree)
  if (requestedRole === "admin") {
    await db.update(usersTable).set({ treeId: newUser.id }).where(eq(usersTable.id, newUser.id));
    newUser.treeId = newUser.id;
  }

  await db.update(inviteCodesTable)
    .set({ usedById: newUser.id, usedAt: new Date(), isActive: false })
    .where(eq(inviteCodesTable.id, invCode.id));

  if (newUser.email) {
    try { await sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }); } catch (e) { console.error("[welcome-email]", e); }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  res.json({ token, user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId } });
});

// ─── Check staff master password (step 2 validation before reaching step 3) ──
router.post("/auth/check-staff-password", async (req, res): Promise<void> => {
  const { staffPassword } = req.body;
  if (isValidMasterCode(staffPassword)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: "Contraseña de acceso incorrecta" });
  }
});

// ─── Staff registration with master code (admin only = tree root) ─────────────
router.post("/auth/register-staff", async (req, res): Promise<void> => {
  const { staffPassword, role, username, password, fullName, email } = req.body;

  if (!isValidMasterCode(staffPassword)) {
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

  // Admin limit removed for testing — will be re-enabled after initial setup

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
  }).returning(publicAuthUserColumns);

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
    try { await sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }); } catch (e) { console.error("[welcome-email]", e); }
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
  }).returning(publicAuthUserColumns);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: newUser.id, token, expiresAt });

  if (newUser.email) {
    try { await sendWelcomeEmail({ to: newUser.email, fullName: newUser.fullName, username: newUser.username, role: newUser.role }); } catch (e) { console.error("[welcome-email]", e); }
  }

  res.json({
    token,
    user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, email: newUser.email, role: newUser.role, treeId: newUser.treeId },
  });
});

// ─── Master-password direct login (no prior session needed) ──────────────────
// Two modes:
//   1. SUPERADMIN_CODE  → finds/creates the Luis superadmin user (parentId=null,
//      treeId=null) and issues a session for it — sees ALL trees.
//   2. STAFF_MASTER_CODE → finds the first business-admin in the DB (original
//      behaviour).
// If no admin exists yet (staff path), returns 404 so the caller can redirect.
router.post("/auth/master-login", async (req, res): Promise<void> => {
  const { masterPassword } = req.body ?? {};

  const isSuperadmin = isValidSuperadminCode(masterPassword);
  const isStaff      = !isSuperadmin && isValidMasterCode(masterPassword);

  if (!isSuperadmin && !isStaff) {
    res.status(401).json({ error: "Clave maestra incorrecta" });
    return;
  }

  try {
    const columnResult = await pool.query<{ column_name: string }>(
      "select attname as column_name from pg_attribute where attrelid = 'users'::regclass and attnum > 0 and not attisdropped",
    );
    const columns = new Set(columnResult.rows.map(row => row.column_name));
    const required = ["id", "role"];
    for (const column of required) {
      if (!columns.has(column)) {
        throw new Error(`users.${column} column is required`);
      }
    }

    const selectParts = [
      "id",
      columns.has("username") ? "username" : "'admin' as username",
      columns.has("full_name") ? "full_name as \"fullName\"" : "'Administrador' as \"fullName\"",
      columns.has("email") ? "email" : "null as email",
      "role",
      columns.has("tree_id") ? "tree_id as \"treeId\"" : "null as \"treeId\"",
    ];
    const activeFilter = columns.has("is_active") ? "and is_active = true" : "";

    let targetUser: MasterLoginUser;

    if (isSuperadmin) {
      // ── Superadmin path: find or create Luis's dedicated account ──────────
      const SUPERADMIN_EMAIL = "dluisdelatorre@gmail.com";
      const SUPERADMIN_USERNAME = "luis_superadmin";

      // Try to find by email first
      const existing = await pool.query<MasterLoginUser>(
        `select ${selectParts.join(", ")} from users where email = $1 ${activeFilter} limit 1`,
        [SUPERADMIN_EMAIL],
      );

      if (existing.rows.length > 0) {
        targetUser = existing.rows[0];
      } else {
        // Create the superadmin user (parentId=null, treeId=null → sees all trees)
        const passwordHashCol = columns.has("password_hash") ? "password_hash" : "passwordhash";
        const insertResult = await pool.query<MasterLoginUser>(
          `insert into users (username, ${passwordHashCol}, full_name, email, role, parent_id, tree_id, is_active)
           values ($1, $2, $3, $4, 'admin', null, null, true)
           returning ${selectParts.join(", ")}`,
          [SUPERADMIN_USERNAME, "SUPERADMIN_NO_PASSWORD", "Luis Superadmin", SUPERADMIN_EMAIL],
        );
        if (!insertResult.rows[0]) {
          res.status(503).json({ error: "No se pudo crear el usuario superadmin" });
          return;
        }
        targetUser = insertResult.rows[0];
      }
    } else {
      // ── Original staff path: first business admin in the DB ───────────────
      const adminResult = await pool.query<MasterLoginUser>(
        `select ${selectParts.join(", ")} from users where role = $1 ${activeFilter} limit 1`,
        ["admin"],
      );
      const [admin] = adminResult.rows;

      if (!admin) {
        res.status(404).json({ error: "no_admin", message: "Aún no hay un administrador registrado. Crea tu cuenta primero." });
        return;
      }
      targetUser = admin;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      "insert into sessions (user_id, token, expires_at) values ($1, $2, $3)",
      [targetUser.id, token, expiresAt],
    );

    res.json({
      token,
      user: { id: targetUser.id, username: targetUser.username, fullName: targetUser.fullName, email: targetUser.email, role: targetUser.role, treeId: targetUser.treeId },
    });
  } catch (err) {
    logger.error({ err }, "master login failed");
    res.status(503).json({
      error: "Error de base de datos",
      ...(process.env.NODE_ENV === "production" ? {} : { detail: err instanceof Error ? err.message : "unknown" }),
    });
  }
});

// ─── Magic admin link: una llave larga en la URL entrega sesion admin directa ───
// Pensado para el dueno: abre la liga y entra al panel sin login ni contrasena.
// La llave vive solo en la URL y se valida contra ADMIN_MAGIC_TOKEN (env del servidor).
router.post("/auth/magic-admin", async (req, res): Promise<void> => {
  const key = (req.body?.key ?? req.query?.key) as string | undefined;
  const expected = process.env.ADMIN_MAGIC_TOKEN;
  if (!expected || !key || key !== expected) {
    res.status(401).json({ error: "Llave invalida" });
    return;
  }
  try {
    // Objetivo: el dueno (financiamiento@crede-ti.com) si es admin; si no, el primer admin.
    const ownerQ = await pool.query(
      "select id, coalesce(username,'admin') as username, coalesce(full_name,'Administrador') as \"fullName\", email, role from users where lower(email)=lower($1) and role='admin' and coalesce(is_active,true)=true limit 1",
      ["financiamiento@crede-ti.com"],
    );
    let targetUser = ownerQ.rows[0];
    if (!targetUser) {
      const adminQ = await pool.query(
        "select id, coalesce(username,'admin') as username, coalesce(full_name,'Administrador') as \"fullName\", email, role from users where role='admin' and coalesce(is_active,true)=true limit 1",
      );
      targetUser = adminQ.rows[0];
    }
    if (!targetUser) {
      res.status(404).json({ error: "no_admin", message: "No hay administrador registrado." });
      return;
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      "insert into sessions (user_id, token, expires_at) values ($1, $2, $3)",
      [targetUser.id, token, expiresAt],
    );
    res.json({
      token,
      user: { id: targetUser.id, username: targetUser.username, fullName: targetUser.fullName, email: targetUser.email, role: targetUser.role },
    });
  } catch (err) {
    logger.error({ err }, "magic-admin login failed");
    res.status(503).json({ error: "Error de base de datos" });
  }
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const token = req.headers.authorization?.slice(7);
  if (token) await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  // Demo tokens skip DB and respond from middleware context.
  const authHeader = req.headers.authorization ?? "";
  if (authHeader.startsWith("Bearer demo-token-")) {
    const role = req.userRole!;
    res.json({
      id: req.userId,
      username: `demo_${role}`,
      fullName: req.userFullName,
      email: `${role}@demo.crede-ti.info`,
      role,
      treeId: req.userTreeId,
    });
    return;
  }

  try {
    const user = await selectFlexibleUserById(req.userId!);
    if (!user || !user.isActive) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    res.json({ id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, treeId: user.treeId });
  } catch {
    res.status(503).json({ error: "Database not configured" });
  }
});


// ── POST /auth/sync-role ─────────────────────────────────────────────────────
// Called by the frontend on login to fix the role if the user's email
// matches SUPERADMIN_EMAILS or other configured role maps.
// Safe to call every login — only updates if the role is wrong.
router.post("/auth/sync-role", requireAuth, async (req, res): Promise<void> => {
  const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Email de la tabla O el que venga en el header (Clerk lo pasa via req.userEmail si está disponible).
  const headerEmail = (req.headers["x-user-email"] as string | undefined)?.toLowerCase();
  const email = (user.email?.toLowerCase() || headerEmail || "").trim();
  const shouldBeAdmin = email !== "" && superadminEmails.includes(email);

  // Si la tabla no tenía email pero lo recibimos, lo poblamos para futuras sincronizaciones.
  const needsEmailBackfill = !user.email && headerEmail;

  if (shouldBeAdmin && (user.role !== "admin" || needsEmailBackfill)) {
    await db.update(usersTable)
      .set({ role: "admin", email: user.email ?? headerEmail ?? null, isActive: true, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));
    res.json({ ok: true, role: "admin", updated: true });
    return;
  }

  // Backfill de correo para CUALQUIER usuario (incl. clientes) cuyo email quedo nulo
  // por el timing del webhook de Clerk. Asi los expedientes quedan completos.
  if (needsEmailBackfill) {
    await db.update(usersTable)
      .set({ email: headerEmail, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));
    res.json({ ok: true, role: user.role, updated: true });
    return;
  }

  res.json({ ok: true, role: user.role, updated: false });
});

export default router;
