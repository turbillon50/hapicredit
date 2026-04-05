import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, creditsTable, clientsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateCreditBody,
  UpdateCreditBody,
  GetCreditParams,
  UpdateCreditParams,
  ListCreditsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatCredit(c: typeof creditsTable.$inferSelect & { clientName?: string | null; executiveName?: string | null }) {
  return {
    ...c,
    amount: parseFloat(c.amount),
    weeklyPayment: parseFloat(c.weeklyPayment),
    totalToRepay: parseFloat(c.totalToRepay),
    remainingBalance: parseFloat(c.remainingBalance),
    openingFee: c.openingFee ? parseFloat(c.openingFee) : null,
    clientName: c.clientName ?? null,
    executiveName: c.executiveName ?? null,
  };
}

router.get("/credits", requireAuth, async (req, res): Promise<void> => {
  const params = ListCreditsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (req.userRole === "executive") {
    conditions.push(eq(creditsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(creditsTable.executiveId, params.data.executiveId));
  }

  if (params.data.clientId) {
    conditions.push(eq(creditsTable.clientId, params.data.clientId));
  }

  if (params.data.status) {
    conditions.push(eq(creditsTable.status, params.data.status));
  }

  const rows = await db
    .select({
      ...creditsTable,
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(creditsTable)
    .leftJoin(clientsTable, eq(creditsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(creditsTable.executiveId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(creditsTable.createdAt);

  res.json(rows.map(formatCredit));
});

// ─── Apply for a credit (creates pending application) ────────────────────────
router.post("/credits/apply", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const { clientId, amount, termWeeks, purpose, executiveId: bodyExecId } = req.body;

  const amt = parseFloat(amount);
  const weeks = parseInt(termWeeks, 10);

  if (!clientId || isNaN(amt) || isNaN(weeks) || amt <= 0 || weeks <= 0) {
    res.status(400).json({ error: "clientId, amount y termWeeks son requeridos y deben ser válidos" });
    return;
  }

  if (weeks !== 8 && weeks !== 13) {
    res.status(400).json({ error: "Solo se permiten plazos de 8 o 13 semanas" });
    return;
  }

  const RATE_8 = 175;
  const RATE_13 = 120;
  const COMMISSION = 0.10;

  const rate = weeks === 8 ? RATE_8 : RATE_13;
  const thousands = amt / 1000;
  const weeklyPayment = thousands * rate;
  const totalToRepay = weeklyPayment * weeks;
  const openingFee = amt * COMMISSION;
  const disbursementDate = new Date().toISOString().split("T")[0];
  const executiveId = req.userRole === "executive" ? req.userId : (bodyExecId ? parseInt(bodyExecId, 10) : null);

  const [credit] = await db.insert(creditsTable).values({
    clientId: parseInt(clientId, 10),
    executiveId,
    amount: amt.toString(),
    disbursementDate,
    termWeeks: weeks,
    weeklyPayment: weeklyPayment.toFixed(2),
    openingFee: openingFee.toFixed(2),
    totalToRepay: totalToRepay.toFixed(2),
    remainingBalance: totalToRepay.toFixed(2),
    status: "pending",
    notes: purpose ?? null,
  }).returning();

  res.status(201).json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// ─── Review (approve / reject) a pending application ─────────────────────────
router.patch("/credits/:id/review", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id inválido" }); return; }

  const { action } = req.body;
  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ error: "action debe ser 'approve' o 'reject'" });
    return;
  }

  const newStatus = action === "approve" ? "active" : "rejected";
  const updates: Record<string, unknown> = { status: newStatus };
  if (action === "approve") updates.disbursementDate = new Date().toISOString().split("T")[0];

  const [credit] = await db.update(creditsTable)
    .set(updates as any)
    .where(eq(creditsTable.id, id))
    .returning();

  if (!credit) { res.status(404).json({ error: "Credit not found" }); return; }

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// ─── Standard Create ──────────────────────────────────────────────────────────
router.post("/credits", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreateCreditBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, weeklyPayment, termWeeks, openingFee } = parsed.data;
  const totalToRepay = (weeklyPayment * termWeeks).toFixed(2);
  const remainingBalance = totalToRepay;

  const executiveId = req.userRole === "executive" ? req.userId : (parsed.data.executiveId ?? null);

  const [credit] = await db.insert(creditsTable).values({
    ...parsed.data,
    executiveId,
    amount: amount.toString(),
    weeklyPayment: weeklyPayment.toString(),
    totalToRepay,
    remainingBalance,
    openingFee: openingFee != null ? openingFee.toString() : null,
  }).returning();

  res.status(201).json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

router.get("/credits/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetCreditParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      ...creditsTable,
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(creditsTable)
    .leftJoin(clientsTable, eq(creditsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(creditsTable.executiveId, usersTable.id))
    .where(eq(creditsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }

  res.json(formatCredit(row));
});

router.patch("/credits/:id", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const params = UpdateCreditParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCreditBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }

  const [credit] = await db
    .update(creditsTable)
    .set(updates as Parameters<typeof creditsTable.$inferSelect>[0])
    .where(eq(creditsTable.id, params.data.id))
    .returning();

  if (!credit) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

export default router;
