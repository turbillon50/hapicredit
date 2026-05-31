import { Router, type IRouter } from "express";
import { alertsTable, and, cajaMovementsTable, clientsTable, creditsTable, db, eq, getTableColumns, gte, lte, paymentsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreatePaymentBody,
  GetPaymentParams,
  ListPaymentsQueryParams,
} from "@workspace/api-zod";

// Late fee: 10% of the missed weekly payment per overdue cycle.
// Owner rule: "Yo solo les cobro el 10% por cada cuota vencida.
// Si el pago es de $300 yo les cobro $30."
const LATE_FEE_RATE = 0.10;

const router: IRouter = Router();

function formatPayment(p: typeof paymentsTable.$inferSelect & { clientName?: string | null; executiveName?: string | null }) {
  return {
    ...p,
    amountPaid: parseFloat(p.amountPaid),
    amountExpected: parseFloat(p.amountExpected),
    updatedBalance: parseFloat(p.updatedBalance),
    lateFee: p.lateFee ? parseFloat(p.lateFee) : null,
    clientName: p.clientName ?? null,
    executiveName: p.executiveName ?? null,
  };
}

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (req.userRole === "executive") {
    conditions.push(eq(paymentsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(paymentsTable.executiveId, params.data.executiveId));
  }

  if (params.data.clientId) {
    conditions.push(eq(paymentsTable.clientId, params.data.clientId));
  }

  if (params.data.creditId) {
    conditions.push(eq(paymentsTable.creditId, params.data.creditId));
  }

  if (params.data.dateFrom) {
    conditions.push(gte(paymentsTable.paymentDate, params.data.dateFrom));
  }

  if (params.data.dateTo) {
    conditions.push(lte(paymentsTable.paymentDate, params.data.dateTo));
  }

  const rows = await db
    .select({
      ...getTableColumns(paymentsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(paymentsTable.executiveId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(paymentsTable.paymentDate);

  res.json(rows.map(formatPayment));
});

router.get("/payments/pending-validation", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      ...getTableColumns(paymentsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(paymentsTable.executiveId, usersTable.id))
    .where(eq(paymentsTable.paymentStatus, "pending_validation"))
    .orderBy(paymentsTable.createdAt);

  res.json(rows.map(formatPayment));
});

router.patch("/payments/:id/validate", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id inválido" }); return; }

  const { action } = req.body;
  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ error: "action debe ser 'approve' o 'reject'" });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id));
  if (!payment) { res.status(404).json({ error: "Pago no encontrado" }); return; }

  if (payment.paymentStatus !== "pending_validation") {
    res.status(400).json({ error: "Este pago ya fue procesado" });
    return;
  }

  if (action === "reject") {
    await db.update(paymentsTable)
      .set({ paymentStatus: "rejected", notes: `${payment.notes ?? ""} | Rechazado por admin ID ${req.userId} el ${new Date().toISOString()}` })
      .where(eq(paymentsTable.id, id));

    const updated = await db.select({
      ...getTableColumns(paymentsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(paymentsTable.executiveId, usersTable.id))
    .where(eq(paymentsTable.id, id));

    res.json(formatPayment(updated[0]));
    return;
  }

  const amountPaid = parseFloat(payment.amountPaid);
  const [credit] = await db.select().from(creditsTable).where(eq(creditsTable.id, payment.creditId));
  if (!credit) { res.status(404).json({ error: "Crédito no encontrado" }); return; }

  const currentBalance = parseFloat(credit.remainingBalance);
  const amountExpected = parseFloat(credit.weeklyPayment);
  const updatedBalance = Math.max(0, currentBalance - amountPaid);
  const newPaymentNumber = credit.currentPaymentNumber + 1;

  let finalStatus = "on_time";
  if (amountPaid < amountExpected) finalStatus = "partial";
  if (payment.lateFee && parseFloat(payment.lateFee) > 0) finalStatus = "late";

  await db.update(paymentsTable)
    .set({
      paymentStatus: finalStatus,
      updatedBalance: updatedBalance.toString(),
      notes: `${payment.notes ?? ""} | Validado por admin ID ${req.userId} el ${new Date().toISOString()}`,
    })
    .where(eq(paymentsTable.id, id));

  await db.update(creditsTable)
    .set({
      currentPaymentNumber: newPaymentNumber,
      remainingBalance: updatedBalance.toString(),
      status: updatedBalance <= 0 ? "completed" : "active",
      renewalEligible: newPaymentNumber >= Math.floor(credit.termWeeks * 0.8),
    })
    .where(eq(creditsTable.id, payment.creditId));

  if (finalStatus === "on_time" || amountPaid >= amountExpected) {
    await db.update(clientsTable)
      .set({ status: "current" })
      .where(eq(clientsTable.id, payment.clientId));
  }

  if (payment.executiveId) {
    await db.insert(cajaMovementsTable).values({
      executiveId: payment.executiveId,
      movementType: "collection",
      amount: amountPaid.toString(),
      description: `Pago #${newPaymentNumber} validado - Cliente ID ${payment.clientId}`,
      relatedPaymentId: payment.id,
    });
  }

  const updated = await db.select({
    ...getTableColumns(paymentsTable),
    clientName: clientsTable.fullName,
    executiveName: usersTable.fullName,
  })
  .from(paymentsTable)
  .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
  .leftJoin(usersTable, eq(paymentsTable.executiveId, usersTable.id))
  .where(eq(paymentsTable.id, id));

  res.json(formatPayment(updated[0]));
});

router.post("/payments", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { clientId, creditId, paymentDate, amountPaid, lateFee, notes } = parsed.data;
  const executiveId = req.userRole === "executive" ? req.userId : (parsed.data.executiveId ?? null);

  const [credit] = await db.select().from(creditsTable).where(eq(creditsTable.id, creditId));
  if (!credit) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }

  const amountExpected = parseFloat(credit.weeklyPayment);
  const currentBalance = parseFloat(credit.remainingBalance);
  const newPaymentNumber = credit.currentPaymentNumber + 1;

  const disbDate = new Date(credit.disbursementDate);
  disbDate.setDate(disbDate.getDate() + newPaymentNumber * 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLate = Math.max(0, Math.floor((today.getTime() - disbDate.getTime()) / msPerDay));
  const calculatedLateFee = daysLate > 0 ? amountExpected * LATE_FEE_RATE : 0;
  const finalLateFee = lateFee ?? calculatedLateFee;

  const [payment] = await db.insert(paymentsTable).values({
    clientId,
    creditId,
    paymentNumber: newPaymentNumber,
    paymentDate,
    amountPaid: amountPaid.toString(),
    amountExpected: amountExpected.toString(),
    lateFee: finalLateFee > 0 ? finalLateFee.toString() : null,
    updatedBalance: currentBalance.toString(),
    paymentStatus: "pending_validation",
    executiveId,
    notes: notes ?? `Registrado por ejecutivo ID ${executiveId} - Pendiente de validación`,
  }).returning();

  res.status(201).json(formatPayment({ ...payment, clientName: null, executiveName: null }));
});

router.get("/payments/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      ...getTableColumns(paymentsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(paymentsTable.executiveId, usersTable.id))
    .where(eq(paymentsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json(formatPayment(row));
});

export default router;
