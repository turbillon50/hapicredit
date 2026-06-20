import { Router } from "express";
import { and, clientsTable, creditsTable, db, desc, documentsTable, eq, inArray, paymentsTable, sessionsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import crypto from "crypto";
import { isValidStaffCode } from "../lib/staffCode";

const router = Router();

// Helper: dado un set de userIds, devuelve un Map userId -> avatarUrl (foto más reciente).
// Una sola consulta para evitar N+1 al listar usuarios con sus fotos.
async function avatarMapFor(userIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (!userIds.length) return map;
  try {
    const rows = await db.select().from(documentsTable)
      .where(and(inArray(documentsTable.userId, userIds), eq(documentsTable.type, "foto")))
      .orderBy(desc(documentsTable.uploadedAt));
    for (const r of rows) {
      if (r.userId != null && !map.has(r.userId) && r.blobUrl) map.set(r.userId, r.blobUrl);
    }
  } catch { /* sin fotos, ok */ }
  return map;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "credeti_salt").digest("hex");
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    parentId: user.parentId,
    treeId: user.treeId,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// List users — admin sees only their own tree
router.get("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const treeId = req.userTreeId;
  const users = treeId
    ? await db.select().from(usersTable).where(eq(usersTable.treeId, treeId)).orderBy(usersTable.fullName)
    : await db.select().from(usersTable).orderBy(usersTable.fullName);
  const avatars = await avatarMapFor(users.map(u => u.id));
  res.json(users.map(u => ({ ...formatUser(u), avatarUrl: avatars.get(u.id) ?? null })));
});

// ─── MUST be before /users/:id ────────────────────────────────────────────────
router.get("/users/my-tree", requireAuth, async (req, res): Promise<void> => {
  const me = req.userId!;
  const myRole = req.userRole;
  const myTreeId = req.userTreeId;

  if (myRole === "admin") {
    if (!myTreeId) {
      res.json({ id: me, children: [] });
      return;
    }

    const allUsers = await db.select().from(usersTable).where(eq(usersTable.treeId, myTreeId));
    const allClients = await db.select().from(clientsTable);

    const executives = allUsers.filter(u => u.role === "executive");
    const clients    = allUsers.filter(u => u.role === "client");

    const execTree = executives.map(exec => {
      const execClients = allClients.filter(c => c.executiveId === exec.id);
      return {
        id: exec.id,
        fullName: exec.fullName,
        role: exec.role,
        email: exec.email,
        username: exec.username,
        isActive: exec.isActive,
        createdAt: exec.createdAt,
        clientCount: execClients.length,
        children: execClients.map(c => ({
          id: c.id,
          fullName: c.fullName,
          role: "client",
          phone: c.phone,
          status: c.status,
          registeredAt: c.registeredAt,
          children: [],
        })),
      };
    });

    const standaloneClients = clients.filter(c => !executives.some(e => e.id === c.parentId));

    res.json({
      id: me,
      children: [
        ...execTree,
        ...standaloneClients.map(c => ({
          id: c.id,
          fullName: c.fullName,
          role: c.role,
          email: c.email,
          username: c.username,
          isActive: c.isActive,
          createdAt: c.createdAt,
          children: [],
        })),
      ],
    });
    return;
  }

  // Executive: show their recruited users + client records
  const level1Full    = await db.select().from(usersTable).where(eq(usersTable.parentId, me));
  const clientRecords = await db.select().from(clientsTable).where(eq(clientsTable.executiveId, me));

  res.json({
    id: me,
    children: [
      ...level1Full.map(u => ({
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        email: u.email,
        username: u.username,
        isActive: u.isActive,
        createdAt: u.createdAt,
        children: [],
      })),
      ...clientRecords.map(c => ({
        id: c.id,
        fullName: c.fullName,
        role: "client",
        phone: c.phone,
        status: c.status,
        registeredAt: c.registeredAt,
        children: [],
      })),
    ],
  });
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { password, ...rest } = parsed.data;
  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning();
  res.status(201).json(formatUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  if (req.userRole !== "admin" && req.userId !== params.data.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

// ─── GET /users/:id/detail — usuario + cliente vinculado + créditos + pagos ───
router.get("/users/:id/detail", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Buscar el cliente vinculado a este usuario (si es acreditado)
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.userId, id));

  let credits: any[] = [];
  let payments: any[] = [];
  let stats = { activeCredits: 0, totalBorrowed: 0, totalPaid: 0, remainingBalance: 0 };

  if (client) {
    credits = await db.select().from(creditsTable).where(eq(creditsTable.clientId, client.id)).orderBy(creditsTable.createdAt);
    payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, client.id)).orderBy(paymentsTable.paymentDate).limit(10);

    stats.activeCredits = credits.filter(c => c.status === "active").length;
    stats.totalBorrowed = credits.reduce((s, c) => s + parseFloat(c.amount ?? "0"), 0);
    stats.remainingBalance = credits.filter(c => c.status === "active").reduce((s, c) => s + parseFloat(c.remainingBalance ?? "0"), 0);
    stats.totalPaid = payments.filter((p: any) => p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected").reduce((s: number, p: any) => s + parseFloat(p.amountPaid ?? "0"), 0);
  }

  const detailAvatars = await avatarMapFor([user.id]);
  res.json({
    user: { ...formatUser(user), avatarUrl: detailAvatars.get(user.id) ?? null },
    client: client ? {
      id: client.id, fullName: client.fullName, phone: client.phone,
      address: client.address, curp: client.curp, status: client.status,
      registeredAt: client.registeredAt,
    } : null,
    credits: credits.map(c => ({
      id: c.id, amount: c.amount, status: c.status, termWeeks: c.termWeeks,
      weeklyPayment: c.weeklyPayment, remainingBalance: c.remainingBalance,
      disbursementDate: c.disbursementDate, currentPaymentNumber: c.currentPaymentNumber,
    })),
    payments: payments.map((p: any) => ({
      id: p.id, amountPaid: p.amountPaid, paymentDate: p.paymentDate, paymentStatus: p.paymentStatus,
    })),
    stats,
  });
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { password, ...updateData } = parsed.data;
  const updates: Record<string, unknown> = { ...updateData };
  if (password) updates.passwordHash = hashPassword(password);

  const [user] = await db.update(usersTable)
    .set(updates as Partial<typeof usersTable.$inferInsert>)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  if (id === req.userId) { res.status(400).json({ error: "No puedes eliminarte a ti mismo" }); return; }

  // Deactivate sub-users (clients) of this executive
  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.parentId, id));
  // Deactivate the user itself
  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
  // Invalidate their sessions
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, id));

  res.json({ ok: true });
});

