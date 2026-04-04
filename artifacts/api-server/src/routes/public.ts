import { Router, type IRouter } from "express";
import { db, publicRequestsTable } from "@workspace/db";
import { CreatePublicRequestBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/public/requests", async (req, res): Promise<void> => {
  const parsed = CreatePublicRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(publicRequestsTable).values(parsed.data);
  res.status(201).json({ success: true, message: "Solicitud recibida. Te contactaremos pronto." });
});

export default router;
