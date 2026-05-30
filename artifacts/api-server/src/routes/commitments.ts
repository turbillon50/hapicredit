import { Router, type IRouter } from "express";
import { eq, and, getTableColumns } from "drizzle-orm";
import { db, commitmentsTable, clientsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateCommitmentBody,
  UpdateCommitmentBody,
  UpdateCommitmentParams,
  ListCommitmentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatCommitment(c: typeof commitmentsTable.$inferSelect & { clientName?: string | null; executiveName?: string | null }) {
  return {
    ...c,
    promisedAmount: parseFloat(c.promisedAmount),
    clientName: c.clientName ?? null,
    executiveName: c.executiveName ?? null,
  };
}

router.get("/commitments", requireAuth, async (req, res): Promise<void> => {
  const params = ListCommitmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (req.userRole === "executive") {
    conditions.push(eq(commitmentsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(commitmentsTable.executiveId, params.data.executiveId));
  }

  if (params.data.clientId) {
    conditions.push(eq(commitmentsTable.clientId, params.data.clientId));
  }

  if (params.data.status) {
    conditions.push(eq(commitmentsTable.status, params.data.status));
  }

  const rows = await db
    .select({
      ...getTableColumns(commitmentsTable),
      clientName: clientsTable.fullName,
      executiveName: usersTable.fullName,
    })
    .from(commitmentsTable)
    .leftJoin(clientsTable, eq(commitmentsTable.clientId, clientsTable.id))
    .leftJoin(usersTable, eq(commitmentsTable.executiveId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(commitmentsTable.promisedDate);

  res.json(rows.map(formatCommitment));
});

router.post("/commitments", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const parsed = CreateCommitmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const executiveId = req.userRole === "executive" ? req.userId : (parsed.data.executiveId ?? null);

  const [commitment] = await db.insert(commitmentsTable).values({
    ...parsed.data,
    executiveId,
    promisedAmount: parsed.data.promisedAmount.toString(),
  }).returning();

  res.status(201).json(formatCommitment({ ...commitment, clientName: null, executiveName: null }));
});

router.patch("/commitments/:id", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  const params = UpdateCommitmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCommitmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }

  const [commitment] = await db
    .update(commitmentsTable)
    .set(updates as Partial<typeof commitmentsTable.$inferInsert>)
    .where(eq(commitmentsTable.id, params.data.id))
    .returning();

  if (!commitment) {
    res.status(404).json({ error: "Commitment not found" });
    return;
  }

  res.json(formatCommitment({ ...commitment, clientName: null, executiveName: null }));
});

export default router;
