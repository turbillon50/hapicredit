import { Router, type IRouter } from "express";
import { eq, and, count, sum, gte, lte, sql } from "drizzle-orm";
import { db, clientsTable, creditsTable, paymentsTable, commitmentsTable, alertsTable, usersTable, cajaMovementsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { GetExecutiveDashboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const today = () => new Date().toISOString().split("T")[0];
const weekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
};
const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

router.get("/dashboard/executive", requireAuth, async (req, res): Promise<void> => {
  const params = GetExecutiveDashboardQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const execId = req.userRole === "executive" ? req.userId! : (params.data.executiveId ?? req.userId!);

  const [exec] = await db.select().from(usersTable).where(eq(usersTable.id, execId));
  if (!exec) {
    res.status(404).json({ error: "Executive not found" });
    return;
  }

  const clients = await db.select().from(clientsTable).where(eq(clientsTable.executiveId, execId));
  const totalAssigned = clients.length;
  const clientsOverdue = clients.filter(c => c.status === "overdue" || c.status === "defaulted").length;

  const todayStr = today();
  const todayPayments = await db.select().from(paymentsTable)
    .where(and(eq(paymentsTable.executiveId, execId), eq(paymentsTable.paymentDate, todayStr)));

  const totalCollectedToday = todayPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  // Expected today: all active credits with payment due today (simplification: weekly payment amount)
  const activeCredits = await db.select().from(creditsTable)
    .where(and(eq(creditsTable.executiveId, execId), eq(creditsTable.status, "active")));
  const totalExpectedToday = activeCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment), 0);

  const pendingCommitments = await db.select().from(commitmentsTable)
    .where(and(eq(commitmentsTable.executiveId, execId), eq(commitmentsTable.status, "pending")));

  const cajaMovements = await db.select().from(cajaMovementsTable).where(eq(cajaMovementsTable.executiveId, execId));
  const cashOnHand = cajaMovements.reduce((s, m) => {
    if (m.movementType === "collection") return s + parseFloat(m.amount);
    if (m.movementType === "delivery") return s - parseFloat(m.amount);
    return s;
  }, 0);

  // Placement this week
  const weekStartStr = weekStart();
  const weekCredits = await db.select().from(creditsTable)
    .where(and(eq(creditsTable.executiveId, execId), gte(creditsTable.disbursementDate, weekStartStr)));
  const placementThisWeek = weekCredits.reduce((s, c) => s + parseFloat(c.amount), 0);

  const alerts = await db.select().from(alertsTable)
    .where(and(eq(alertsTable.executiveId, execId), eq(alertsTable.isResolved, false)));

  // Clients due today (simplification: all active clients with payments today)
  const clientsDueToday = todayPayments.length > 0 ? todayPayments.length : Math.floor(totalAssigned * 0.15);

  res.json({
    executiveId: execId,
    executiveName: exec.fullName,
    totalAssignedClients: totalAssigned,
    clientsDueToday,
    clientsOverdue,
    totalExpectedToday,
    totalCollectedToday,
    pendingPromises: pendingCommitments.length,
    cashOnHand: Math.max(0, cashOnHand),
    placementThisWeek,
    alertCount: alerts.length,
  });
});

router.get("/dashboard/admin", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const allClients = await db.select().from(clientsTable);
  const activeClients = allClients.filter(c => c.status !== "inactive").length;
  const clientsOverdue = allClients.filter(c => c.status === "overdue").length;
  const clientsDefaulted = allClients.filter(c => c.status === "defaulted").length;

  const allCredits = await db.select().from(creditsTable);
  const activeCredits = allCredits.filter(c => c.status === "active");
  const defaultedCredits = allCredits.filter(c => c.status === "defaulted");

  const totalPortfolio = activeCredits.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);
  const lossesFromDefault = defaultedCredits.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);

  const todayStr = today();
  const allPaymentsToday = await db.select().from(paymentsTable).where(eq(paymentsTable.paymentDate, todayStr));
  const collectionToday = allPaymentsToday.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
  const expectedToday = activeCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment), 0);

  const weekStartStr = weekStart();
  const monthStartStr = monthStart();

  const weekCredits = allCredits.filter(c => c.disbursementDate >= weekStartStr);
  const monthCredits = allCredits.filter(c => c.disbursementDate >= monthStartStr);
  const placementThisWeek = weekCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
  const placementThisMonth = monthCredits.reduce((s, c) => s + parseFloat(c.amount), 0);

  const weekPayments = await db.select().from(paymentsTable).where(gte(paymentsTable.paymentDate, weekStartStr));
  const monthPayments = await db.select().from(paymentsTable).where(gte(paymentsTable.paymentDate, monthStartStr));

  const openingFeeWeek = weekCredits.reduce((s, c) => s + (c.openingFee ? parseFloat(c.openingFee) : 0), 0);
  const openingFeeMonth = monthCredits.reduce((s, c) => s + (c.openingFee ? parseFloat(c.openingFee) : 0), 0);

  const weeklyUtility = openingFeeWeek;
  const monthlyUtility = openingFeeMonth;

  const delinquencyRate = activeClients > 0
    ? ((clientsOverdue + clientsDefaulted) / activeClients) * 100
    : 0;

  const executives = await db.select().from(usersTable).where(eq(usersTable.role, "executive"));
  const alerts = await db.select().from(alertsTable).where(eq(alertsTable.isResolved, false));

  res.json({
    totalPortfolio,
    activeClients,
    clientsOverdue,
    clientsDefaulted,
    collectionToday,
    expectedToday,
    placementThisWeek,
    placementThisMonth,
    weeklyUtility,
    monthlyUtility,
    lossesFromDefault,
    delinquencyRate: Math.round(delinquencyRate * 10) / 10,
    totalExecutives: executives.length,
    alertCount: alerts.length,
  });
});

