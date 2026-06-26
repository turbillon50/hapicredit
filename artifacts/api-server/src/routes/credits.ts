import { Router } from "express";
import { and, auditLogTable, clientsTable, creditsTable, db, eq, getTableColumns, notesTable, publicRequestsTable, sql, usersTable } from "@workspace/db";
import { resolveClientId, isClientRole } from "../lib/clientResolver";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendCreditDecisionEmail } from "../lib/email";
import { sendPushToAdmins, sendPushToClient } from "../lib/push";
import {
  CreateCreditBody,
  UpdateCreditBody,
  GetCreditParams,
  UpdateCreditParams,
  ListCreditsQueryParams,
} from "@workspace/api-zod";
import { sendCreditStatusEmail } from "../lib/email";

const router = Router();

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
    nextPaymentDate: deriveNextPaymentDate(c),
  };
}

// Derived: disbursement + 7 days per upcoming payment number. Only for active credits.
function deriveNextPaymentDate(c: typeof creditsTable.$inferSelect): string | null {
  if (c.status !== "active" || !c.disbursementDate) return null;
  const base = new Date(c.disbursementDate + "T12:00:00Z");
  if (isNaN(base.getTime())) return null;
  const n = Math.min((c.currentPaymentNumber ?? 0) + 1, c.termWeeks);
  base.setUTCDate(base.getUTCDate() + 7 * n);
  return base.toISOString().split("T")[0];
}

