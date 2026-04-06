import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";
import { db, cajaMovementsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateCajaMovementBody,
  ListCajaMovementsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatMovement(m: typeof cajaMovementsTable.$inferSelect & { executiveName?: string | null }) {
  return {
    ...m,
    amount: parseFloat(m.amount),
    executiveName: m.executiveName ?? null,
  };
}

router.get("/caja", requireAuth, async (req, res): Promise<void> => {
  const params = ListCajaMovementsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (req.userRole === "executive") {
    conditions.push(eq(cajaMovementsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(cajaMovementsTable.executiveId, params.data.executiveId));
  }

  if (params.data.dateFrom) {
    conditions.push(gte(sql`${cajaMovementsTable.createdAt}::date`, params.data.dateFrom));
  }

  if (params.data.dateTo) {
    conditions.push(lte(sql`${cajaMovementsTable.createdAt}::date`, params.data.dateTo));
  }

  const rows = await db
    .select({
      ...cajaMovementsTable,
      executiveName: usersTable.fullName,
    })
    .from(cajaMovementsTable)
    .leftJoin(usersTable, eq(cajaMovementsTable.executiveId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(cajaMovementsTable.createdAt);

  res.json(rows.map(formatMovement));
});

router.post("/caja", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreateCajaMovementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const executiveId = req.userRole === "executive" ? req.userId! : parsed.data.executiveId;

  const validTypes = ["collection", "delivery", "adjustment", "payroll", "expense", "capital"];
  if (!validTypes.includes(parsed.data.movementType)) {
    res.status(400).json({ error: `Invalid movement type. Valid: ${validTypes.join(", ")}` });
    return;
  }

  const [movement] = await db.insert(cajaMovementsTable).values({
    ...parsed.data,
    executiveId,
    amount: parsed.data.amount.toString(),
  }).returning();

  res.status(201).json(formatMovement({ ...movement, executiveName: null }));
});

router.get("/caja/summary", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const executives = req.userRole === "executive"
    ? await db.select().from(usersTable).where(eq(usersTable.id, req.userId!))
    : await db.select().from(usersTable).where(eq(usersTable.role, "executive"));

  const summaries = await Promise.all(executives.map(async (exec) => {
    const movements = await db
      .select()
      .from(cajaMovementsTable)
      .where(eq(cajaMovementsTable.executiveId, exec.id));

    const todayMovements = movements.filter(m => m.createdAt.toISOString().split("T")[0] === today);
    const collectedToday = todayMovements
      .filter(m => m.movementType === "collection")
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const cashOnHand = movements.reduce((sum, m) => {
      const amt = parseFloat(m.amount);
      if (m.movementType === "collection") return sum + amt;
      if (m.movementType === "delivery") return sum - amt;
      if (m.movementType === "payroll") return sum - amt;
      if (m.movementType === "expense") return sum - amt;
      if (m.movementType === "capital") return sum - amt;
      return sum;
    }, 0);

    const lastMovement = movements.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      executiveId: exec.id,
      executiveName: exec.fullName,
      collectedToday,
      pendingToReconcile: collectedToday,
      cashOnHand: Math.max(0, cashOnHand),
      lastMovementAt: lastMovement?.createdAt?.toISOString() ?? null,
    };
  }));

  res.json(summaries);
});

export default router;
