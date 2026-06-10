import { Router } from "express";
import { db, eq, desc, supportTicketsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendPushToAdmins } from "../lib/push";

const router = Router();

// Cliente/asesor crea un ticket de soporte (boton Reportar in-app)
router.post("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const { subject, message, category } = req.body ?? {};
  if (!subject || !message || typeof subject !== "string" || typeof message !== "string" || !subject.trim() || !message.trim()) {
    res.status(400).json({ error: "Asunto y mensaje son obligatorios" });
    return;
  }
  let userName: string | null = null;
  try {
    const [u] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, req.userId!));
    userName = u?.fullName ?? null;
  } catch {}

  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: req.userId ?? null,
    userName,
    role: req.userRole ?? null,
    category: typeof category === "string" && category.trim() ? category.trim() : "general",
    subject: subject.trim().slice(0, 200),
    message: message.trim().slice(0, 4000),
    status: "open",
  }).returning();

  await sendPushToAdmins({
    title: "\uD83C\uDFAB Nuevo ticket de soporte",
    body: `${userName ?? "Usuario"}: ${subject.trim().slice(0, 80)}`,
    url: "/admin/soporte",
  }).catch((e: any) => console.error("[notify:support]", e?.message || e));

  res.status(201).json(ticket);
});

// Admin lista todos los tickets (centro de control en vivo)
router.get("/support/tickets", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt));
  res.json(rows);
});

// Cliente ve sus propios tickets
router.get("/support/my-tickets", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.userId, req.userId!)).orderBy(desc(supportTicketsTable.createdAt));
  res.json(rows);
});

// Admin actualiza estado / responde
router.patch("/support/tickets/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "id invalido" }); return; }
  const { status, adminResponse } = req.body ?? {};
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status && ["open", "in_progress", "resolved"].includes(status)) updates.status = status;
  if (typeof adminResponse === "string") updates.adminResponse = adminResponse.slice(0, 4000);
  const [ticket] = await db.update(supportTicketsTable).set(updates as any).where(eq(supportTicketsTable.id, id)).returning();
  if (!ticket) { res.status(404).json({ error: "Ticket no encontrado" }); return; }
  res.json(ticket);
});

export default router;
