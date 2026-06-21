import { Router } from "express";
import { and, auditLogTable, clientsTable, commitmentsTable, creditsTable, db, eq, ilike, inArray, notesTable, paymentsTable, sql, usersTable } from "@workspace/db";
import { resolveClientId } from "../lib/clientResolver";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendClientReassignmentEmail, sendCustomClientEmail, EMAIL_PRECARGADOS } from "../lib/email";
import { sendPushToClient } from "../lib/push";
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
router.get("/me/client", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  // Robust link: FK -> normalized name -> phone, backfilling the FK on first match.
  const clientId = await resolveClientId(req.userId!);
  if (!clientId) { res.status(404).json({ error: "No client record linked to this user" }); return; }

  const [client] = await db
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
    .where(eq(clientsTable.id, clientId));

  if (!client) { res.status(404).json({ error: "No client record linked to this user" }); return; }

  res.json({ ...client, riskLevel: calcRiskLevel({ status: client.status } as typeof clientsTable.$inferSelect) });
});

// ─── PUT /api/me/profile ─── client creates/updates their own basic profile ───
// Works even before they file a credit application, so the perfil page always
// has somewhere to save name/phone/address/CURP.
router.put("/me/profile", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  const { fullName, phone, altPhone, address, curp } = req.body ?? {};

  // Try to find existing client record
  let clientId = await resolveClientId(req.userId!);

  if (clientId) {
    // Update existing
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (fullName !== undefined) updates.fullName = fullName;
    if (phone    !== undefined) updates.phone    = phone;
    if (altPhone !== undefined) updates.altPhone = altPhone;
    if (address  !== undefined) updates.address  = address;
    if (curp     !== undefined) updates.curp     = curp;

    await db.update(clientsTable).set(updates as any).where(eq(clientsTable.id, clientId));
  } else {
    // Create a minimal client record linked to this user
    const [user] = await db.select({ fullName: usersTable.fullName, phone: usersTable.phone })
      .from(usersTable).where(eq(usersTable.id, req.userId!));
    const [created] = await db.insert(clientsTable).values({
      fullName: fullName ?? user?.fullName ?? "Cliente",
      phone:    phone    ?? user?.phone ?? "",
      altPhone: altPhone ?? null,
      address:  address  ?? null,
      curp:     curp     ?? null,
      status:   "current",
      userId:   req.userId!,
    } as any).returning({ id: clientsTable.id });
    clientId = created.id;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
  res.json({ ok: true, client });
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

// ─── GET /api/me/timeline — trazabilidad cronologica del credito del cliente ───
router.get("/me/timeline", requireAuth, requireRole("client", "customer", "admin", "executive"), async (req, res): Promise<void> => {
  const clientId = await resolveClientId(req.userId!);
  if (!clientId) { res.json([]); return; }

  const [creditRows, paymentRows, commitmentRows] = await Promise.all([
    db.select().from(creditsTable).where(eq(creditsTable.clientId, clientId)).orderBy(creditsTable.createdAt),
    db.select().from(paymentsTable).where(eq(paymentsTable.clientId, clientId)).orderBy(paymentsTable.paymentDate),
    db.select().from(commitmentsTable).where(eq(commitmentsTable.clientId, clientId)).orderBy(commitmentsTable.createdAt),
  ]);

  type Ev = { id: string; type: string; title: string; detail?: string; amount?: number; date: string; tone: "positive" | "neutral" | "warning" };
  const events: Ev[] = [];

  for (const c of creditRows) {
    events.push({
      id: `credit-${c.id}`, type: "credit_disbursed", title: "Credito otorgado",
      detail: `Plazo ${c.termWeeks} semanas - pago semanal $${Number(c.weeklyPayment).toLocaleString("es-MX")}`,
      amount: Number(c.amount), date: String(c.disbursementDate ?? c.createdAt), tone: "positive",
    });
    if (c.status === "completed") {
      events.push({ id: `credit-done-${c.id}`, type: "credit_completed", title: "Credito liquidado", detail: "Felicidades, completaste tu credito.", date: String(c.updatedAt), tone: "positive" });
    } else if (c.status === "defaulted") {
      events.push({ id: `credit-def-${c.id}`, type: "credit_defaulted", title: "Credito en incumplimiento", detail: "Contacta a tu asesor para regularizarte.", date: String(c.updatedAt), tone: "warning" });
    }
  }
  for (const p of paymentRows) {
    const late = p.paymentStatus === "late" || p.paymentStatus === "missed" || p.paymentStatus === "partial";
    events.push({
      id: `pay-${p.id}`, type: "payment", title: `Pago semana ${p.paymentNumber}`,
      detail: `Saldo restante $${Number(p.updatedBalance).toLocaleString("es-MX")}${late ? " - con atraso" : ""}`,
      amount: Number(p.amountPaid), date: String(p.paymentDate), tone: late ? "warning" : "positive",
    });
  }
  for (const cm of commitmentRows) {
    events.push({
      id: `commit-${cm.id}`, type: "commitment", title: "Compromiso de pago",
      detail: `${cm.status === "fulfilled" ? "Cumplido" : cm.status === "broken" ? "No cumplido" : "Pendiente"} - prometido para ${String(cm.promisedDate)}`,
      amount: Number(cm.promisedAmount), date: String(cm.createdAt),
      tone: cm.status === "broken" ? "warning" : cm.status === "fulfilled" ? "positive" : "neutral",
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(events);
});

// ─── GET /api/email-templates — precargados disponibles para el admin ───
router.get("/email-templates", requireAuth, requireRole("admin", "executive"), async (_req, res): Promise<void> => {
  res.json(EMAIL_PRECARGADOS.map((t) => ({ key: t.key, label: t.label, subject: t.subject })));
});

// ─── POST /api/clients/:id/email — admin envia un correo precargado al cliente ───
router.post("/clients/:id/email", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.id), 10);
  if (isNaN(clientId)) { res.status(400).json({ error: "id invalido" }); return; }

  const body = (req.body ?? {}) as { templateKey?: string; subject?: string; contentHtml?: string; alsoInApp?: boolean };

  const [row] = await db
    .select({ fullName: clientsTable.fullName, email: usersTable.email })
    .from(clientsTable)
    .leftJoin(usersTable, eq(clientsTable.userId, usersTable.id))
    .where(eq(clientsTable.id, clientId));
  if (!row) { res.status(404).json({ error: "Cliente no encontrado" }); return; }
  if (!row.email) { res.status(400).json({ error: "El cliente no tiene un correo vinculado. Pidele que inicie sesion para enlazarlo." }); return; }

  let subject = body.subject;
  let contentHtml = body.contentHtml;
  if (body.templateKey) {
    const t = EMAIL_PRECARGADOS.find((x) => x.key === body.templateKey);
    if (!t) { res.status(400).json({ error: "Plantilla desconocida" }); return; }
    subject = t.subject;
    contentHtml = t.build(row.fullName.split(" ")[0] || row.fullName);
  }
  if (!subject || !contentHtml) { res.status(400).json({ error: "Falta templateKey o subject/contentHtml" }); return; }

  const result = await sendCustomClientEmail({ to: row.email, subject, contentHtml });

  if (body.alsoInApp) {
    const plain = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    await db.insert(notesTable).values({ clientId, authorId: req.userId!, noteType: "mensaje_cliente", content: plain });
    sendPushToClient(clientId, { title: "Mensaje de tu asesor", body: subject, url: "/mi-credito" }).catch(() => {});
  }

  await db.insert(auditLogTable).values({
    userId: req.userId!, action: "client.email.sent", resourceType: "client", resourceId: String(clientId),
    metadata: { templateKey: body.templateKey ?? "custom", subject, sent: result.sent },
  }).catch(() => {});

  res.json({ ok: true, sent: result.sent, to: row.email });
});

// ─── GET /clients/:id/expediente — detalle por clientId (funciona para clientes directos sin userId) ───
router.get("/clients/:id/expediente", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalido" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) { res.status(404).json({ error: "Cliente no encontrado" }); return; }

  // Usuario vinculado (puede no existir para clientes directos)
  const [user] = client.userId
    ? await db.select().from(usersTable).where(eq(usersTable.id, client.userId))
    : [undefined as any];

  const credits = await db.select().from(creditsTable).where(eq(creditsTable.clientId, client.id)).orderBy(creditsTable.createdAt);
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, client.id)).orderBy(paymentsTable.paymentDate).limit(10);

  const stats = {
    activeCredits: credits.filter(c => c.status === "active").length,
    totalBorrowed: credits.reduce((s, c) => s + parseFloat(c.amount ?? "0"), 0),
    remainingBalance: credits.filter(c => c.status === "active").reduce((s, c) => s + parseFloat(c.remainingBalance ?? "0"), 0),
    totalPaid: payments.filter((p: any) => p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected").reduce((s: number, p: any) => s + parseFloat(p.amountPaid ?? "0"), 0),
  };

  res.json({
    user: user ? {
      id: user.id, fullName: user.fullName, email: user.email, phone: user.phone,
      role: user.role, avatarUrl: null,
    } : {
      id: null, fullName: client.fullName, email: null, phone: client.phone,
      role: "client", avatarUrl: null,
    },
    client: {
      id: client.id, fullName: client.fullName, phone: client.phone,
      address: client.address, curp: client.curp, status: client.status,
      registeredAt: client.registeredAt,
    },
    credits: credits.map(c => ({
      id: c.id, clientId: c.clientId, amount: c.amount, status: c.status, termWeeks: c.termWeeks,
      weeklyPayment: c.weeklyPayment, remainingBalance: c.remainingBalance,
      disbursementDate: c.disbursementDate, currentPaymentNumber: c.currentPaymentNumber,
    })),
    payments: payments.map((p: any) => ({
      id: p.id, amountPaid: p.amountPaid, paymentDate: p.paymentDate, paymentStatus: p.paymentStatus,
    })),
    stats,
  });
});

