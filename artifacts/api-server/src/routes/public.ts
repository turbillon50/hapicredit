import { Router } from "express";
import { clientsTable, creditsTable, db, eq, publicRequestsTable } from "@workspace/db";
import { sendPushToAdmins } from "../lib/push";
import { CreatePublicRequestBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.post("/public/requests", async (req, res): Promise<void> => {
  const parsed = CreatePublicRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(publicRequestsTable).values(parsed.data).returning();
  res.status(201).json({ success: true, id: record.id, message: "Solicitud recibida. Te contactaremos pronto." });
});

// Admin: list all public credit requests
router.get("/public/requests", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(publicRequestsTable).orderBy(publicRequestsTable.createdAt);
  res.json(rows);
});

// Public: full credit application with KYC + documents
router.post("/public/apply", async (req, res): Promise<void> => {
  const {
    fullName, phone, email,
    personalInfo, businessInfo, references, guarantor,
    creditRequest, documents, source,
  } = req.body;

  if (!fullName || !phone) {
    res.status(400).json({ error: "Campos obligatorios: nombre y teléfono" });
    return;
  }

  const RATE_8 = 175;
  const RATE_13 = 120;
  const amt = creditRequest?.requestedAmount ?? 5000;
  const rawWeeks = creditRequest?.termWeeks ?? 8;
  const weeks = rawWeeks === 8 || rawWeeks === 13 ? rawWeeks : 8;
  const rate = weeks === 8 ? RATE_8 : RATE_13;
  const thousands = amt / 1000;
  const weeklyPayment = thousands * rate;
  const totalPayment = weeklyPayment * weeks;
  const commission = amt * 0.10;
  const disbursement = amt - commission;

  const message = JSON.stringify({
    type: "credit_application",
    personalInfo: personalInfo ?? { fullName, phone },
    businessInfo: businessInfo ?? {},
    references: references ?? [],
    guarantor: guarantor ?? {},
    creditRequest: {
      ...creditRequest,
      requestedAmount: amt,
      termWeeks: weeks,
      weeklyPayment,
      totalPayment,
      commission,
      disbursement,
      ratePerThousand: rate,
    },
    documents: documents ?? {},
    source: source ?? "unknown",
    submittedAt: new Date().toISOString(),
  });

  const [record] = await db.insert(publicRequestsTable).values({
    name: fullName,
    phone,
    email: email ?? null,
    message,
  }).returning();

  const refNumber = `HC-${String(record.id).padStart(5, "0")}`;

  sendPushToAdmins({
    title: "Nueva solicitud pública",
    body: `${fullName} solicitó $${amt.toLocaleString("es-MX")} (${refNumber})`,
    url: "/admin/solicitudes",
  }).catch(() => {});

  res.status(201).json({ success: true, id: record.id, referenceNumber: refNumber });
});

// ─── Admin: convert a public request into client + pending credit ────────────
router.post("/public/requests/:id/convert", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id inválido" }); return; }

  const [record] = await db.select().from(publicRequestsTable).where(eq(publicRequestsTable.id, id));
  if (!record) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }

  let parsed: any = {};
  try { parsed = JSON.parse(record.message); } catch { /* plain-text request */ }
  if (parsed.creditId) {
    res.status(409).json({ error: "Esta solicitud ya está vinculada a un crédito", creditId: parsed.creditId });
    return;
  }

  const personalInfo = parsed.personalInfo ?? {};
  const guarantor = parsed.guarantor ?? {};
  const creditRequest = parsed.creditRequest ?? {};

  // Find or create the client.
  let [client] = await db.select().from(clientsTable).where(eq(clientsTable.phone, record.phone));
  if (!client) [client] = await db.select().from(clientsTable).where(eq(clientsTable.fullName, record.name));
  if (!client) {
    [client] = await db.insert(clientsTable).values({
      fullName: record.name,
      phone: record.phone,
      address: personalInfo.address ?? null,
      curp: personalInfo.curp ?? null,
      guarantorName: guarantor.fullName ?? null,
      guarantorPhone: guarantor.phone ?? null,
      executiveId: req.body?.executiveId ? parseInt(req.body.executiveId, 10) : null,
      status: "current",
    }).returning();
  }

  // Owner business rules (new client unless they have credit history).
  const amtRaw = parseFloat(req.body?.amount ?? creditRequest.requestedAmount);
  const weeksRaw = parseInt(req.body?.termWeeks ?? creditRequest.termWeeks, 10);
  const history = await db.select({ id: creditsTable.id }).from(creditsTable).where(eq(creditsTable.clientId, client.id));
  const isNewClient = history.length === 0;
  const amt = isNewClient ? Math.min(Math.max(isNaN(amtRaw) ? 1000 : amtRaw, 500), 1000) : Math.min(Math.max(isNaN(amtRaw) ? 5000 : amtRaw, 1000), 30000);
  const weeks = isNewClient ? 4 : Math.min(Math.max(isNaN(weeksRaw) ? 8 : weeksRaw, 4), 48);

  const interest = isNewClient ? amt * 0.30 : amt * 0.05 * (weeks / 4);
  const totalToRepay = amt + interest;
  const weeklyPayment = totalToRepay / weeks;

  const [credit] = await db.insert(creditsTable).values({
    clientId: client.id,
    executiveId: client.executiveId ?? null,
    amount: amt.toString(),
    disbursementDate: new Date().toISOString().split("T")[0],
    termWeeks: weeks,
    weeklyPayment: weeklyPayment.toFixed(2),
    openingFee: "0.00",
    totalToRepay: totalToRepay.toFixed(2),
    remainingBalance: totalToRepay.toFixed(2),
    status: "pending",
    notes: creditRequest.purpose ?? `Convertida de solicitud pública #${record.id}`,
  }).returning();

  // Mark the public request as linked so it can't be converted twice.
  try {
    await db.update(publicRequestsTable)
      .set({ message: JSON.stringify({ ...parsed, creditId: credit.id, convertedAt: new Date().toISOString() }) })
      .where(eq(publicRequestsTable.id, record.id));
  } catch { /* best-effort */ }

  res.status(201).json({ success: true, clientId: client.id, creditId: credit.id });
});

export default router;