router.get("/credits", requireAuth, async (req, res): Promise<void> => {
  const params = ListCreditsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (isClientRole(req.userRole)) {
    const clientId = await resolveClientId(req.userId!);
    if (!clientId) { res.json([]); return; }
    conditions.push(eq(creditsTable.clientId, clientId));
  } else if (req.userRole === "executive") {
    conditions.push(eq(creditsTable.executiveId, req.userId!));
  } else if (req.userRole === "admin" && req.userParentId !== null) {
    // Branch admin: only see credits from their tree
    conditions.push(eq(usersTable.treeId, req.userTreeId!));
    if (params.data.executiveId) {
      conditions.push(eq(creditsTable.executiveId, params.data.executiveId));
    }
  } else {
    // Superadmin: sees all trees
    if (params.data.executiveId) {
      conditions.push(eq(creditsTable.executiveId, params.data.executiveId));
    }
  }

  if (params.data.clientId && req.userRole !== "client") {
    conditions.push(eq(creditsTable.clientId, params.data.clientId));
  }

  if (params.data.status) {
    conditions.push(eq(creditsTable.status, params.data.status));
  }

  const rows = await db
    .select({
      ...getTableColumns(creditsTable),
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

// GET /credits/my-credit -- active credit for authenticated client
// NOTE: must be before /credits/:id
router.get("/credits/my-credit", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  const resolvedClientId = await resolveClientId(req.userId!);
  if (!resolvedClientId) { res.status(404).json({ error: "No client record found" }); return; }
  const [clientRecord] = await db.select({ id: clientsTable.id, fullName: clientsTable.fullName }).from(clientsTable).where(eq(clientsTable.id, resolvedClientId)).limit(1);
  if (!clientRecord) { res.status(404).json({ error: "No client record found" }); return; }

  const rows = await db
    .select({
      ...getTableColumns(creditsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(creditsTable)
    .leftJoin(clientsTable, eq(creditsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(creditsTable.executiveId, usersTable.id))
    .where(and(eq(creditsTable.clientId, clientRecord.id), eq(creditsTable.status, "active")))
    .orderBy(creditsTable.createdAt);

  const credit = rows[0];
  if (!credit) { res.status(404).json({ error: "No active credit found" }); return; }

  res.json(formatCredit(credit));
});

// Apply for a credit (creates pending application)
router.post("/credits/apply", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const { clientId, amount, termWeeks, purpose, executiveId: bodyExecId } = req.body;

  const amt = parseFloat(amount);
  const weeks = parseInt(termWeeks, 10);

  if (!clientId || isNaN(amt) || isNaN(weeks) || amt <= 0 || weeks <= 0) {
    res.status(400).json({ error: "clientId, amount y termWeeks son requeridos y deben ser validos" });
    return;
  }

  const isNewClient = Boolean(req.body.isNewClient);

  // Sin limites fijos de monto/plazo: el cliente solicita libremente y
  // administracion ajusta los parametros y aprueba desde el panel.
  // Solo se conserva el guard basico de valores positivos (mas arriba).

  // Flat 30% for new clients, 5% monthly (weeks/4 months) for existing clients.
  const interest = isNewClient
    ? amt * 0.30
    : amt * 0.05 * (weeks / 4);

  const totalToRepay = amt + interest;
  const weeklyPayment = totalToRepay / weeks;
  const disbursementDate = new Date().toISOString().split("T")[0];
  const executiveId = req.userRole === "executive" ? req.userId : (bodyExecId ? parseInt(bodyExecId, 10) : null);

  const [credit] = await db.insert(creditsTable).values({
    clientId: parseInt(clientId, 10),
    executiveId,
    amount: amt.toString(),
    disbursementDate,
    termWeeks: weeks,
    weeklyPayment: weeklyPayment.toFixed(2),
    openingFee: "0.00",
    totalToRepay: totalToRepay.toFixed(2),
    remainingBalance: totalToRepay.toFixed(2),
    status: "pending",
    notes: purpose ?? null,
  }).returning();

  res.status(201).json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// Review (approve / reject) a pending application
router.patch("/credits/:id/review", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }

  const { action, notes } = req.body;
  if (action !== "approve" && action !== "reject" && action !== "needs_info") {
    res.status(400).json({ error: "action debe ser \'approve\', \'reject\' o \'needs_info\'" });
    return;
  }
  if (action === "needs_info" && !notes) {
    res.status(400).json({ error: "Especifica qué información se requiere en las notas" });
    return;
  }

  const newStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "needs_info";
  const updates: Record<string, unknown> = { status: newStatus };
  if (action === "approve") updates.disbursementDate = new Date().toISOString().split("T")[0];
  if (notes) updates.notes = String(notes);

  const [credit] = await db.update(creditsTable)
    .set(updates as any)
    .where(eq(creditsTable.id, id))
    .returning();

  if (!credit) { res.status(404).json({ error: "Credit not found" }); return; }

  // Insert note in client thread when needs_info
  if (action === "needs_info") {
    await db.insert(notesTable).values({
      clientId: credit.clientId,
      authorId: null,
      noteType: "mensaje_cliente",
      content: `📋 Requerimos información adicional: ${notes}`,
    });
  }

  // Notify client via email (best-effort: match client → user by fullName)
  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, credit.clientId));
    if (client) {
      const [user] = client.userId
        ? await db
            .select({ email: usersTable.email, fullName: usersTable.fullName })
            .from(usersTable)
            .where(eq(usersTable.id, client.userId))
        : await db
            .select({ email: usersTable.email, fullName: usersTable.fullName })
            .from(usersTable)
            .where(eq(usersTable.fullName, client.fullName));
      const pushMsg =
        action === "approve" ? `Tu crédito por $${parseFloat(credit.amount).toLocaleString("es-MX")} fue aprobado 🎉`
        : action === "reject" ? "Tu solicitud de crédito fue rechazada."
        : "Necesitamos más información para tu solicitud de crédito.";
      const _n = await Promise.allSettled([
        sendPushToClient(client.id, { title: "credeti", body: pushMsg, url: "/mi-credito" }),
        ...(user?.email ? [sendCreditDecisionEmail({ to: user.email, clientName: client.fullName, action: action as "approve" | "reject" | "needs_info", amount: parseFloat(credit.amount), notes: notes ? String(notes) : undefined })] : []),
      ]);
      _n.forEach((r, i) => { if (r.status === "rejected") console.error(`[notify:review#${i}]`, r.reason?.message || r.reason); });
    }
  } catch {}

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// Standard Create
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
      ...getTableColumns(creditsTable),
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
    .set(updates as Partial<typeof creditsTable.$inferInsert>)
    .where(eq(creditsTable.id, params.data.id))
    .returning();

  if (!credit) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }

  // Notify client by email when the status changes to a decision state.
  if (updates.status === "active" || updates.status === "rejected") {
    try {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, credit.clientId));
      if (client) {
        const [user] = client.userId
          ? await db.select({ email: usersTable.email, fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, client.userId))
          : await db.select({ email: usersTable.email, fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.fullName, client.fullName));
        if (user?.email) {
          await sendCreditStatusEmail({
            to: user.email,
            clientName: client.fullName,
            action: updates.status === "active" ? "approve" : "reject",
            amount: parseFloat(credit.amount),
            weeklyPayment: parseFloat(String(credit.weeklyPayment ?? "0")),
            termWeeks: Number(credit.termWeeks ?? 0),
          }).catch((e: any) => console.error("[notify:creditStatus]", e?.message || e));
        }
      }
    } catch {}
  }

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});


