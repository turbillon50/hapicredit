import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendDocumentRequestEmail } from "../lib/email";
import { pool as dbPool } from "@workspace/db";

const router = Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_requests (
      id          serial PRIMARY KEY,
      user_id     integer NOT NULL,
      doc_type    text NOT NULL,
      label       text NOT NULL,
      note        text,
      status      text NOT NULL DEFAULT 'pending',
      requested_by integer,
      created_at  timestamptz NOT NULL DEFAULT now(),
      fulfilled_at timestamptz
    )
  `);
}

// Catálogo de tipos de documento solicitables
const DOC_CATALOG: Record<string, string> = {
  ine_front: "INE — Frente",
  ine_back: "INE — Reverso",
  comprobante_domicilio: "Comprobante de domicilio",
  estado_cuenta: "Estado de cuenta",
  recibo_nomina: "Recibo de nómina",
  selfie_ine: "Selfie con INE",
  curp: "CURP",
  foto: "Fotografía reciente",
  otro: "Otro documento",
};

// ─── Admin: solicitar documentos a un cliente ───
router.post("/document-requests", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  await ensureTable();
  const { userId, docTypes, note } = req.body ?? {};
  if (!userId || !Array.isArray(docTypes) || docTypes.length === 0) {
    res.status(400).json({ error: "userId y docTypes son requeridos" }); return;
  }
  const created: any[] = [];
  for (const dt of docTypes) {
    const label = DOC_CATALOG[dt] ?? dt;
    const { rows } = await pool.query(
      `INSERT INTO document_requests (user_id, doc_type, label, note, requested_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, dt, label, note ?? null, req.userId]
    );
    created.push(rows[0]);
  }
  // Avisar al cliente por correo (no bloqueante)
  try {
    const { rows: urows } = await dbPool.query(
      "SELECT email, full_name FROM users WHERE id = $1 LIMIT 1", [userId]
    );
    const u = urows[0];
    if (u?.email) {
      sendDocumentRequestEmail({
        to: u.email,
        clientName: u.full_name ?? "Acreditado",
        docs: created.map(r => r.label),
        note: note ?? undefined,
      }).catch(() => {});
    }
  } catch { /* email no crítico */ }

  res.json({ ok: true, requests: created });
});

// ─── Cliente: ver mis documentos solicitados (pendientes) ───
router.get("/document-requests/mine", requireAuth, async (req, res): Promise<void> => {
  try {
    await ensureTable();
    const { rows } = await pool.query(
      `SELECT * FROM document_requests WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch { res.json([]); }
});

// ─── Admin: ver documentos solicitados de un usuario ───
router.get("/document-requests/user/:userId", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  try {
    await ensureTable();
    const { rows } = await pool.query(
      `SELECT * FROM document_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch { res.json([]); }
});

// ─── Marcar una solicitud como cumplida (cuando el cliente sube el doc) ───
router.patch("/document-requests/:id/fulfill", requireAuth, async (req, res): Promise<void> => {
  await ensureTable();
  const { rows } = await pool.query(
    `UPDATE document_requests SET status = 'fulfilled', fulfilled_at = now() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json(rows[0] ?? null);
});

// ─── Admin: cancelar una solicitud ───
router.delete("/document-requests/:id", requireAuth, requireRole("admin", "executive"), async (req, res): Promise<void> => {
  await ensureTable();
  await pool.query(`DELETE FROM document_requests WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

export default router;
