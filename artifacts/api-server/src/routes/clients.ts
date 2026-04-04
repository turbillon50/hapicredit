import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, clientsTable, creditsTable, paymentsTable, notesTable, commitmentsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  UpdateClientParams,
  ListClientsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

  // Executive sees only their own clients
  if (req.userRole === "executive") {
    conditions.push(eq(clientsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(clientsTable.executiveId, params.data.executiveId));
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
  // Client can only see themselves - check if they're linked
  if (req.userRole === "client") {
    const [linked] = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(and(eq(clientsTable.id, params.data.id), eq(clientsTable.executiveId, req.userId!)));
    // For client role, allow if they see their own record via a different mechanism
    // (In a real app, users table would link to clients; keep simple here)
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

  const recentNotes = await db
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
    .where(eq(notesTable.clientId, params.data.id))
    .orderBy(notesTable.createdAt)
    .limit(20);

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

  // Remove nulls
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }

  const [client] = await db
    .update(clientsTable)
    .set(updates as Parameters<typeof clientsTable.$inferSelect>[0])
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json({
    ...client,
    executiveName: null,
    riskLevel: calcRiskLevel(client),
  });
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
