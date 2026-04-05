import { Router, type IRouter } from "express";
import { db, publicRequestsTable } from "@workspace/db";
import { CreatePublicRequestBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

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
    fullName, phone, altPhone, email, address, curp,
    guarantorName, guarantorPhone, guarantorRelationship,
    requestedAmount, termWeeks, purpose, monthlyIncome,
    documents,
  } = req.body;

  if (!fullName || !phone || !requestedAmount || !termWeeks) {
    res.status(400).json({ error: "Campos obligatorios: nombre, teléfono, monto y plazo" });
    return;
  }

  const message = JSON.stringify({
    type: "credit_application",
    personalInfo: { fullName, phone, altPhone, email, address, curp },
    guarantor: { name: guarantorName, phone: guarantorPhone, relationship: guarantorRelationship },
    creditRequest: { requestedAmount, termWeeks, purpose, monthlyIncome },
    documents: documents ?? {},
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
