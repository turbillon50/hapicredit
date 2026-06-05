import { Router } from "express";
import { and, clientsTable, creditsTable, db, eq, getTableColumns, publicRequestsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendCreditDecisionEmail } from "../lib/email";
import { sendPushToAdmins, sendPushToClientByName } from "../lib/push";
import {
  CreateCreditBody,
  UpdateCreditBody,
  GetCreditParams,
  UpdateCreditParams,
  ListCreditsQueryParams,
} from "@workspace/api-zod";

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

  if (req.userRole === "executive") {
    conditions.push(eq(creditsTable.executiveId, req.userId!));
  } else if (req.userRole === "admin" && req.userParentId !== null) {
    // Branch admin: only see credits from their tree's executives
    conditions.push(eq(usersTable.treeId, req.userTreeId!));
    if (params.data.executiveId) {
      conditions.push(eq(creditsTable.executiveId, params.data.executiveId));
    }
  } else {
    // Superadmin (parentId=null): sees all trees
    if (params.data.executiveId) {
      conditions.push(eq(creditsTable.executiveId, params.data.executiveId));
    }
  }

  if (params.data.clientId) {
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

// ─── Apply for a credit (creates pending application) ────────────────────────
router.post("/credits/apply", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const { clientId, amount, termWeeks, purpose, executiveId: bodyExecId } = req.body;

  const amt = parseFloat(amount);
  const weeks = parseInt(termWeeks, 10);

  if (!clientId || isNaN(amt) || isNaN(weeks) || amt <= 0 || weeks <= 0) {
    res.status(400).json({ error: "clientId, amount y termWeeks son requeridos y deben ser válidos" });
    return;
  }

  // Business rules (owner specification):
  // - New clients: $500–$1,000 over 4 weeks, flat 30% interest
  // - Existing clients: $1,000–$30,000 over 4–48 weeks, 60% annual rate (pro rata)
  // The classification is done by the caller (which decides isNewClient).
  // Here we just accept the bounds and compute the schedule.
  const isNewClient = Boolean(req.body.isNewClient);

  if (isNewClient) {
    if (amt < 500 || amt > 1000) {
      res.status(400).json({ error: "Clientes nuevos: monto entre $500 y $1,000" });
      return;
    }
    if (weeks !== 4) {
      res.status(400).json({ error: "Clientes nuevos: plazo fijo de 4 semanas" });
      return;
    }
  } else {
    if (amt < 1000 || amt > 30000) {
      res.status(400).json({ error: "Monto entre $1,000 y $30,000" });
      return;
    }
    if (weeks < 4 || weeks > 48) {
      res.status(400).json({ error: "Plazo entre 4 y 48 semanas" });
      return;
    }
  }

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
    // Opening commission removed per owner request — no commission charged.
    openingFee: "0.00",
    totalToRepay: totalToRepay.toFixed(2),
    remainingBalance: totalToRepay.toFixed(2),
    status: "pending",
    notes: purpose ?? null,
  }).returning();

  res.status(201).json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});

// ─── Review (approve / reject) a pending application ─────────────────────────
router.patch("/credits/:id/review", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id inválido" }); return; }

  const { action, notes } = req.body;
  if (action !== "approve" && action !== "reject" && action !== "needs_info") {
    res.status(400).json({ error: "action debe ser 'approve', 'reject' o 'needs_info'" });
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

  // Notify client via email (best-effort: match client → user by fullName)
  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, credit.clientId));
    if (client) {
      const [user] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.fullName, client.fullName));
      const pushMsg =
        action === "approve" ? `Tu crédito por $${parseFloat(credit.amount).toLocaleString("es-MX")} fue aprobado 🎉`
        : action === "reject" ? "Tu solicitud de crédito fue rechazada."
        : "Necesitamos más información para tu solicitud de crédito.";
      sendPushToClientByName(client.fullName, { title: "credeti", body: pushMsg, url: "/mi-credito" }).catch(() => {});
      if (user?.email) {
        sendCreditDecisionEmail({
          to: user.email,
          clientName: client.fullName,
          action: action as "approve" | "reject" | "needs_info",
          amount: parseFloat(credit.amount),
          notes: notes ? String(notes) : undefined,
        }).catch(() => {});
      }
    }
  } catch {}

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

  res.json(formatCredit({ ...credit, clientName: null, executiveName: null }));
});


// ─── POST /api/me/apply — logged-in client applies for a credit ──────────────
// Creates (or reuses) the client record linked to this user and a pending
// credit, so the application shows up in the admin "solicitudes" queue and in
// the client's "mi crédito" page immediately.
router.post("/me/apply", requireAuth, requireRole("client"), async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

  const { personalInfo, businessInfo, references, guarantor, creditRequest, documents, source } = req.body ?? {};
  const fullName = (personalInfo?.fullName ?? user.fullName ?? "").trim();
  const phone = (personalInfo?.phone ?? user.phone ?? "").trim();
  if (!fullName || !phone) {
    res.status(400).json({ error: "Nombre y teléfono son requeridos" });
    return;
  }

  // Find or create the client record (match by name, then phone).
  let [client] = await db.select().from(clientsTable).where(eq(clientsTable.fullName, fullName));
  if (!client) [client] = await db.select().from(clientsTable).where(eq(clientsTable.phone, phone));
  if (!client) {
    [client] = await db.insert(clientsTable).values({
      fullName,
      phone,
      address: personalInfo?.address ?? null,
      curp: personalInfo?.curp ?? null,
      guarantorName: guarantor?.fullName ?? null,
      guarantorPhone: guarantor?.phone ?? null,
      status: "current",
    }).returning();
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
  if (isNewClient) {
    if (amt < 500 || amt > 1000) { res.status(400).json({ error: "Clientes nuevos: monto entre $500 y $1,000" }); return; }
    if (weeks !== 4) { res.status(400).json({ error: "Clientes nuevos: plazo fijo de 4 semanas" }); return; }
  } else {
    if (amt < 1000 || amt > 30000) { res.status(400).json({ error: "Monto entre $1,000 y $30,000" }); return; }
    if (weeks < 4 || weeks > 48) { res.status(400).json({ error: "Plazo entre 4 y 48 semanas" }); return; }
  }

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

  sendPushToAdmins({
    title: "Nueva solicitud de crédito",
    body: `${fullName} solicitó $${amt.toLocaleString("es-MX")} a ${weeks} semanas`,
    url: "/admin/solicitudes",
  }).catch(() => {});

  res.status(201).json({
    success: true,
    referenceNumber: `CT-${String(credit.id).padStart(5, "0")}`,
    credit: formatCredit({ ...credit, clientName: fullName, executiveName: null }),
  });
});

export default router;
