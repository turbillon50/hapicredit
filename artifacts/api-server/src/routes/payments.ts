import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, paymentsTable, creditsTable, clientsTable, usersTable, cajaMovementsTable, alertsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreatePaymentBody,
  GetPaymentParams,
  ListPaymentsQueryParams,
} from "@workspace/api-zod";

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
      ...paymentsTable,
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

router.post("/payments", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { clientId, creditId, paymentDate, amountPaid, lateFee, notes } = parsed.data;
  const executiveId = req.userRole === "executive" ? req.userId : (parsed.data.executiveId ?? null);

  // Get credit
  const [credit] = await db.select().from(creditsTable).where(eq(creditsTable.id, creditId));
  if (!credit) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }

  const amountExpected = parseFloat(credit.weeklyPayment);
  const currentBalance = parseFloat(credit.remainingBalance);
  const updatedBalance = Math.max(0, currentBalance - amountPaid + (lateFee ?? 0));
  const newPaymentNumber = credit.currentPaymentNumber + 1;

  // Determine status
  let paymentStatus = "on_time";
  if (amountPaid < amountExpected) paymentStatus = "partial";
  if (lateFee && lateFee > 0) paymentStatus = "late";

  const [payment] = await db.insert(paymentsTable).values({
    clientId,
    creditId,
    paymentNumber: newPaymentNumber,
    paymentDate,
    amountPaid: amountPaid.toString(),
    amountExpected: amountExpected.toString(),
    lateFee: lateFee != null ? lateFee.toString() : null,
    updatedBalance: updatedBalance.toString(),
    paymentStatus,
    executiveId,
    notes,
  }).returning();

  // Update credit balance
  await db.update(creditsTable)
    .set({
      currentPaymentNumber: newPaymentNumber,
      remainingBalance: updatedBalance.toString(),
      status: updatedBalance <= 0 ? "completed" : "active",
      renewalEligible: newPaymentNumber >= Math.floor(credit.termWeeks * 0.8),
    })
    .where(eq(creditsTable.id, creditId));

  // Update client status
  if (paymentStatus === "on_time" || (amountPaid >= amountExpected)) {
    await db.update(clientsTable)
      .set({ status: "current" })
      .where(eq(clientsTable.id, clientId));
  }

  // Create caja movement
  if (executiveId) {
    await db.insert(cajaMovementsTable).values({
      executiveId,
      movementType: "collection",
      amount: amountPaid.toString(),
      description: `Pago #${newPaymentNumber} - Cliente ID ${clientId}`,
      relatedPaymentId: payment.id,
    });
  }

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
      ...paymentsTable,
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