// ─── POST /api/me/apply — logged-in client applies for a credit ──────────────
// Creates (or reuses) the client record linked to this user and a pending
// credit, so the application shows up in the admin "solicitudes" queue and in
// the client's "mi crédito" page immediately.
router.post("/me/apply", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

  const { personalInfo, businessInfo, references, guarantor, creditRequest, documents, source } = req.body ?? {};
  const fullName = (personalInfo?.fullName ?? user.fullName ?? "").trim();
  const phone = (personalInfo?.phone ?? user.phone ?? "").trim();
  if (!fullName || !phone) {
    res.status(400).json({ error: "Nombre y teléfono son requeridos" });
    return;
  }

  // Find or create the client record.
  // Resolve client record robustly (FK → name → phone, unique only, backfills FK)
  const resolvedId = await resolveClientId(req.userId!);
  let client = resolvedId
    ? (await db.select().from(clientsTable).where(eq(clientsTable.id, resolvedId)).limit(1))[0] ?? null
    : null;
  if (!client) {
    [client] = await db.insert(clientsTable).values({
      fullName,
      phone,
      address: personalInfo?.address ?? null,
      curp: personalInfo?.curp ?? null,
      guarantorName: guarantor?.fullName ?? null,
      guarantorPhone: guarantor?.phone ?? null,
      status: "current",
      userId: req.userId!,
    }).returning();
  } else if (!client.userId) {
    // Backfill userId FK on existing record
    [client] = await db.update(clientsTable).set({ userId: req.userId! }).where(eq(clientsTable.id, client.id)).returning();
  }

  // Reject duplicate open applications.
  const open = await db.select({ id: creditsTable.id, status: creditsTable.status })
    .from(creditsTable)
    .where(and(eq(creditsTable.clientId, client.id), eq(creditsTable.status, "pending")));
  if (open.length > 0) {
    res.status(409).json({ error: "Ya tienes una solicitud en revisión", creditId: open[0].id });
    return;
  }

  // Owner business rules. A client is "new" if they have no completed credits.
  const history = await db.select({ id: creditsTable.id })
    .from(creditsTable)
    .where(and(eq(creditsTable.clientId, client.id), eq(creditsTable.status, "completed")));
  const isNewClient = history.length === 0;

  const amt = parseFloat(creditRequest?.requestedAmount);
  const weeks = parseInt(creditRequest?.termWeeks, 10);
  if (isNaN(amt) || isNaN(weeks)) {
    res.status(400).json({ error: "Monto y plazo son requeridos" });
    return;
  }
  // Sin limites fijos: el cliente solicita el monto/plazo que quiera y
  // administracion lo ajusta y aprueba desde el panel. Solo validamos
  // que sean valores positivos (ya cubierto por isNaN arriba).
  if (amt <= 0 || weeks <= 0) { res.status(400).json({ error: "Monto y plazo deben ser mayores a cero" }); return; }

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
    notes: creditRequest?.purpose ?? null,
  }).returning();

  // Archive the full KYC payload for the expediente (same shape as /public/apply).
  try {
  await db.insert(publicRequestsTable).values({
    name: fullName,
    phone,
    email: user.email ?? null,
    message: JSON.stringify({
      type: "credit_application",
      creditId: credit.id,
      userId: user.id,
      clientId: client.id,
      personalInfo: personalInfo ?? { fullName, phone },
      businessInfo: businessInfo ?? {},
      references: references ?? [],
      guarantor: guarantor ?? {},
      creditRequest: { ...creditRequest, requestedAmount: amt, termWeeks: weeks, weeklyPayment, totalToRepay, isNewClient },
      documents: documents ?? {},
      source: source ?? "app",
      submittedAt: new Date().toISOString(),
    }),
  });
  } catch { /* archive is best-effort */ }

  await sendPushToAdmins({
    title: "Nueva solicitud de crédito",
    body: `${fullName} solicitó $${amt.toLocaleString("es-MX")} a ${weeks} semanas`,
    url: "/admin/solicitudes",
  }).catch((e: any) => console.error("[notify:me/apply admins]", e?.message || e));

  res.status(201).json({
    success: true,
    referenceNumber: `CT-${String(credit.id).padStart(5, "0")}`,
    credit: formatCredit({ ...credit, clientName: fullName, executiveName: null }),
  });
});

