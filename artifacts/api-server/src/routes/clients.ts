import { Router } from "express";
import { and, clientsTable, commitmentsTable, creditsTable, db, eq, ilike, inArray, notesTable, paymentsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendClientReassignmentEmail } from "../lib/email";
import {
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  UpdateClientParams,
  ListClientsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function calcRiskLevel(client: typeof clientsTable.$inferSelect): string {
  if (client.status === "defaulted") return "high";
  if (client.status === "overdue") return "high";
  if (client.status === "at_risk") return "medium";
  return "low";
}

router.get("/clients", requireAuth, async (req, res): Promise<void> => {
  const params = ListClientsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db
    .select({
      id: clientsTable.id,
      fullName: clientsTable.fullName,
      phone: clientsTable.phone,
      altPhone: clientsTable.altPhone,
      address: clientsTable.address,
      curp: clientsTable.curp,
      status: clientsTable.status,
      executiveId: clientsTable.executiveId,
      executiveName: usersTable.fullName,
      registeredAt: clientsTable.registeredAt,
      updatedAt: clientsTable.updatedAt,
    })
    .from(clientsTable)
    .leftJoin(usersTable, eq(clientsTable.executiveId, usersTable.id));

  const conditions = [];

  // Client role cannot list all clients
  if (req.userRole === "client") {
    res.status(403).json({ error: "Usa /me/client para ver tu información" });
    return;
  }

  if (req.userRole === "executive") {
    // Executive sees only their own clients
    conditions.push(eq(clientsTable.executiveId, req.userId!));
  } else if (req.userRole === "admin" && req.userParentId !== null) {
    // Branch admin: only see clients whose executive belongs to their tree
    conditions.push(eq(usersTable.treeId, req.userTreeId!));
    if (params.data.executiveId) {
      conditions.push(eq(clientsTable.executiveId, params.data.executiveId));
    }
  } else {
    // Superadmin (parentId = null): sees all trees
    if (params.data.executiveId) {
      conditions.push(eq(clientsTable.executiveId, params.data.executiveId));
    }
  }

  if (params.data.status) {
    conditions.push(eq(clientsTable.status, params.data.status));
  }

  if (params.data.search) {
    conditions.push(ilike(clientsTable.fullName, `%${params.data.search}%`));
  }

  const rows = await query.where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(rows.map(r => ({
    ...r,
    riskLevel: calcRiskLevel({ status: r.status } as typeof clientsTable.$inferSelect),
  })));
});

router.post("/clients", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // If executive, force their own ID
  const executiveId = req.userRole === "executive"
    ? req.userId
    : (parsed.data.executiveId ?? null);

  const [client] = await db.insert(clientsTable).values({
    ...parsed.data,
    executiveId,
  }).returning();

  const [executive] = executiveId
    ? await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, executiveId))
    : [null];

  res.status(201).json({
    ...client,
    executiveName: executive?.fullName ?? null,
    riskLevel: calcRiskLevel(client),
  });
});

