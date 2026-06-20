import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { pool } from "@workspace/db";

const router = Router();

// ─── Tablas (lazy create) ───────────────────────────────────────────────────
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_banners (
      id          serial PRIMARY KEY,
      title       text NOT NULL,
      body        text,
      cta_label   text,
      cta_url     text,
      variant     text DEFAULT 'info',
      is_active   boolean DEFAULT true,
      sort_order  int DEFAULT 0,
      created_at  timestamptz DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_notifications (
      id          serial PRIMARY KEY,
      title       text NOT NULL,
      body        text NOT NULL,
      audience    text DEFAULT 'all',
      is_active   boolean DEFAULT true,
      created_at  timestamptz DEFAULT now()
    )
  `);
}

/* ═══════════ BANNERS (publicidad / contenido dinámico) ═══════════ */

// Público: banners activos para mostrar al cliente
router.get("/content/banners/active", async (_req, res): Promise<void> => {
  try {
    await ensureTables();
    const { rows } = await pool.query(
      `SELECT id, title, body, cta_label, cta_url, variant
       FROM app_banners WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`
    );
    res.json(rows);
  } catch { res.json([]); }
});

// Admin: listar todos
router.get("/content/banners", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  await ensureTables();
  const { rows } = await pool.query(`SELECT * FROM app_banners ORDER BY sort_order ASC, created_at DESC`);
  res.json(rows);
});

// Admin: crear
router.post("/content/banners", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  const { title, body, ctaLabel, ctaUrl, variant, sortOrder } = req.body ?? {};
  if (!title) { res.status(400).json({ error: "El título es obligatorio" }); return; }
  const { rows } = await pool.query(
    `INSERT INTO app_banners (title, body, cta_label, cta_url, variant, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, body ?? null, ctaLabel ?? null, ctaUrl ?? null, variant ?? "info", sortOrder ?? 0]
  );
  res.json(rows[0]);
});

// Admin: actualizar
router.put("/content/banners/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  const { title, body, ctaLabel, ctaUrl, variant, isActive, sortOrder } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE app_banners SET
       title = COALESCE($2,title), body = $3, cta_label = $4, cta_url = $5,
       variant = COALESCE($6,variant), is_active = COALESCE($7,is_active), sort_order = COALESCE($8,sort_order)
     WHERE id = $1 RETURNING *`,
    [req.params.id, title ?? null, body ?? null, ctaLabel ?? null, ctaUrl ?? null, variant ?? null, isActive ?? null, sortOrder ?? null]
  );
  res.json(rows[0] ?? null);
});

// Admin: eliminar
router.delete("/content/banners/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  await pool.query(`DELETE FROM app_banners WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

/* ═══════════ NOTIFICACIONES GENERALES ═══════════ */

// Público/cliente: notificaciones activas
router.get("/content/notifications/active", async (_req, res): Promise<void> => {
  try {
    await ensureTables();
    const { rows } = await pool.query(
      `SELECT id, title, body, audience, created_at
       FROM app_notifications WHERE is_active = true
       ORDER BY created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch { res.json([]); }
});

// Admin: listar todas
router.get("/content/notifications", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  await ensureTables();
  const { rows } = await pool.query(`SELECT * FROM app_notifications ORDER BY created_at DESC`);
  res.json(rows);
});

// Admin: crear
router.post("/content/notifications", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  const { title, body, audience } = req.body ?? {};
  if (!title || !body) { res.status(400).json({ error: "Título y mensaje son obligatorios" }); return; }
  const { rows } = await pool.query(
    `INSERT INTO app_notifications (title, body, audience) VALUES ($1,$2,$3) RETURNING *`,
    [title, body, audience ?? "all"]
  );
  res.json(rows[0]);
});

// Admin: editar (texto, audiencia y/o activar/desactivar)
router.put("/content/notifications/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  const { title, body, audience, isActive } = req.body ?? {};
  const { rows } = await pool.query(
    `UPDATE app_notifications SET
       title = COALESCE($2,title),
       body = COALESCE($3,body),
       audience = COALESCE($4,audience),
       is_active = COALESCE($5,is_active)
     WHERE id = $1 RETURNING *`,
    [req.params.id, title ?? null, body ?? null, audience ?? null, isActive ?? null]
  );
  res.json(rows[0] ?? null);
});

// Admin: eliminar
router.delete("/content/notifications/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  await ensureTables();
  await pool.query(`DELETE FROM app_notifications WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

/* ═══════════ ESTADÍSTICAS DE USO ═══════════ */
router.get("/content/usage-stats", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  try {
    // Distribución de usuarios por rol
    const { rows: roleRows } = await pool.query(`
      SELECT role, COUNT(*)::int AS count FROM users GROUP BY role
    `);
    const byRole: Record<string, number> = {};
    for (const r of roleRows) byRole[r.role] = r.count;

    // Nuevos clientes por periodo
    const { rows: newClients } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE registered_at >= now() - interval '7 days')::int  AS week,
        COUNT(*) FILTER (WHERE registered_at >= now() - interval '30 days')::int AS month,
        COUNT(*)::int AS total
      FROM clients
    `);

    // Créditos activos vs total
    const { rows: creditRows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int  AS active,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*)::int AS total
      FROM credits
    `);

    // Banners y notificaciones activos
    await ensureTables();
    const { rows: contentRows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM app_banners WHERE is_active = true)       AS banners,
        (SELECT COUNT(*)::int FROM app_notifications WHERE is_active = true) AS notifications
    `);

    // Tendencia: clientes nuevos últimos 8 días
    const { rows: trend } = await pool.query(`
      SELECT to_char(d::date, 'DD/MM') AS label,
             COUNT(c.id)::int AS count
      FROM generate_series(now() - interval '7 days', now(), interval '1 day') d
      LEFT JOIN clients c ON c.registered_at::date = d::date
      GROUP BY d::date ORDER BY d::date
    `);

    res.json({
      byRole,
      newClients: newClients[0] ?? { week: 0, month: 0, total: 0 },
      credits: creditRows[0] ?? { active: 0, pending: 0, total: 0 },
      content: contentRows[0] ?? { banners: 0, notifications: 0 },
      trend,
    });
  } catch (e) {
    res.json({ byRole: {}, newClients: { week: 0, month: 0, total: 0 }, credits: { active: 0, pending: 0, total: 0 }, content: { banners: 0, notifications: 0 }, trend: [] });
  }
});

export default router;
