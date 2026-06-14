import { Router } from "express";
import { auditLogTable, clientsTable, creditsTable, db, eq, pool, publicRequestsTable } from "@workspace/db";
import { sendPushToAdmins } from "../lib/push";
import { CreatePublicRequestBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendAdminNewRequestEmail, sendApplicantConfirmationEmail, sendApplicantUpdateEmail } from "../lib/email";

const router = Router();

router.post("/public/requests", async (req, res): Promise<void> => {
  const parsed = CreatePublicRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(publicRequestsTable).values(parsed.data).returning();
  const refNumber = `HC-${String(record.id).padStart(5, "0")}`;

  sendAdminNewRequestEmail({
    name: record.name,
    phone: record.phone,
    amount: (record as any).amount ?? "N/D",
    ref: refNumber,
    email: record.email ?? undefined,
  }).catch(() => {});

  if (record.email) {
    sendApplicantConfirmationEmail({ to: record.email, name: record.name, ref: refNumber }).catch(() => {});
  }

  res.status(201).json({ success: true, id: record.id, referenceNumber: refNumber, message: "Solicitud recibida. Te contactaremos pronto." });
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

  // Awaited so the serverless function does not freeze before the email HTTP completes.
  const _notify = await Promise.allSettled([
    sendPushToAdmins({
      title: "Nueva solicitud pública",
      body: `${fullName} solicitó $${amt.toLocaleString("es-MX")} (${refNumber})`,
      url: "/admin/solicitudes",
    }),
    sendAdminNewRequestEmail({ name: fullName, phone, amount: amt, ref: refNumber, email: email ?? undefined }),
    ...(email ? [sendApplicantConfirmationEmail({ to: email, name: fullName, ref: refNumber })] : []),
  ]);
  _notify.forEach((r, i) => { if (r.status === "rejected") console.error(`[notify:public/apply#${i}]`, r.reason?.message || r.reason); });

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

// ── Auto-applied review schema (status + comment thread) for public_requests ──
let _reviewSchemaReady = false;
async function ensureReviewSchema(): Promise<void> {
  if (_reviewSchemaReady) return;
  await pool.query(`ALTER TABLE public_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE public_requests ADD COLUMN IF NOT EXISTS decided_by integer`);
  await pool.query(`ALTER TABLE public_requests ADD COLUMN IF NOT EXISTS decided_at timestamptz`);
  await pool.query(`CREATE TABLE IF NOT EXISTS public_request_comments (
    id serial PRIMARY KEY,
    request_id integer NOT NULL REFERENCES public_requests(id),
    author_id integer,
    author_name text,
    comment text NOT NULL,
    notified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  _reviewSchemaReady = true;
}

async function authorName(userId?: number): Promise<string> {
  if (!userId) return "Asesor";
  const r = await pool.query<{ full_name: string }>(`SELECT full_name FROM users WHERE id=$1`, [userId]);
  return r.rows[0]?.full_name ?? "Asesor";
}

// Detail + comment thread for one public request
router.get("/public/requests/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureReviewSchema();
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const r = await pool.query(`SELECT id, name, phone, email, message, status, decided_at, created_at FROM public_requests WHERE id=$1`, [id]);
  if (!r.rows[0]) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
  const c = await pool.query(`SELECT id, author_name, comment, notified, created_at FROM public_request_comments WHERE request_id=$1 ORDER BY created_at ASC`, [id]);
  res.json({ request: r.rows[0], comments: c.rows });
});

// Add an advisor comment, optionally emailed to the applicant
router.post("/public/requests/:id/comment", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureReviewSchema();
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const { comment, notify } = (req.body ?? {}) as { comment?: string; notify?: boolean };
  if (!comment || !comment.trim()) { res.status(400).json({ error: "El comentario esta vacio" }); return; }
  const rec = await pool.query<{ name: string; email: string | null }>(`SELECT name, email FROM public_requests WHERE id=$1`, [id]);
  if (!rec.rows[0]) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
  const applicant = rec.rows[0];
  let notified = false;
  if (notify && applicant.email) {
    const ref = `HC-${String(id).padStart(5, "0")}`;
    const out = await sendApplicantUpdateEmail({ to: applicant.email, name: applicant.name, ref, decision: "contacted", comment: comment.trim() });
    notified = out.sent;
  }
  await pool.query(
    `INSERT INTO public_request_comments (request_id, author_id, author_name, comment, notified) VALUES ($1,$2,$3,$4,$5)`,
    [id, req.userId, await authorName(req.userId), comment.trim(), notified],
  );
  res.json({ ok: true, notified, hasEmail: !!applicant.email });
});

// Approve / reject a public request (+ optional comment + applicant email)
router.post("/public/requests/:id/decision", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureReviewSchema();
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const { decision, comment } = (req.body ?? {}) as { decision?: string; comment?: string };
  if (!decision || !["approved", "rejected", "contacted", "pending"].includes(decision)) {
    res.status(400).json({ error: "Decision invalida" }); return;
  }
  const rec = await pool.query<{ name: string; email: string | null }>(`SELECT name, email FROM public_requests WHERE id=$1`, [id]);
  if (!rec.rows[0]) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
  const applicant = rec.rows[0];
  await pool.query(`UPDATE public_requests SET status=$1, decided_by=$2, decided_at=now() WHERE id=$3`, [decision, req.userId ?? null, id]);
  let notified = false;
  if (applicant.email) {
    const ref = `HC-${String(id).padStart(5, "0")}`;
    const out = await sendApplicantUpdateEmail({ to: applicant.email, name: applicant.name, ref, decision, comment: comment?.trim() || undefined });
    notified = out.sent;
  }
  const label = decision === "approved" ? "Solicitud aprobada" : decision === "rejected" ? "Solicitud rechazada" : decision === "contacted" ? "Solicitante contactado" : "Estado actualizado";
  const note = comment && comment.trim() ? `${label}: ${comment.trim()}` : label;
  await pool.query(
    `INSERT INTO public_request_comments (request_id, author_id, author_name, comment, notified) VALUES ($1,$2,$3,$4,$5)`,
    [id, req.userId, await authorName(req.userId), note, notified],
  );
  res.json({ ok: true, status: decision, notified, hasEmail: !!applicant.email });
});


// Edit the editable fields of a public request (control center).
// Merges rich fields into the JSON `message` and updates name/phone/email.
router.post("/public/requests/:id/details", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureReviewSchema();
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;
  const rec = await pool.query<{ name: string; phone: string; email: string | null; message: string }>(
    `SELECT name, phone, email, message FROM public_requests WHERE id=$1`, [id]);
  if (!rec.rows[0]) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
  const cur = rec.rows[0];

  const str = (v: unknown): string | undefined => (v === undefined || v === null ? undefined : String(v).trim());
  const name = str(b.name) ?? cur.name;
  const phone = str(b.phone) ?? cur.phone;
  const emailRaw = str(b.email);
  const email = emailRaw === undefined ? cur.email : emailRaw === "" ? null : emailRaw;

  let parsed: Record<string, any> = {};
  try { parsed = cur.message ? JSON.parse(cur.message) : {}; } catch { parsed = {}; }
  if (typeof parsed !== "object" || parsed === null) parsed = {};
  parsed.type = parsed.type ?? "credit_application";
  parsed.personalInfo = parsed.personalInfo ?? {};
  parsed.creditRequest = parsed.creditRequest ?? {};
  if (b.curp !== undefined) parsed.personalInfo.curp = str(b.curp) ?? "";
  if (b.address !== undefined) parsed.personalInfo.address = str(b.address) ?? "";
  if (b.altPhone !== undefined) parsed.personalInfo.altPhone = str(b.altPhone) ?? "";
  if (b.purpose !== undefined) parsed.creditRequest.purpose = str(b.purpose) ?? "";
  if (b.requestedAmount !== undefined && b.requestedAmount !== "") {
    const n = Number(b.requestedAmount);
    if (isNaN(n) || n < 0) { res.status(400).json({ error: "Monto invalido" }); return; }
    parsed.creditRequest.requestedAmount = n;
  }
  if (b.termWeeks !== undefined && b.termWeeks !== "") {
    const t = parseInt(String(b.termWeeks), 10);
    if (isNaN(t) || t <= 0 || t > 520) { res.status(400).json({ error: "Plazo invalido" }); return; }
    parsed.creditRequest.termWeeks = t;
  }
  const newMessage = JSON.stringify(parsed);

  await pool.query(`UPDATE public_requests SET name=$1, phone=$2, email=$3, message=$4 WHERE id=$5`,
    [name, phone, email, newMessage, id]);

  try {
    await db.insert(auditLogTable).values({
      userId: req.userId ?? null,
      action: "public_request.details_updated",
      resourceType: "public_request",
      resourceId: String(id),
      metadata: { fields: Object.keys(b) },
    });
  } catch (e) { console.error("[audit:pr.details]", (e as Error)?.message || e); }

  res.json({ ok: true });
});

export default router;
