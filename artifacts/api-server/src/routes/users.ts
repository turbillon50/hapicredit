import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, clientsTable, creditsTable, sessionsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

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
  res.json(users.map(formatUser));
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

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { password, ...updateData } = parsed.data;
  const updates: Record<string, unknown> = { ...updateData };
  if (password) updates.passwordHash = hashPassword(password);

  const [user] = await db.update(usersTable)
    .set(updates as Parameters<typeof usersTable.$inferSelect>[0])
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
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
  const id = parseInt(req.params.id, 10);
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

export default router;
