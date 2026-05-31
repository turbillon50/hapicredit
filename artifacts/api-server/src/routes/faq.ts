import { Router, type IRouter } from "express";
import { asc, db, eq, faqTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

// ─── Public: list active FAQ items ───────────────────────────────────────────
router.get("/faq", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(faqTable)
    .where(eq(faqTable.isActive, true))
    .orderBy(asc(faqTable.sortOrder), asc(faqTable.createdAt));
  res.json(items);
});

// ─── Admin: list all FAQ items (including inactive) ──────────────────────────
router.get("/faq/all", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(faqTable)
    .orderBy(asc(faqTable.sortOrder), asc(faqTable.createdAt));
  res.json(items);
});

// ─── Admin: create FAQ item ───────────────────────────────────────────────────
router.post("/faq", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { question, answer, category, sortOrder } = req.body;
  if (!question?.trim() || !answer?.trim()) {
    res.status(400).json({ error: "Pregunta y respuesta son requeridas" });
    return;
  }
  const [item] = await db
    .insert(faqTable)
    .values({
      question: question.trim(),
      answer: answer.trim(),
      category: (category ?? "general").trim(),
      sortOrder: sortOrder ?? 0,
      isActive: true,
    })
    .returning();
  res.status(201).json(item);
});

// ─── Admin: update FAQ item ───────────────────────────────────────────────────
router.patch("/faq/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { question, answer, category, sortOrder, isActive } = req.body;
  const updates: Partial<typeof faqTable.$inferInsert> = { updatedAt: new Date() };
  if (question !== undefined) updates.question = question.trim();
  if (answer !== undefined)   updates.answer   = answer.trim();
  if (category !== undefined) updates.category = category.trim();
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (isActive !== undefined) updates.isActive = isActive;

  const [updated] = await db
    .update(faqTable)
    .set(updates)
    .where(eq(faqTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Pregunta no encontrada" }); return; }
  res.json(updated);
});

// ─── Admin: delete FAQ item ───────────────────────────────────────────────────
router.delete("/faq/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.delete(faqTable).where(eq(faqTable.id, id));
  res.json({ ok: true });
});

export default router;
