import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { pool } from "@workspace/db";

const router = Router();

// Default config values
const DEFAULTS: Record<string, string> = {
  // Calculadora — crédito nuevo
  calc_nuevo_min:       "500",
  calc_nuevo_max:       "2000",
  calc_nuevo_plazo:     "4",        // semanas fijas
  calc_nuevo_tasa:      "30",       // % total plano

  // Calculadora — crédito existente
  calc_exist_min:       "1000",
  calc_exist_max:       "30000",
  calc_exist_plazo_min: "4",
  calc_exist_plazo_max: "48",
  calc_exist_tasa_mensual: "5",     // % mensual

  // Empresa
  empresa_nombre:   "credeti",
  empresa_tagline:  "Crédito grupal para ti",
  empresa_whatsapp: "",
  empresa_email:    "contacto@crede-ti.info",
};

// Ensure table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   text PRIMARY KEY,
      value text NOT NULL
    )
  `);
}

// GET /api/config — returns all settings merged with defaults
router.get("/config", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  try {
    await ensureTable();
    const { rows } = await pool.query<{ key: string; value: string }>(
      `SELECT key, value FROM app_settings WHERE key NOT IN ('vapid_public_key','vapid_private_key')`
    );
    const stored: Record<string, string> = {};
    rows.forEach(r => { stored[r.key] = r.value; });
    const merged = { ...DEFAULTS, ...stored };
    res.json(merged);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/config/public — no auth needed (for calculator)
router.get("/config/public", async (_req, res): Promise<void> => {
  try {
    await ensureTable();
    const publicKeys = [
      "calc_nuevo_min","calc_nuevo_max","calc_nuevo_plazo","calc_nuevo_tasa",
      "calc_exist_min","calc_exist_max","calc_exist_plazo_min","calc_exist_plazo_max",
      "calc_exist_tasa_mensual","empresa_nombre","empresa_tagline","empresa_whatsapp",
    ];
    const { rows } = await pool.query<{ key: string; value: string }>(
      `SELECT key, value FROM app_settings WHERE key = ANY($1)`,
      [publicKeys]
    );
    const stored: Record<string, string> = {};
    rows.forEach(r => { stored[r.key] = r.value; });
    const result: Record<string, string> = {};
    publicKeys.forEach(k => { result[k] = stored[k] ?? DEFAULTS[k] ?? ""; });
    res.json(result);
  } catch {
    // Return defaults if table doesn't exist yet
    const result: Record<string, string> = {};
    ["calc_nuevo_min","calc_nuevo_max","calc_nuevo_plazo","calc_nuevo_tasa",
     "calc_exist_min","calc_exist_max","calc_exist_plazo_min","calc_exist_plazo_max",
     "calc_exist_tasa_mensual","empresa_nombre","empresa_tagline","empresa_whatsapp",
    ].forEach(k => { result[k] = DEFAULTS[k] ?? ""; });
    res.json(result);
  }
});

// PUT /api/config — bulk upsert
router.put("/config", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const updates = req.body as Record<string, string>;
  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Body must be an object of key:value pairs" });
    return;
  }
  // Block VAPID keys from being overwritten via this endpoint
  const forbidden = ["vapid_public_key", "vapid_private_key"];
  const entries = Object.entries(updates).filter(([k]) => !forbidden.includes(k));
  if (entries.length === 0) { res.json({ updated: 0 }); return; }
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO app_settings (key, value)
       SELECT unnest($1::text[]), unnest($2::text[])
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [entries.map(([k]) => k), entries.map(([, v]) => String(v))]
    );
    res.json({ updated: entries.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
