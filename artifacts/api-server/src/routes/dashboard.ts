import { Router } from "express";
import { alertsTable, and, cajaMovementsTable, clientsTable, commitmentsTable, count, creditsTable, db, eq, gte, lte, paymentsTable, sql, sum, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { GetExecutiveDashboardQueryParams } from "@workspace/api-zod";

const router = Router();

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
    const amt = parseFloat(m.amount);
    if (m.movementType === "collection") return s + amt;
    if (m.movementType === "delivery") return s - amt;
    if (m.movementType === "payroll") return s - amt;
    if (m.movementType === "expense") return s - amt;
    if (m.movementType === "capital") return s - amt;
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

  const COMMISSION_RATE = 0.05;
  const allCredits     = await db.select().from(creditsTable).where(eq(creditsTable.executiveId, execId));
  const monthStartStr  = monthStart();
  const monthCredits   = allCredits.filter(c => c.disbursementDate >= monthStartStr);
  const prevMonthStart = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  })();
  const prevMonthCredits = allCredits.filter(c => c.disbursementDate >= prevMonthStart && c.disbursementDate < monthStartStr);

  const placementAllTime   = allCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
  const placementThisMonth = monthCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
  const placementPrevMonth = prevMonthCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
  const commissionAllTime   = Math.round(placementAllTime   * COMMISSION_RATE);
  const commissionThisMonth = Math.round(placementThisMonth * COMMISSION_RATE);
  const commissionPrevMonth = Math.round(placementPrevMonth * COMMISSION_RATE);

  const allPayments   = await db.select().from(paymentsTable).where(eq(paymentsTable.executiveId, execId));
  const monthPayments = allPayments.filter(p => p.paymentDate >= monthStartStr);
  const collectionAllTime   = allPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
  const collectionThisMonth = monthPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  const targetMonth = activeCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment) * 4, 0);

  const creditBreakdown = monthCredits.map(c => ({
    creditId: c.id,
    clientId: c.clientId,
    amount:   parseFloat(c.amount),
    commission: Math.round(parseFloat(c.amount) * COMMISSION_RATE),
    disbursementDate: c.disbursementDate,
    status: c.status,
  }));

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
    placementThisMonth,
    alertCount: alerts.length,
    commissionAllTime,
    commissionThisMonth,
    commissionPrevMonth,
    collectionAllTime,
    collectionThisMonth,
    targetMonth,
    creditBreakdown,
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
  const collectionToday = allPaymentsToday
    .filter(p => p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected")
    .reduce((s, p) => s + parseFloat(p.amountPaid), 0);
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

  const allPayments = await db.select().from(paymentsTable);
  const pendingValidation = allPayments.filter(p => p.paymentStatus === "pending_validation").length;
  const validatedPayments = allPayments.filter(p => p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected");
  const collectionWeek = allPayments
    .filter(p => p.paymentDate >= weekStartStr && p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected")
    .reduce((s, p) => s + parseFloat(p.amountPaid), 0);
  const collectionMonth = allPayments
    .filter(p => p.paymentDate >= monthStartStr && p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected")
    .reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  const totalLateFees = allPayments.reduce((s, p) => s + (p.lateFee ? parseFloat(p.lateFee) : 0), 0);

  const disbursementsWeek = weekCredits.reduce((s, c) => {
    const fee = c.openingFee ? parseFloat(c.openingFee) : 0;
    return s + parseFloat(c.amount) - fee;
  }, 0);
  const disbursementsMonth = monthCredits.reduce((s, c) => {
    const fee = c.openingFee ? parseFloat(c.openingFee) : 0;
    return s + parseFloat(c.amount) - fee;
  }, 0);

  const netFlowWeek = collectionWeek - disbursementsWeek;
  const netFlowMonth = collectionMonth - disbursementsMonth;

  const pendingApprovals = allCredits.filter(c => c.status === "pending").length;

  const clientsCurrent = allClients.filter(c => c.status === "current").length;
  const clientsAtRisk = allClients.filter(c => c.status === "at_risk").length;

  const profitWeek = openingFeeWeek + collectionWeek - disbursementsWeek;
  const profitMonth = openingFeeMonth + collectionMonth - disbursementsMonth;

  res.json({
    totalPortfolio,
    activeClients,
    clientsCurrent,
    clientsAtRisk,
    clientsOverdue,
    clientsDefaulted,
    collectionToday,
    expectedToday,
    collectionWeek,
    collectionMonth,
    placementThisWeek,
    placementThisMonth,
    weeklyUtility: profitWeek,
    monthlyUtility: profitMonth,
    lossesFromDefault,
    delinquencyRate: Math.round(delinquencyRate * 10) / 10,
    totalExecutives: executives.length,
    alertCount: alerts.length,
    pendingValidation,
    pendingApprovals,
    totalLateFees,
    disbursementsWeek,
    disbursementsMonth,
    netFlowWeek,
    netFlowMonth,
    profitThisWeek: profitWeek,
    profitThisMonth: profitMonth,
    totalActiveExecutives: executives.length,
    executivesWithAlerts: executives.filter(e => alerts.some(a => a.executiveId === e.id)).length,
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

  const COMMISSION_RATE = 0.05;
  const monthStartStr = monthStart();
  const weekStartStr  = weekStart();

  const enriched = await Promise.all(rankings.map(async r => {
    const allCredits = await db.select().from(creditsTable).where(eq(creditsTable.executiveId, r.executiveId));
    const activeCredits = allCredits.filter(c => c.status === "active" || c.status === "pending");
    const monthCredits  = allCredits.filter(c => c.disbursementDate >= monthStartStr);
    const weekCredits   = allCredits.filter(c => c.disbursementDate >= weekStartStr);

    const allPayments   = await db.select().from(paymentsTable).where(eq(paymentsTable.executiveId, r.executiveId));
    const monthPayments = allPayments.filter(p => p.paymentDate >= monthStartStr);
    const weekPayments  = allPayments.filter(p => p.paymentDate >= weekStartStr);
    const allClients    = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.executiveId, r.executiveId));

    const placementAll   = allCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
    const placementMonth = monthCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
    const placementWeek  = weekCredits.reduce((s, c) => s + parseFloat(c.amount), 0);

    const collectedAll   = allPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
    const collectedMonth = monthPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
    const collectedWeek  = weekPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

    const targetMonth = activeCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment) * 4, 0);
    const targetWeek  = activeCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment), 0);

    return {
      ...r,
      collection: collectedAll,
      totalClients:       allClients.length,
      activeCredits:      activeCredits.length,
      placementThisWeek:  placementWeek,
      placementThisMonth: placementMonth,
      collectedThisWeek:  collectedWeek,
      collectedThisMonth: collectedMonth,
      targetWeek,
      targetMonth,
      commissionAllTime:   Math.round(placementAll   * COMMISSION_RATE),
      commissionThisMonth: Math.round(placementMonth * COMMISSION_RATE),
      commissionThisWeek:  Math.round(placementWeek  * COMMISSION_RATE),
      commissionEarned:    Math.round(placementMonth * COMMISSION_RATE),
    };
  }));

  enriched.sort((a, b) => b.collectedThisMonth - a.collectedThisMonth);
  enriched.forEach((r, i) => r.rank = i + 1);

  res.json(enriched);
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