// ─── DELETE MY ACCOUNT (self soft-delete) ────────────────────────────────────
router.delete("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

  const ts = Date.now();
  const anonEmail    = `deleted_${ts}@credeti.deleted`;
  const anonName     = `Cuenta eliminada`;
  const anonUsername = `deleted_${ts}`;

  await db.update(usersTable).set({
    isActive:  false,
    email:     anonEmail,
    fullName:  anonName,
    username:  anonUsername,
    clerkId:   null,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, userId));

  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

  res.json({ ok: true, message: "Cuenta eliminada correctamente" });
});

router.patch("/users/:id/parent", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const newParentId = parseInt(req.body.parentId, 10);
  if (isNaN(newParentId)) { res.status(400).json({ error: "parentId inválido" }); return; }

  const [parent] = await db.select().from(usersTable).where(eq(usersTable.id, newParentId));
  if (!parent || parent.role !== "admin") {
    res.status(400).json({ error: "El nuevo administrador no existe o no tiene rol admin" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ parentId: newParentId, treeId: parent.treeId })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Asesor no encontrado" }); return; }
  res.json({ ok: true, id: updated.id, parentId: updated.parentId, treeId: updated.treeId });
});

// ─── ELEVATE TO ADMIN (master-code self-promotion from /perfil) ───────────────
// Any authenticated user (client, executive, even demo) can enter the master
// code to upgrade their account to "admin". The newly elevated user becomes
// the root of their own tree (treeId = own id, parentId = null).
//
// Security: production/Vercel accepts only STAFF_MASTER_CODE. Legacy aliases
// are allowed only for local development when no env code is configured.
function isValidElevationCode(submitted: unknown): boolean {
  return isValidStaffCode(submitted);
}

router.post("/users/me/elevate", requireAuth, async (req, res): Promise<void> => {
  const { masterPassword } = req.body ?? {};

  if (!isValidElevationCode(masterPassword)) {
    res.status(401).json({ error: "Clave maestra incorrecta" });
    return;
  }

  const authHeader = req.headers.authorization ?? "";

  // Demo tokens: pretend the elevation happened; the client just stores the
  // role and continues. No DB write because there is no real user row.
  if (authHeader.startsWith("Bearer demo-token-")) {
    res.json({
      ok: true,
      token: "demo-token-admin",
      user: {
        id: 1,
        username: "demo_admin",
        fullName: "Admin Demo",
        email: "admin@demo.crede-ti.info",
        role: "admin",
        treeId: 1,
      },
    });
    return;
  }

  try {
    const userId = req.userId!;
    const [updated] = await db.update(usersTable)
      .set({ role: "admin", parentId: null, treeId: userId, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    // Migrate the elevating user's existing descendants (the subtree of
    // people they had invited) into the new tree, so an executive promoted
    // to admin doesn't lose visibility of their network. Iterative BFS so a
    // missing recursive-CTE in drizzle isn't a blocker.
    const queue: number[] = [userId];
    const visited = new Set<number>([userId]);
    while (queue.length) {
      const parent = queue.shift()!;
      const children = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.parentId, parent));
      const fresh = children.map(c => c.id).filter(id => !visited.has(id));
      if (fresh.length === 0) continue;
      fresh.forEach(id => visited.add(id));
      await db.update(usersTable)
        .set({ treeId: userId, updatedAt: new Date() })
        .where(inArray(usersTable.id, fresh));
      queue.push(...fresh);
    }

    // Sync the new role to Clerk publicMetadata so the JWT reflects it on
    // the next token refresh — prevents ClerkCacheInvalidator from resetting
    // the role back to the old value after the page reloads.
    if (updated.clerkId && process.env.CLERK_SECRET_KEY) {
      fetch(`https://api.clerk.com/v1/users/${updated.clerkId}/metadata`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: { role: "admin" } }),
      }).catch(() => {});
    }

    // Issue a fresh session token so the role change propagates cleanly.
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId, token, expiresAt });

    res.json({
      ok: true,
      token,
      user: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        treeId: updated.treeId,
      },
    });
  } catch {
    res.status(503).json({ error: "Database not configured" });
  }
});

// ─── DEMOTE FROM ADMIN (self-demotion from /perfil) ──────────────────────────
router.post("/users/me/demote", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { targetRole } = req.body ?? {};
  const role = targetRole === "executive" ? "executive" : "client";
  try {
    const userId = req.userId!;
    const [updated] = await db.update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    if (updated.clerkId && process.env.CLERK_SECRET_KEY) {
      fetch(`https://api.clerk.com/v1/users/${updated.clerkId}/metadata`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: { role } }),
      }).catch(() => {});
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId, token, expiresAt });

    res.json({
      ok: true,
      token,
      user: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        treeId: updated.treeId,
      },
    });
  } catch {
    res.status(503).json({ error: "Database not configured" });
  }
});

export default router;
