import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, alertsTable, clientsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListAlertsQueryParams,
  ResolveAlertParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (req, res): Promise<void> => {
  const params = ListAlertsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (req.userRole === "executive") {
    conditions.push(eq(alertsTable.executiveId, req.userId!));
  } else if (params.data.executiveId) {
    conditions.push(eq(alertsTable.executiveId, params.data.executiveId));
  }

  if (params.data.resolved === "true") {
    conditions.push(eq(alertsTable.isResolved, true));
  } else if (params.data.resolved === "false") {
    conditions.push(eq(alertsTable.isResolved, false));
  }

  const rows = await db
    .select({
      id: alertsTable.id,
      alertType: alertsTable.alertType,
      severity: alertsTable.severity,
      message: alertsTable.message,
      clientId: alertsTable.clientId,
      clientName: clientsTable.fullName,
      executiveId: alertsTable.executiveId,
      isResolved: alertsTable.isResolved,
      createdAt: alertsTable.createdAt,
    })
    .from(alertsTable)
    .leftJoin(clientsTable, eq(alertsTable.clientId, clientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alertsTable.createdAt);

  res.json(rows);
});

router.patch("/alerts/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ isResolved: true })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json({ ...alert, clientName: null });
});

export default router;