router.get("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select({
      id: clientsTable.id,
      fullName: clientsTable.fullName,
      phone: clientsTable.phone,
      altPhone: clientsTable.altPhone,
      address: clientsTable.address,
      curp: clientsTable.curp,
      status: clientsTable.status,
      executiveId: clientsTable.executiveId,
      executiveName: usersTable.fullName,
      guarantorName: clientsTable.guarantorName,
      guarantorPhone: clientsTable.guarantorPhone,
      internalNotes: clientsTable.internalNotes,
      registeredAt: clientsTable.registeredAt,
      updatedAt: clientsTable.updatedAt,
    })
    .from(clientsTable)
    .leftJoin(usersTable, eq(clientsTable.executiveId, usersTable.id))
    .where(eq(clientsTable.id, params.data.id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Executive can only see their own clients
  if (req.userRole === "executive" && client.executiveId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  // Client can only see their own record — enforce via userId FK
  if (req.userRole === "client") {
    const [linked] = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(and(eq(clientsTable.id, params.data.id), eq(clientsTable.userId, req.userId!)));
    if (!linked) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const credits = await db
    .select({
      id: creditsTable.id,
      clientId: creditsTable.clientId,
      executiveId: creditsTable.executiveId,
      executiveName: usersTable.fullName,
      amount: creditsTable.amount,
      disbursementDate: creditsTable.disbursementDate,
      termWeeks: creditsTable.termWeeks,
      weeklyPayment: creditsTable.weeklyPayment,
      openingFee: creditsTable.openingFee,
      totalToRepay: creditsTable.totalToRepay,
      currentPaymentNumber: creditsTable.currentPaymentNumber,
      remainingBalance: creditsTable.remainingBalance,
      status: creditsTable.status,
      renewalEligible: creditsTable.renewalEligible,
      notes: creditsTable.notes,
      createdAt: creditsTable.createdAt,
      updatedAt: creditsTable.updatedAt,
    })
    .from(creditsTable)
    .leftJoin(usersTable, eq(creditsTable.executiveId, usersTable.id))
    .where(eq(creditsTable.clientId, params.data.id))
    .orderBy(creditsTable.createdAt);

  const recentPayments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.clientId, params.data.id))
    .orderBy(paymentsTable.paymentDate)
    .limit(20);

  const recentNotesRaw = await db
    .select({
      id: notesTable.id,
      clientId: notesTable.clientId,
      authorId: notesTable.authorId,
      authorName: usersTable.fullName,
      authorRole: usersTable.role,
      noteType: notesTable.noteType,
      content: notesTable.content,
      createdAt: notesTable.createdAt,
    })
    .from(notesTable)
    .leftJoin(usersTable, eq(notesTable.authorId, usersTable.id))
    .where(eq(notesTable.clientId, params.data.id))
    .orderBy(notesTable.createdAt)
    .limit(20);
  // Tag each note with isFromClient so chat UIs style bubbles by role, not by name match.
  const recentNotes = recentNotesRaw.map((n) => ({
    ...n,
    isFromClient: ["client", "customer"].includes(n.authorRole ?? ""),
  }));

  const openCommitments = await db
    .select()
    .from(commitmentsTable)
    .where(and(eq(commitmentsTable.clientId, params.data.id), eq(commitmentsTable.status, "pending")));

  res.json({
    ...client,
    riskLevel: calcRiskLevel({ status: client.status } as typeof clientsTable.$inferSelect),
    credits: credits.map(c => ({
      ...c,
      clientName: client.fullName,
      amount: parseFloat(c.amount),
      weeklyPayment: parseFloat(c.weeklyPayment),
      totalToRepay: parseFloat(c.totalToRepay),
      remainingBalance: parseFloat(c.remainingBalance),
      openingFee: c.openingFee ? parseFloat(c.openingFee) : null,
    })),
    recentPayments: recentPayments.map(p => ({
      ...p,
      clientName: client.fullName,
      amountPaid: parseFloat(p.amountPaid),
      amountExpected: parseFloat(p.amountExpected),
      updatedBalance: parseFloat(p.updatedBalance),
      lateFee: p.lateFee ? parseFloat(p.lateFee) : null,
    })),
    recentNotes,
    openCommitments: openCommitments.map(c => ({
      ...c,
      clientName: client.fullName,
      promisedAmount: parseFloat(c.promisedAmount),
    })),
  });
});

router.patch("/clients/:id", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch the current client to detect executiveId changes
  const [currentClient] = await db
    .select({ executiveId: clientsTable.executiveId })
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  if (!currentClient) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Remove nulls
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }

  // Capture current executiveId before update for audit log
  const [existing] = await db
    .select({ executiveId: clientsTable.executiveId })
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  // Run update and audit note insert atomically
  const client = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(clientsTable)
      .set(updates as Partial<typeof clientsTable.$inferInsert>)
      .where(eq(clientsTable.id, params.data.id))
      .returning();

    if (!updated) return null;

    // Insert audit note if executiveId changed
    if (
      existing &&
      updates.executiveId !== undefined &&
      updates.executiveId !== existing.executiveId
    ) {
      const oldId = existing.executiveId;
      const newId = updated.executiveId;

      const execIds = [oldId, newId].filter((id): id is number => id !== null && id !== undefined);
      const executives = execIds.length > 0
        ? await tx.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable).where(inArray(usersTable.id, execIds))
        : [];

      const nameMap = new Map(executives.map((u) => [u.id, u.fullName]));
      const oldName = (oldId != null ? nameMap.get(oldId) : null) ?? "Sin asignar";
      const newName = (newId != null ? nameMap.get(newId) : null) ?? "Sin asignar";

      await tx.insert(notesTable).values({
        clientId: updated.id,
        authorId: null,
        noteType: "system",
        content: `Reasignado de ${oldName} a ${newName}`,
      });
    }

    return updated;
  });

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Detect reassignment: only for admin-initiated changes where executiveId actually changed
  const newExecutiveId = parsed.data.executiveId;
  if (req.userRole === "admin" && newExecutiveId && newExecutiveId !== currentClient.executiveId) {
    const [newExecutive] = await db
      .select({ fullName: usersTable.fullName, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, newExecutiveId));

    if (newExecutive?.email) {
      sendClientReassignmentEmail({
        to: newExecutive.email,
        executiveName: newExecutive.fullName,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientAltPhone: client.altPhone,
        clientAddress: client.address,
      }).catch(() => {});
    }
  }

  res.json({
    ...client,
    executiveName: null,
    riskLevel: calcRiskLevel(client),
  });
});