// ─── NEW: Portfolio Detail ────────────────────────────────────────────────────
router.get("/dashboard/admin/portfolio-detail", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable);
  const credits = await db.select().from(creditsTable);
  const executives = await db.select().from(usersTable).where(eq(usersTable.role, "executive"));
  const payments = await db.select().from(paymentsTable);

  const execMap = new Map(executives.map(e => [e.id, e.fullName]));

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const rows = clients.map(client => {
    const activeCredit = credits.find(c => c.clientId === client.id && c.status === "active");
    const allClientPayments = payments.filter(p => p.clientId === client.id);
    const totalPaid = allClientPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
    const latePayments = allClientPayments.filter(p => p.paymentStatus === "late" || p.paymentStatus === "missed").length;

    let nextPaymentDate: string | null = null;
    let daysOverdue = 0;
    let interestRate = 0;
    let totalInterest = 0;
    let weeklyInterest = 0;
    let remainingBalance = 0;
    let weeklyPayment = 0;
    let creditAmount = 0;
    let termWeeks = 0;
    let currentPaymentNum = 0;
    let openingFee = 0;
    let disbursementDate: string | null = null;
    let expectedTotal = 0;

    if (activeCredit) {
      remainingBalance = parseFloat(activeCredit.remainingBalance);
      weeklyPayment = parseFloat(activeCredit.weeklyPayment);
      creditAmount = parseFloat(activeCredit.amount);
      termWeeks = activeCredit.termWeeks;
      currentPaymentNum = activeCredit.currentPaymentNumber;
      openingFee = activeCredit.openingFee ? parseFloat(activeCredit.openingFee) : 0;
      expectedTotal = parseFloat(activeCredit.totalToRepay);
      disbursementDate = activeCredit.disbursementDate;

      // Next payment due = disbursement + (currentPaymentNumber + 1) * 7 days
      const disbDate = new Date(activeCredit.disbursementDate);
      disbDate.setDate(disbDate.getDate() + (currentPaymentNum + 1) * 7);
      nextPaymentDate = disbDate.toISOString().split("T")[0];

      // Days overdue
      if (disbDate < todayDate) {
        const msPerDay = 24 * 60 * 60 * 1000;
        daysOverdue = Math.floor((todayDate.getTime() - disbDate.getTime()) / msPerDay);
      }

      // Interest calculations
      totalInterest = expectedTotal - creditAmount - openingFee;
      interestRate = creditAmount > 0 ? Math.round((totalInterest / creditAmount) * 1000) / 10 : 0;
      weeklyInterest = termWeeks > 0 ? totalInterest / termWeeks : 0;
    }

    // Late fee accumulated
    const totalLateFees = allClientPayments.reduce((s, p) => s + (p.lateFee ? parseFloat(p.lateFee) : 0), 0);

    return {
      clientId: client.id,
      clientName: client.fullName,
      clientStatus: client.status,
      clientPhone: client.phone,
      executiveName: execMap.get(client.executiveId ?? 0) ?? "Sin asignar",
      executiveId: client.executiveId,
      creditAmount,
      remainingBalance,
      weeklyPayment,
      termWeeks,
      currentPaymentNum,
      paymentsLeft: Math.max(0, termWeeks - currentPaymentNum),
      openingFee,
      expectedTotal,
      totalInterest: Math.round(totalInterest * 100) / 100,
      weeklyInterest: Math.round(weeklyInterest * 100) / 100,
      interestRate,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalLateFees,
      latePayments,
      nextPaymentDate,
      daysOverdue,
      disbursementDate,
      hasActiveCredit: !!activeCredit,
    };
  });

  res.json(rows);
});