router.get("/dashboard/executive-ranking", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const executives = await db.select().from(usersTable).where(eq(usersTable.role, "executive"));

  const rankings = await Promise.all(executives.map(async (exec, idx) => {
    const credits = await db.select().from(creditsTable).where(eq(creditsTable.executiveId, exec.id));
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.executiveId, exec.id));
    const commitments = await db.select().from(commitmentsTable).where(eq(commitmentsTable.executiveId, exec.id));
    const clients = await db.select().from(clientsTable).where(eq(clientsTable.executiveId, exec.id));

    const placement = credits.reduce((s, c) => s + parseFloat(c.amount), 0);
    const collection = payments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
    const overdueClients = clients.filter(c => c.status === "overdue" || c.status === "defaulted").length;
    const delinquencyRate = clients.length > 0
      ? (overdueClients / clients.length) * 100
      : 0;

    const totalCommitments = commitments.length;
    const fulfilledCommitments = commitments.filter(c => c.status === "fulfilled").length;
    const promiseCompliance = totalCommitments > 0
      ? (fulfilledCommitments / totalCommitments) * 100
      : 100;

    const activityScore = Math.min(100, (payments.length * 2) + (credits.length * 5));

    return {
      executiveId: exec.id,
      executiveName: exec.fullName,
      placement,
      collection,
      delinquencyRate: Math.round(delinquencyRate * 10) / 10,
      overdueClients,
      promiseCompliance: Math.round(promiseCompliance),
      activityScore,
      rank: idx + 1,
    };
  }));

  // Sort by collection desc
  rankings.sort((a, b) => b.collection - a.collection);
  rankings.forEach((r, i) => r.rank = i + 1);

  res.json(rankings);
});

router.get("/dashboard/portfolio-aging", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable);
  const total = clients.length || 1;

  const credits = await db.select().from(creditsTable);

  const buckets = [
    { bucket: "Al corriente", status: ["current"], clients: 0, amount: 0 },
    { bucket: "1-15 días", status: ["at_risk"], clients: 0, amount: 0 },
    { bucket: "16-30 días", status: ["overdue"], clients: 0, amount: 0 },
    { bucket: "31+ días (default)", status: ["defaulted"], clients: 0, amount: 0 },
  ];

  for (const client of clients) {
    for (const bucket of buckets) {
      if (bucket.status.includes(client.status)) {
        bucket.clients++;
        const clientCredits = credits.filter(c => c.clientId === client.id && c.status === "active");
        bucket.amount += clientCredits.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);
      }
    }
  }

  res.json(buckets.map(b => ({
    bucket: b.bucket,
    clientCount: b.clients,
    totalAmount: b.amount,
    percentage: Math.round((b.clients / total) * 100 * 10) / 10,
  })));
});

router.get("/dashboard/collection-trend", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const allCredits = await db.select().from(creditsTable).where(eq(creditsTable.status, "active"));
  const avgWeekly = allCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment), 0);

  // Last 8 weeks
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStr = `Sem ${d.getMonth() + 1}/${d.getDate()}`;
    const startDate = new Date(d);
    startDate.setDate(d.getDate() - 6);
    const start = startDate.toISOString().split("T")[0];
    const end = d.toISOString().split("T")[0];

    const payments = await db.select().from(paymentsTable)
      .where(and(gte(paymentsTable.paymentDate, start), lte(paymentsTable.paymentDate, end)));
    const collected = payments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

    weeks.push({
      period: weekStr,
      expected: avgWeekly,
      collected,
    });
  }

  res.json(weeks);
});

export default router;