// ─── DELETE /api/clients/:id — eliminar cliente y todo lo ligado (admin) ───
// Borra en orden de llaves foraneas: pagos, compromisos, notas, alertas, creditos, cliente.
router.delete("/clients/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const clientId = parseInt(req.params.id as string, 10);
  if (isNaN(clientId)) { res.status(400).json({ error: "ID invalido" }); return; }
  try {
    await db.execute(sql`DELETE FROM payments WHERE client_id = ${clientId} OR credit_id IN (SELECT id FROM credits WHERE client_id = ${clientId})`);
    await db.execute(sql`DELETE FROM commitments WHERE client_id = ${clientId}`);
    await db.execute(sql`DELETE FROM notes WHERE client_id = ${clientId}`);
    await db.execute(sql`DELETE FROM alerts WHERE client_id = ${clientId}`);
    await db.execute(sql`DELETE FROM credits WHERE client_id = ${clientId}`);
    const del: any = await db.execute(sql`DELETE FROM clients WHERE id = ${clientId} RETURNING id, full_name`);
    const rows = del?.rows ?? del ?? [];
    if (!rows.length) { res.status(404).json({ error: "Cliente no encontrado" }); return; }
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("[delete-client]", err);
    res.status(503).json({ error: "No se pudo eliminar el cliente" });
  }
});

export default router;