// ─── NEW: Financial Summary ───────────────────────────────────────────────────
router.get("/dashboard/admin/financial-summary", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const allCredits = await db.select().from(creditsTable);
  const allPayments = await db.select().from(paymentsTable);
  const executives = await db.select().from(usersTable).where(eq(usersTable.role, "executive"));

  const activeCredits = allCredits.filter(c => c.status === "active");
  const completedCredits = allCredits.filter(c => c.status === "completed");
  const defaultedCredits = allCredits.filter(c => c.status === "defaulted");

  // Interest calculations
  const calcInterest = (c: typeof allCredits[0]) =>
    parseFloat(c.totalToRepay) - parseFloat(c.amount) - (c.openingFee ? parseFloat(c.openingFee) : 0);

  const totalInterestExpected = activeCredits.reduce((s, c) => s + Math.max(0, calcInterest(c)), 0);
  const totalInterestFromCompleted = completedCredits.reduce((s, c) => s + Math.max(0, calcInterest(c)), 0);
  const totalOpeningFees = allCredits.reduce((s, c) => s + (c.openingFee ? parseFloat(c.openingFee) : 0), 0);
  const totalLateFees = allPayments.reduce((s, p) => s + (p.lateFee ? parseFloat(p.lateFee) : 0), 0);

  const totalPrincipalPlaced = allCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
  const totalRecovered = allPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
  const totalLostToDefault = defaultedCredits.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);

  // Average interest rate
  const ratesArr = activeCredits.map(c => {
    const interest = calcInterest(c);
    const principal = parseFloat(c.amount);
    return principal > 0 ? (interest / principal) * 100 : 0;
  });
  const avgInterestRate = ratesArr.length > 0
    ? Math.round((ratesArr.reduce((s, r) => s + r, 0) / ratesArr.length) * 10) / 10
    : 0;

  // Weekly & monthly projections
  const weeklyInterestIncome = activeCredits.reduce((s, c) => {
    const interest = Math.max(0, calcInterest(c));
    return s + (c.termWeeks > 0 ? interest / c.termWeeks : 0);
  }, 0);
  const monthlyInterestIncome = weeklyInterestIncome * 4.33;
  const annualProjection = weeklyInterestIncome * 52;

  // Per executive breakdown
  const execBreakdown = await Promise.all(executives.map(async exec => {
    const execCredits = allCredits.filter(c => c.executiveId === exec.id);
    const execPayments = allPayments.filter(p => p.executiveId === exec.id);
    const execActive = execCredits.filter(c => c.status === "active");
    const execClients = await db.select().from(clientsTable).where(eq(clientsTable.executiveId, exec.id));

    const portfolio = execActive.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);
    const placed = execCredits.reduce((s, c) => s + parseFloat(c.amount), 0);
    const collected = execPayments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
    const interestGenerated = execCredits.reduce((s, c) => s + Math.max(0, calcInterest(c)), 0);
    const weeklyIncome = execActive.reduce((s, c) => {
      const int = Math.max(0, calcInterest(c));
      return s + (c.termWeeks > 0 ? int / c.termWeeks : 0);
    }, 0);
    const overdueClients = execClients.filter(c => c.status === "overdue" || c.status === "defaulted").length;
    const collectionRate = placed > 0 ? Math.round((collected / placed) * 100 * 10) / 10 : 0;

    return {
      executiveId: exec.id,
      executiveName: exec.fullName,
      totalClients: execClients.length,
      overdueClients,
      portfolio: Math.round(portfolio * 100) / 100,
      placed: Math.round(placed * 100) / 100,
      collected: Math.round(collected * 100) / 100,
      interestGenerated: Math.round(interestGenerated * 100) / 100,
      weeklyIncome: Math.round(weeklyIncome * 100) / 100,
      collectionRate,
    };
  }));

  res.json({
    totalPrincipalPlaced: Math.round(totalPrincipalPlaced * 100) / 100,
    totalRecovered: Math.round(totalRecovered * 100) / 100,
    totalLostToDefault: Math.round(totalLostToDefault * 100) / 100,
    totalInterestExpected: Math.round(totalInterestExpected * 100) / 100,
    totalInterestFromCompleted: Math.round(totalInterestFromCompleted * 100) / 100,
    totalOpeningFees: Math.round(totalOpeningFees * 100) / 100,
    totalLateFees: Math.round(totalLateFees * 100) / 100,
    avgInterestRate,
    weeklyInterestIncome: Math.round(weeklyInterestIncome * 100) / 100,
    monthlyInterestIncome: Math.round(monthlyInterestIncome * 100) / 100,
    annualProjection: Math.round(annualProjection * 100) / 100,
    activeCredits: activeCredits.length,
    completedCredits: completedCredits.length,
    defaultedCredits: defaultedCredits.length,
    execBreakdown,
  });
});