// Cliente responde a needs_info → regresa el crédito a pending
router.patch("/credits/:id/client-response", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = (req as any).userId;

    const [credit] = await db.select().from(creditsTable).where(eq(creditsTable.id, Number(id)));
    if (!credit) { res.status(404).json({ error: "Crédito no encontrado" }); return; }
    if (credit.status !== "needs_info") { res.status(400).json({ error: "El crédito no está en estado needs_info" }); return; }

    // Verificar que el cliente es el dueño del crédito
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.userId, userId));
    if (!client || credit.clientId !== client.id) {
      res.status(403).json({ error: "No autorizado" }); return;
    }

    // Regresar a pending
    await db.update(creditsTable).set({ status: "pending" }).where(eq(creditsTable.id, Number(id)));

    // Si el cliente mandó un mensaje, guardarlo
    if (message) {
      await db.insert(notesTable).values({
        clientId: client.id,
        authorId: client.userId ?? null,
        noteType: "mensaje_cliente",
        content: message,
      });
    }

    // Push a admins
    await sendPushToAdmins({
      title: "📨 Cliente respondió a solicitud de info",
      body: `${client.fullName} respondió a la solicitud de información adicional`,
      url: "/admin/solicitudes",
    });

    res.json({ success: true, message: "Solicitud reenviada a revisión" });
  } catch (error) {
    console.error("client-response error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});


// ─── PATCH /api/credits/:id/conditions ── edit loan terms + observations ──────
// Admin/executive adjust amount, term, payment, totals, disbursement date and
// notes on an existing credit. Every change is appended to the audit log.
router.patch("/credits/:id/conditions", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  const numericFields = ["amount", "weeklyPayment", "totalToRepay", "remainingBalance", "openingFee"] as const;
  for (const f of numericFields) {
    const raw = b[f];
    if (raw === undefined || raw === null || raw === "") continue;
    const n = Number(raw);
    if (isNaN(n) || n < 0) { res.status(400).json({ error: `Valor invalido en ${f}` }); return; }
    updates[f] = n.toFixed(2);
  }
  if (b.termWeeks !== undefined && b.termWeeks !== null && b.termWeeks !== "") {
    const t = parseInt(String(b.termWeeks), 10);
    if (isNaN(t) || t <= 0 || t > 520) { res.status(400).json({ error: "Plazo invalido" }); return; }
    updates.termWeeks = t;
  }
  if (typeof b.disbursementDate === "string" && b.disbursementDate.trim()) {
    updates.disbursementDate = b.disbursementDate.trim();
  }
  if (b.notes !== undefined) {
    updates.notes = b.notes === null || b.notes === "" ? null : String(b.notes);
  }
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No hay cambios que guardar" }); return; }

  const [before] = await db.select().from(creditsTable).where(eq(creditsTable.id, id));
  if (!before) { res.status(404).json({ error: "Credito no encontrado" }); return; }

  const [credit] = await db
    .update(creditsTable)
    .set(updates as Partial<typeof creditsTable.$inferInsert>)
    .where(eq(creditsTable.id, id))
    .returning();

  try {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of Object.keys(updates)) {
      diff[k] = { from: (before as Record<string, unknown>)[k], to: (credit as Record<string, unknown>)[k] };
    }
    await db.insert(auditLogTable).values({
      userId: req.userId ?? null,
      action: "credit.conditions_updated",
      resourceType: "credit",
      resourceId: String(id),
      metadata: diff,
    });
  } catch (e) {
    console.error("[audit:credit.conditions]", (e as Error)?.message || e);
  }

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// ─── GET /credits/:id/application — documentos e info archivada de la solicitud ───
router.get("/credits/:id/application", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalido" }); return; }

  // Buscar el archivo KYC de esta solicitud en public_requests (message contiene creditId).
  const rows = await db.select().from(publicRequestsTable)
    .where(sql`${publicRequestsTable.message} LIKE ${'%"creditId":' + id + '%'}`)
    .orderBy(sql`${publicRequestsTable.id} DESC`)
    .limit(1);

  if (rows.length === 0) { res.json({ documents: {}, found: false }); return; }

  let parsed: any = {};
  try { parsed = JSON.parse(rows[0].message as string); } catch { parsed = {}; }

  // Normalizar documentos a un arreglo para el front.
  const docsObj = parsed.documents ?? {};
  const documents = Object.entries(docsObj).map(([key, v]: [string, any]) => ({
    type: key,
    url: v?.url ?? null,
    filename: v?.filename ?? null,
    provided: v?.provided ?? !!(v?.url),
  })).filter(d => d.url || d.provided);

  res.json({
    found: true,
    documents,
    personalInfo: parsed.personalInfo ?? null,
    references: parsed.references ?? [],
    creditRequest: parsed.creditRequest ?? null,
    submittedAt: parsed.submittedAt ?? null,
  });
});

// ─── GET /me/last-application — datos archivados de la ultima solicitud del cliente ───
// Para renovacion: el cliente no recaptura nada, se precarga lo que ya dio.
router.get("/me/last-application", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  const clientId = await resolveClientId(req.userId!);
  if (!clientId) { res.json({ found: false }); return; }

  // Credito mas reciente del cliente
  const creditRows = await db.select({ id: creditsTable.id }).from(creditsTable)
    .where(eq(creditsTable.clientId, clientId))
    .orderBy(sql`${creditsTable.id} DESC`)
    .limit(1);
  if (creditRows.length === 0) { res.json({ found: false }); return; }
  const creditId = creditRows[0].id;

  const rows = await db.select().from(publicRequestsTable)
    .where(sql`${publicRequestsTable.message} LIKE ${'%"creditId":' + creditId + '%'}`)
    .orderBy(sql`${publicRequestsTable.id} DESC`)
    .limit(1);
  if (rows.length === 0) { res.json({ found: false }); return; }

  let parsed: any = {};
  try { parsed = JSON.parse(rows[0].message as string); } catch { parsed = {}; }

  const docsObj = parsed.documents ?? {};
  const documents = Object.entries(docsObj).map(([key, v]: [string, any]) => ({
    type: key,
    url: v?.url ?? null,
    filename: v?.filename ?? null,
    provided: v?.provided ?? !!(v?.url),
  })).filter(d => d.url || d.provided);

  res.json({
    found: true,
    personalInfo: parsed.personalInfo ?? null,
    businessInfo: parsed.businessInfo ?? null,
    references: parsed.references ?? [],
    creditRequest: parsed.creditRequest ?? null,
    documents,
  });
});

export default router;
