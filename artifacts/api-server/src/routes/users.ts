import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, clientsTable, creditsTable, sessionsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
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

// ─── Seed demo data for a fresh admin account ─────────────────────────────────
router.post("/users/seed-demo", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const adminId  = req.userId!;
  const treeId   = req.userTreeId;
  if (!treeId) { res.status(400).json({ error: "Admin sin treeId" }); return; }

  // Check tree is essentially empty (only admin)
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.treeId, treeId));
  if (existing.length > 1) {
    res.status(409).json({ error: "El arbol ya tiene miembros" });
    return;
  }

  const demoExecs = [
    { name: "Carlos Mendoza García",   email: "carlos.mendoza@demo.com",   username: "carlos_mendoza" },
    { name: "Daniela Ríos Fuentes",    email: "daniela.rios@demo.com",     username: "daniela_rios" },
    { name: "Fernando Castillo López", email: "fernando.castillo@demo.com", username: "fernando_castillo" },
    { name: "Patricia Vega Morales",   email: "patricia.vega@demo.com",    username: "patricia_vega" },
  ];

  const createdExecs: { id: number; name: string }[] = [];
  for (const exec of demoExecs) {
    const [u] = await db.insert(usersTable).values({
      username: exec.username,
      passwordHash: "CLERK_AUTH",
      fullName: exec.name,
      email: exec.email,
      role: "executive",
      parentId: adminId,
      treeId,
      isActive: true,
    }).returning();
    createdExecs.push({ id: u.id, name: u.fullName });
  }

  const demoClients: { name: string; phone: string; execIdx: number; amount: number; term: number; status: string; paid: number }[] = [
    { name: "María Elena Rodríguez Vargas", phone: "5551234001", execIdx: 0, amount: 5000, term: 8,  status: "current",  paid: 3 },
    { name: "José Luis Martínez Pérez",     phone: "5551234002", execIdx: 0, amount: 8000, term: 13, status: "current",  paid: 5 },
    { name: "Ana Sofía González Cruz",      phone: "5551234003", execIdx: 0, amount: 3000, term: 8,  status: "at_risk",  paid: 2 },
    { name: "Roberto Hernández Silva",      phone: "5551234004", execIdx: 1, amount: 10000,term: 13, status: "current",  paid: 7 },
    { name: "Laura Jiménez Flores",         phone: "5551234005", execIdx: 1, amount: 4000, term: 8,  status: "overdue",  paid: 4 },
    { name: "Miguel Ángel Torres Reyes",    phone: "5551234006", execIdx: 1, amount: 6000, term: 8,  status: "current",  paid: 1 },
    { name: "Carmen Ruiz Salinas",          phone: "5551234007", execIdx: 2, amount: 7000, term: 13, status: "current",  paid: 9 },
    { name: "Diego Morales Núñez",          phone: "5551234008", execIdx: 2, amount: 5000, term: 8,  status: "current",  paid: 6 },
    { name: "Verónica Espinoza Ramírez",    phone: "5551234009", execIdx: 3, amount: 9000, term: 13, status: "at_risk",  paid: 3 },
    { name: "Alejandro Navarro Gutiérrez",  phone: "5551234010", execIdx: 3, amount: 3000, term: 8,  status: "current",  paid: 5 },
  ];

  const today = new Date();
  for (const c of demoClients) {
    const exec   = createdExecs[c.execIdx];
    const weekly = c.term === 8 ? Math.round(c.amount * 175 / 1000) : Math.round(c.amount * 120 / 1000);
    const disbDate = new Date(today);
    disbDate.setDate(disbDate.getDate() - c.paid * 7);

    const [cl] = await db.insert(clientsTable).values({
      fullName: c.name,
      phone: c.phone,
      address: "Ciudad de México, CDMX",
      executiveId: exec.id,
      status: c.status as any,
    }).returning();

    await db.insert(creditsTable).values({
      clientId: cl.id,
      executiveId: exec.id,
      amount: String(c.amount),
      disbursementDate: disbDate.toISOString().slice(0, 10),
      termWeeks: c.term,
      weeklyPayment: String(weekly),
      totalToRepay: String(weekly * c.term),
      remainingBalance: String(weekly * (c.term - c.paid)),
      currentPaymentNumber: c.paid,
      status: c.status === "overdue" ? "overdue" : c.status === "at_risk" ? "active" : "active",
    }).returning();
  }

  res.json({ ok: true, executives: createdExecs.length, clients: demoClients.length });
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
