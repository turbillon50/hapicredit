import { Router } from "express";
import { db, publicRequestsTable } from "@workspace/db";
import { CreatePublicRequestBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.post("/public/requests", async (req, res): Promise<void> => {
  const parsed = CreatePublicRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(publicRequestsTable).values(parsed.data).returning();
  res.status(201).json({ success: true, id: record.id, message: "Solicitud recibida. Te contactaremos pronto." });
});

// Admin: list all public credit requests
router.get("/public/requests", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(publicRequestsTable).orderBy(publicRequestsTable.createdAt);
  res.json(rows);
});

// Public: full credit application with KYC + documents
router.post("/public/apply", async (req, res): Promise<void> => {
  const {
    fullName, phone, email,
    personalInfo, businessInfo, references, guarantor,
    creditRequest, documents, source,
  } = req.body;

  if (!fullName || !phone) {
    res.status(400).json({ error: "Campos obligatorios: nombre y teléfono" });
    return;
  }

  const RATE_8 = 175;
  const RATE_13 = 120;
  const amt = creditRequest?.requestedAmount ?? 5000;
  const rawWeeks = creditRequest?.termWeeks ?? 8;
  const weeks = rawWeeks === 8 || rawWeeks === 13 ? rawWeeks : 8;
  const rate = weeks === 8 ? RATE_8 : RATE_13;
  const thousands = amt / 1000;
  const weeklyPayment = thousands * rate;
  const totalPayment = weeklyPayment * weeks;
  const commission = amt * 0.10;
  const disbursement = amt - commission;

  const message = JSON.stringify({
    type: "credit_application",
    personalInfo: personalInfo ?? { fullName, phone },
    businessInfo: businessInfo ?? {},
    references: references ?? [],
    guarantor: guarantor ?? {},
    creditRequest: {
      ...creditRequest,
      requestedAmount: amt,
      termWeeks: weeks,
      weeklyPayment,
      totalPayment,
      commission,
      disbursement,
      ratePerThousand: rate,
    },
    documents: documents ?? {},
    source: source ?? "unknown",
    submittedAt: new Date().toISOString(),
  });

  const [record] = await db.insert(publicRequestsTable).values({
    name: fullName,
    phone,
    email: email ?? null,
    message,
  }).returning();

  const refNumber = `HC-${String(record.id).padStart(5, "0")}`;
  res.status(201).json({ success: true, id: record.id, referenceNumber: refNumber });
});

export default router;