router.get("/dashboard/admin/executive-ledger", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const executiveId = parseInt(req.query.executiveId as string);
  if (!executiveId || isNaN(executiveId)) {
    res.status(400).json({ error: "executiveId is required" });
    return;
  }

  const [exec] = await db.select().from(usersTable).where(eq(usersTable.id, executiveId));
  if (!exec) {
    res.status(404).json({ error: "Executive not found" });
    return;
  }

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.executiveId, executiveId));
  const credits = await db.select().from(creditsTable).where(eq(creditsTable.executiveId, executiveId));
  const cajaMovements = await db.select().from(cajaMovementsTable).where(eq(cajaMovementsTable.executiveId, executiveId));
  const clients = await db.select().from(clientsTable).where(eq(clientsTable.executiveId, executiveId));
  const clientMap = new Map(clients.map(c => [c.id, c.fullName]));

  type LedgerEntry = {
    id: string;
    date: string;
    type: string;
    description: string;
    detail: string;
    amount: number;
    createdAt: string;
  };

  const entries: LedgerEntry[] = [];

  for (const p of payments) {
    if (p.paymentStatus === "pending_validation" || p.paymentStatus === "rejected") continue;
    const clientName = clientMap.get(p.clientId) ?? "Cliente";
    const credit = credits.find(c => c.id === p.creditId);
    const termWeeks = credit?.termWeeks ?? 0;
    entries.push({
      id: `pay-${p.id}`,
      date: p.paymentDate,
      type: "income",
      description: "Ingresos por prestamo",
      detail: `Pago ${p.paymentNumber} de ${termWeeks} ${clientName}`,
      amount: parseFloat(p.amountPaid),
      createdAt: p.createdAt.toISOString(),
    });
    if (p.lateFee && parseFloat(p.lateFee) > 0) {
      entries.push({
        id: `late-${p.id}`,
        date: p.paymentDate,
        type: "late_fee",
        description: "Multas",
        detail: clientName,
        amount: parseFloat(p.lateFee),
        createdAt: p.createdAt.toISOString(),
      });
    }
  }

  for (const c of credits) {
    if (c.status === "pending" || c.status === "rejected") continue;
    const clientName = clientMap.get(c.clientId) ?? "Cliente";
    const netDisbursed = parseFloat(c.amount) - (c.openingFee ? parseFloat(c.openingFee) : 0);
    entries.push({
      id: `disb-${c.id}`,
      date: c.disbursementDate,
      type: "disbursement",
      description: "Ingresos por prestamo",
      detail: `Desembolso de ${clientName}`,
      amount: -netDisbursed,
      createdAt: c.createdAt.toISOString(),
    });
  }

  for (const m of cajaMovements) {
    const mType = m.movementType;
    let type = "expense";
    let description = m.description ?? "Movimiento";
    let amount = parseFloat(m.amount);

    if (mType === "payroll") {
      type = "payroll";
      description = "Nomina";
      amount = -Math.abs(amount);
    } else if (mType === "capital") {
      type = "capital";
      description = "Capital Prestamos";
      amount = -Math.abs(amount);
    } else if (mType === "expense") {
      type = "expense";
      description = m.description ?? "Gasto";
      amount = -Math.abs(amount);
    } else if (mType === "collection") {
      continue;
    } else if (mType === "delivery") {
      type = "delivery";
      description = "Entrega a caja";
      amount = -Math.abs(amount);
    } else if (mType === "adjustment") {
      type = "adjustment";
      description = m.description ?? "Ajuste";
    }

    entries.push({
      id: `caja-${m.id}`,
      date: m.createdAt.toISOString().split("T")[0],
      type,
      description,
      detail: m.description ?? `Prestamos ${exec.fullName}`,
      amount,
      createdAt: m.createdAt.toISOString(),
    });
  }

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let runningBalance = 0;
  const entriesWithBalance = entries.map(e => {
    runningBalance += e.amount;
    return e;
  });

  const totalBalance = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1]
    : 0;

  const activeCredits = credits.filter(c => c.status === "active");
  const totalPortfolio = activeCredits.reduce((s, c) => s + parseFloat(c.remainingBalance), 0);
  const totalDisbursed = credits
    .filter(c => c.status !== "pending" && c.status !== "rejected")
    .reduce((s, c) => s + parseFloat(c.amount), 0);
  const totalCollected = payments
    .filter(p => p.paymentStatus !== "pending_validation" && p.paymentStatus !== "rejected")
    .reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  const balance = entries.reduce((s, e) => s + e.amount, 0);

  res.json({
    executiveId,
    executiveName: exec.fullName,
    balance: Math.round(balance * 100) / 100,
    totalPortfolio: Math.round(totalPortfolio * 100) / 100,
    totalDisbursed: Math.round(totalDisbursed * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    activeCredits: activeCredits.length,
    totalClients: clients.length,
    entries: entries.map(e => ({
      ...e,
      amount: Math.round(e.amount * 100) / 100,
    })),
  });
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
