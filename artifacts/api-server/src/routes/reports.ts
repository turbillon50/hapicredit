import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// ── Helper: fecha de inicio y fin de un rango ─────────────────────────────
function dateRange(from?: string, to?: string) {
  const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const t = to   ? new Date(to)   : new Date();
  t.setHours(23, 59, 59, 999);
  return { from: f, to: t };
}

// ── GET /reports/cartera-activa ──────────────────────────────────────────────
router.get("/reports/cartera-activa", requireAuth, requireRole("admin", "executive"), async (req, res) => {
  const rows = await pool.query(`
    SELECT
      c.id           AS credit_id,
      cl.full_name   AS client_name,
      cl.phone       AS client_phone,
      u.full_name    AS executive_name,
      c.amount::float                AS amount,
      c.remaining_balance::float     AS remaining_balance,
      c.weekly_payment::float        AS weekly_payment,
      c.current_payment_number       AS payments_made,
      c.term_weeks                   AS total_weeks,
      c.disbursement_date,
      c.status,
      c.renewal_eligible
    FROM credits c
    JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN users u ON u.id = c.executive_id
    WHERE c.status = 'active'
    ORDER BY cl.full_name
  `);
  res.json(rows.rows);
});

// ── GET /reports/cobranza ────────────────────────────────────────────────────
router.get("/reports/cobranza", requireAuth, requireRole("admin", "executive"), async (req, res) => {
  const { from, to } = dateRange(req.query.from as string, req.query.to as string);
  const rows = await pool.query(`
    SELECT
      p.id           AS payment_id,
      cl.full_name   AS client_name,
      cl.phone       AS client_phone,
      u.full_name    AS executive_name,
      p.amount_paid::float           AS amount_paid,
      p.amount_expected::float       AS amount_expected,
      p.late_fee::float              AS late_fee,
      p.payment_date,
      p.payment_status,
      p.payment_number,
      c.id           AS credit_id
    FROM payments p
    JOIN credits c  ON c.id = p.credit_id
    JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN users u ON u.id = p.executive_id
    WHERE p.payment_date BETWEEN $1 AND $2
    ORDER BY p.payment_date DESC
  `, [from, to]);
  res.json(rows.rows);
});

// ── GET /reports/morosos ─────────────────────────────────────────────────────
router.get("/reports/morosos", requireAuth, requireRole("admin", "executive"), async (req, res) => {
  const today = new Date();
  const rows = await pool.query(`
    SELECT
      c.id           AS credit_id,
      cl.full_name   AS client_name,
      cl.phone       AS client_phone,
      cl.address     AS client_address,
      u.full_name    AS executive_name,
      c.amount::float                AS amount,
      c.remaining_balance::float     AS remaining_balance,
      c.weekly_payment::float        AS weekly_payment,
      c.current_payment_number       AS payments_made,
      c.term_weeks                   AS total_weeks,
      COALESCE(
        (SELECT MAX(p2.payment_date) FROM payments p2
         WHERE p2.credit_id = c.id AND p2.payment_status IN ('on_time','late')),
        c.disbursement_date
      ) AS last_payment_date
    FROM credits c
    JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN users u ON u.id = c.executive_id
    WHERE c.status = 'active'
      AND cl.status IN ('at_risk','overdue','defaulted')
    ORDER BY cl.status DESC, cl.full_name
  `);
  res.json(rows.rows);
});

// ── GET /reports/solicitudes ─────────────────────────────────────────────────
router.get("/reports/solicitudes", requireAuth, requireRole("admin"), async (req, res) => {
  const { from, to } = dateRange(req.query.from as string, req.query.to as string);
  const rows = await pool.query(`
    SELECT
      c.id           AS credit_id,
      cl.full_name   AS client_name,
      cl.phone       AS client_phone,
      u.full_name    AS executive_name,
      c.amount::float      AS amount,
      c.term_weeks,
      c.status,
      c.notes,
      c.created_at,
      c.disbursement_date
    FROM credits c
    JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN users u ON u.id = c.executive_id
    WHERE c.created_at BETWEEN $1 AND $2
    ORDER BY c.created_at DESC
  `, [from, to]);
  res.json(rows.rows);
});

