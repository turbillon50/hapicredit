import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  getVapidPublicKey,
  removeSubscription,
  saveSubscription,
  sendPushToUsers,
} from "../lib/push";

const router = Router();

router.get("/push/public-key", requireAuth, async (_req, res): Promise<void> => {
  try {
    res.json({ publicKey: await getVapidPublicKey() });
  } catch {
    res.status(503).json({ error: "Notificaciones no disponibles por el momento" });
  }
});

router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Suscripción inválida: se requieren endpoint y keys" });
    return;
  }
  try {
    await saveSubscription(req.userId!, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    res.status(201).json({ success: true });
  } catch {
    res.status(503).json({ error: "No se pudo guardar la suscripción" });
  }
});

router.delete("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint } = req.body ?? {};
  if (!endpoint) {
    res.status(400).json({ error: "endpoint es requerido" });
    return;
  }
  await removeSubscription(String(endpoint)).catch(() => {});
  res.json({ success: true });
});

// Sends a test notification to the calling admin's own devices.
router.post("/push/test", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await sendPushToUsers([req.userId!], {
    title: "credeti",
    body: "Notificaciones push activas ✅",
    url: "/",
  });
  res.json({ success: true });
});

export default router;