// ─── GET /api/me/client — link logged-in client user to their client record ───
router.get("/me/client", requireAuth, requireRole("client"), async (req, res): Promise<void> => {
  let [client] = await db
    .select({
      id: clientsTable.id,
      fullName: clientsTable.fullName,
      phone: clientsTable.phone,
      altPhone: clientsTable.altPhone,
      address: clientsTable.address,
      curp: clientsTable.curp,
      status: clientsTable.status,
      guarantorName: clientsTable.guarantorName,
      guarantorPhone: clientsTable.guarantorPhone,
      registeredAt: clientsTable.registeredAt,
      executiveName: usersTable.fullName,
    })
    .from(clientsTable)
    .leftJoin(usersTable, eq(clientsTable.executiveId, usersTable.id))
    .where(eq(clientsTable.userId, req.userId!));

  // Fallback: match by fullName for admin-created clients
  if (!client && req.userFullName) {
    const [byName] = await db
      .select({
        id: clientsTable.id,
        fullName: clientsTable.fullName,
        phone: clientsTable.phone,
        altPhone: clientsTable.altPhone,
        address: clientsTable.address,
        curp: clientsTable.curp,
        status: clientsTable.status,
        guarantorName: clientsTable.guarantorName,
        guarantorPhone: clientsTable.guarantorPhone,
        registeredAt: clientsTable.registeredAt,
        executiveName: usersTable.fullName,
      })
      .from(clientsTable)
      .leftJoin(usersTable, eq(clientsTable.executiveId, usersTable.id))
      .where(eq(clientsTable.fullName, req.userFullName));
    if (byName) {
      client = byName;
      // Backfill userId FK
      await db.update(clientsTable).set({ userId: req.userId! }).where(eq(clientsTable.id, byName.id));
    }
  }

  if (!client) { res.status(404).json({ error: "No client record linked to this user" }); return; }

  res.json({ ...client, riskLevel: calcRiskLevel({ status: client.status } as typeof clientsTable.$inferSelect) });
});

// ─── GET /api/clients/:id/documents — list uploaded documents ─────────────
router.get("/clients/:id/documents", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(req.params.id as string, 10);
  if (isNaN(clientId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const docs = await db
    .select({
      id: notesTable.id,
      clientId: notesTable.clientId,
      authorId: notesTable.authorId,
      authorName: usersTable.fullName,
      noteType: notesTable.noteType,
      content: notesTable.content,
      createdAt: notesTable.createdAt,
    })
    .from(notesTable)
    .leftJoin(usersTable, eq(notesTable.authorId, usersTable.id))
    .where(and(eq(notesTable.clientId, clientId), eq(notesTable.noteType, "document")))
    .orderBy(notesTable.createdAt);

  res.json(docs);
});

// ─── POST /api/clients/:id/documents — upload a document (base64) ─────────
router.post("/clients/:id/documents", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(req.params.id as string, 10);
  if (isNaN(clientId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { filename, mimeType, base64, label } = req.body;
  if (!filename || !base64) {
    res.status(400).json({ error: "filename y base64 son requeridos" });
    return;
  }

  const content = JSON.stringify({ filename, mimeType: mimeType ?? "application/octet-stream", base64, label: label ?? filename, uploadedAt: new Date().toISOString() });

  const [note] = await db.insert(notesTable).values({
    clientId,
    authorId: req.userId!,
    noteType: "document",
    content,
  }).returning();

  res.status(201).json({ ...note });
});

// ─── DELETE /api/clients/:id/documents/:docId ─────────────────────────────
router.delete("/clients/:id/documents/:docId", requireAuth, async (req, res): Promise<void> => {
  const docId = parseInt(req.params.docId as string, 10);
  if (isNaN(docId)) { res.status(400).json({ error: "Invalid docId" }); return; }

  await db.delete(notesTable).where(and(eq(notesTable.id, docId), eq(notesTable.noteType, "document")));
  res.json({ ok: true });
});

router.get("/clients/:id/risk-score", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const clientId = parseInt(raw, 10);
  if (isNaN(clientId)) {
    res.status(400).json({ error: "Invalid client id" });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, clientId));
  const commitments = await db.select().from(commitmentsTable).where(eq(commitmentsTable.clientId, clientId));
  const credits = await db.select().from(creditsTable).where(eq(creditsTable.clientId, clientId));

  const total = payments.length;
  const late = payments.filter(p => p.paymentStatus === "late" || p.paymentStatus === "missed").length;
  const brokenPromises = commitments.filter(c => c.status === "broken").length;
  const renewals = credits.filter(c => c.currentPaymentNumber > 0).length - 1;
  const currentArrears = credits.reduce((sum, c) => {
    if (c.status === "active") return sum + parseFloat(c.remainingBalance) - parseFloat(c.totalToRepay) + parseFloat(c.amount);
    return sum;
  }, 0);

  const punctualityScore = total > 0 ? Math.round(((total - late) / total) * 100) : 100;
  const score = Math.max(0, Math.min(100,
    punctualityScore
    - (brokenPromises * 10)
    - (late * 3)
    + (renewals * 5)
  ));

  const level = score >= 70 ? "low" : score >= 40 ? "medium" : "high";

  res.json({
    clientId,
    score,
    level,
    punctualityScore,
    delayCount: late,
    brokenPromises,
    currentArrears: Math.max(0, currentArrears),
    renewalCount: Math.max(0, renewals),
    calculatedAt: new Date().toISOString(),
  });
});

export default router;