// ── GET /reports/estado-cuenta/:clientId ─────────────────────────────────────
router.get("/reports/estado-cuenta/:clientId", requireAuth, requireRole("admin", "executive"), async (req, res) => {
  const clientId = parseInt(req.params.clientId);
  if (isNaN(clientId)) { res.status(400).json({ error: "clientId inválido" }); return; }

  const client = await pool.query(`
    SELECT cl.*, u.full_name AS executive_name
    FROM clients cl LEFT JOIN users u ON u.id = cl.executive_id
    WHERE cl.id = $1
  `, [clientId]);
  if (!client.rows[0]) { res.status(404).json({ error: "Cliente no encontrado" }); return; }

  const credits = await pool.query(`
    SELECT c.*,
      COALESCE(
        json_agg(p ORDER BY p.payment_date) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS payments
    FROM credits c
    LEFT JOIN payments p ON p.credit_id = c.id
    WHERE c.client_id = $1
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `, [clientId]);

  res.json({
    client: client.rows[0],
    credits: credits.rows,
  });
});

// ── GET /reports/comisiones ──────────────────────────────────────────────────
router.get("/reports/comisiones", requireAuth, requireRole("admin"), async (req, res) => {
  const { from, to } = dateRange(req.query.from as string, req.query.to as string);
  const rows = await pool.query(`
    SELECT
      u.id           AS executive_id,
      u.full_name    AS executive_name,
      COUNT(DISTINCT c.id)::int           AS active_credits,
      SUM(c.amount::float)                AS total_placed,
      COUNT(p.id)::int                    AS payments_collected,
      SUM(p.amount_paid::float)           AS total_collected,
      SUM(p.late_fee::float)              AS total_late_fees
    FROM users u
    LEFT JOIN credits c  ON c.executive_id = u.id AND c.status = 'active'
    LEFT JOIN payments p ON p.executive_id = u.id
      AND p.payment_date BETWEEN $1 AND $2
      AND p.payment_status IN ('on_time','late')
    WHERE u.role = 'executive' AND u.is_active = true
    GROUP BY u.id, u.full_name
    ORDER BY total_collected DESC NULLS LAST
  `, [from, to]);
  res.json(rows.rows);
});

// ── GET /reports/flujo-caja ──────────────────────────────────────────────────
router.get("/reports/flujo-caja", requireAuth, requireRole("admin"), async (req, res) => {
  const { from, to } = dateRange(req.query.from as string, req.query.to as string);

  const [disbursed, collected, pending] = await Promise.all([
    pool.query(`
      SELECT COALESCE(SUM(amount::float),0) AS total
      FROM credits
      WHERE disbursement_date BETWEEN $1 AND $2
    `, [from, to]),
    pool.query(`
      SELECT COALESCE(SUM(amount_paid::float),0) AS total
      FROM payments
      WHERE payment_date BETWEEN $1 AND $2
        AND payment_status IN ('on_time','late')
    `, [from, to]),
    pool.query(`
      SELECT COALESCE(SUM(amount_paid::float),0) AS total
      FROM payments
      WHERE payment_date BETWEEN $1 AND $2
        AND payment_status = 'pending_validation'
    `, [from, to]),
  ]);

  // Proyección próximos 4 pagos semana por semana
  const projection = await pool.query(`
    SELECT
      DATE_TRUNC('week', NOW() + (gs * interval '1 week')) AS week_start,
      SUM(weekly_payment::float) AS expected
    FROM credits, generate_series(1,4) gs
    WHERE status = 'active'
    GROUP BY week_start
    ORDER BY week_start
  `);

  res.json({
    period: { from, to },
    disbursed: disbursed.rows[0].total,
    collected: collected.rows[0].total,
    pendingValidation: pending.rows[0].total,
    netFlow: collected.rows[0].total - disbursed.rows[0].total,
    weeklyProjection: projection.rows,
  });
});

// ── GET /reports/cartera-riesgo ──────────────────────────────────────────────
router.get("/reports/cartera-riesgo", requireAuth, requireRole("admin"), async (req, res) => {
  const rows = await pool.query(`
    SELECT
      c.id           AS credit_id,
      cl.full_name   AS client_name,
      cl.phone       AS client_phone,
      cl.status      AS client_status,
      u.full_name    AS executive_name,
      c.amount::float            AS amount,
      c.remaining_balance::float AS remaining_balance,
      COUNT(a.id)::int           AS alert_count,
      MAX(a.created_at)          AS last_alert,
      STRING_AGG(DISTINCT a.alert_type, ', ') AS alert_types
    FROM credits c
    JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN users u ON u.id = c.executive_id
    LEFT JOIN alerts a ON a.client_id = cl.id AND a.resolved = false
    WHERE c.status = 'active'
      AND (cl.status != 'current' OR a.id IS NOT NULL)
    GROUP BY c.id, cl.id, u.full_name
    ORDER BY alert_count DESC, cl.status DESC
  `);
  res.json(rows.rows);
});

export default router;
