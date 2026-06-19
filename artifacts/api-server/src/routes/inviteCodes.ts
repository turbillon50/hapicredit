import { Router } from "express";
import { and, db, eq, gt, inviteCodesTable, isNull, pool, sql, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

// ── Lazy migration: add VIP columns to invite_codes if not present ──────────
let vipColumnsMigrated = false;
async function ensureVipColumns() {
  if (vipColumnsMigrated) return;
  await pool.query(`
    ALTER TABLE invite_codes
      ADD COLUMN IF NOT EXISTS invite_type        text         NOT NULL DEFAULT 'staff',
      ADD COLUMN IF NOT EXISTS recipient_name     text,
      ADD COLUMN IF NOT EXISTS recipient_phone    text,
      ADD COLUMN IF NOT EXISTS vip_message        text,
      ADD COLUMN IF NOT EXISTS pre_approved_amount    numeric(12,2),
      ADD COLUMN IF NOT EXISTS pre_approved_term_weeks integer,
      ADD COLUMN IF NOT EXISTS pre_approved_rate   numeric(5,2),
      ADD COLUMN IF NOT EXISTS pre_approved_fee    numeric(12,2)
  `);
  vipColumnsMigrated = true;
}


function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
}

// Generate invite code
// admin → can invite: executive, client, admin (admin invite = independent tree, max 1 admin invite active)
// executive → can invite: client only
router.post("/invite-codes/generate", requireAuth, async (req, res): Promise<void> => {
  const { role } = req.body;
  const userRole = req.userRole;

  if (userRole === "client") {
    res.status(403).json({ error: "Sin permiso para generar códigos" }); return;
  }
  if (userRole === "executive" && role !== "client") {
    res.status(400).json({ error: "Asesor solo puede generar códigos para acreditados" }); return;
  }
  if (userRole === "admin" && !["executive", "client", "admin"].includes(role)) {
    res.status(400).json({ error: "Rol inválido" }); return;
  }

  // Admin limit removed for testing — will be re-enabled after initial setup

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Admin invites: parentId = creator's id so branch admins are linked in hierarchy
  // Superadmin (parentId=null) creates branch admins with parentId=superadmin's userId
  const parentId = req.userId!;

  const [newCode] = await db.insert(inviteCodesTable).values({
    code,
    role,
    createdById: req.userId!,
    parentId,
    isActive: true,
    expiresAt,
  }).returning();

  res.json({ code: newCode.code, role: newCode.role, expiresAt: newCode.expiresAt });
});

// List all codes I created
router.get("/invite-codes/mine", requireAuth, async (req, res): Promise<void> => {
  const codes = await db
    .select({
      id: inviteCodesTable.id,
      code: inviteCodesTable.code,
      role: inviteCodesTable.role,
      isActive: inviteCodesTable.isActive,
      expiresAt: inviteCodesTable.expiresAt,
      createdAt: inviteCodesTable.createdAt,
      usedAt: inviteCodesTable.usedAt,
      usedByName: usersTable.fullName,
    })
    .from(inviteCodesTable)
    .leftJoin(usersTable, eq(inviteCodesTable.usedById, usersTable.id))
    .where(eq(inviteCodesTable.createdById, req.userId!))
    .orderBy(inviteCodesTable.createdAt);

  res.json(codes);
});

// Deactivate / delete a code
router.delete("/invite-codes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [code] = await db.select().from(inviteCodesTable).where(eq(inviteCodesTable.id, id));
  if (!code) { res.status(404).json({ error: "Código no encontrado" }); return; }
  if (code.createdById !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "No tienes permiso" }); return;
  }

  await db.update(inviteCodesTable).set({ isActive: false }).where(eq(inviteCodesTable.id, id));
  res.json({ success: true });
});

// Validate a code (public — used before registration)
router.get("/invite-codes/validate/:code", async (req, res): Promise<void> => {
  const { code } = req.params;
  const now = new Date();

  const [found] = await db
    .select({
      id: inviteCodesTable.id,
      code: inviteCodesTable.code,
      role: inviteCodesTable.role,
      createdById: inviteCodesTable.createdById,
      parentId: inviteCodesTable.parentId,
      expiresAt: inviteCodesTable.expiresAt,
      creatorName: usersTable.fullName,
    })
    .from(inviteCodesTable)
    .leftJoin(usersTable, eq(inviteCodesTable.createdById, usersTable.id))
    .where(
      and(
        sql`lower(${inviteCodesTable.code}) = lower(${code})`,
        eq(inviteCodesTable.isActive, true),
        isNull(inviteCodesTable.usedById),
        gt(inviteCodesTable.expiresAt, now),
      )
    );

  if (!found) {
    res.status(404).json({ error: "Código inválido, usado o expirado" });
    return;
  }

  res.json({ valid: true, role: found.role, code: found.code, creatorName: found.creatorName });
});


// ── POST /invite-codes/generate-vip ─────────────────────────────────────────
// Admin generates a personalized VIP invitation with pre-approved credit terms
router.post("/invite-codes/generate-vip", requireAuth, async (req, res): Promise<void> => {
  await ensureVipColumns();
  const {
    recipientName, recipientPhone, vipMessage,
    preApprovedAmount, preApprovedTermWeeks, preApprovedRate, preApprovedFee,
    inviteType = "vip_new",
    expiresInDays = 7,
  } = req.body;

  if (!recipientName || !preApprovedAmount || !preApprovedTermWeeks) {
    res.status(400).json({ error: "Faltan datos requeridos: recipientName, preApprovedAmount, preApprovedTermWeeks" });
    return;
  }

  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + expiresInDays * 86400 * 1000);

  await pool.query(`
    INSERT INTO invite_codes
      (code, role, invite_type, recipient_name, recipient_phone, vip_message,
       pre_approved_amount, pre_approved_term_weeks, pre_approved_rate, pre_approved_fee,
       created_by_id, is_active, expires_at, created_at)
    VALUES ($1,'client',$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,NOW())
  `, [
    code, inviteType, recipientName, recipientPhone ?? null, vipMessage ?? null,
    preApprovedAmount, preApprovedTermWeeks, preApprovedRate ?? null, preApprovedFee ?? null,
    req.userId, expiresAt,
  ]);

  res.json({
    code,
    inviteType,
    recipientName,
    expiresAt,
    link: `/invitacion/${code}`,
  });
});

// ── GET /invite-codes/vip/:code ──────────────────────────────────────────────
// Public endpoint — returns VIP invite details for the landing page
router.get("/invite-codes/vip/:code", async (req, res): Promise<void> => {
  await ensureVipColumns();
  const { code } = req.params;
  const now = new Date();

  const result = await pool.query(`
    SELECT code, invite_type, recipient_name, recipient_phone, vip_message,
           pre_approved_amount, pre_approved_term_weeks, pre_approved_rate, pre_approved_fee,
           is_active, expires_at, used_at
    FROM invite_codes
    WHERE UPPER(code) = UPPER($1)
  `, [code]);

  const row = result.rows[0];
  if (!row) { res.status(404).json({ error: "Invitación no encontrada" }); return; }
  if (!row.is_active) { res.status(410).json({ error: "Esta invitación ya no está activa" }); return; }
  if (row.expires_at && new Date(row.expires_at) < now) { res.status(410).json({ error: "Esta invitación ha expirado" }); return; }
  if (row.used_at) { res.status(410).json({ error: "Esta invitación ya fue utilizada" }); return; }

  res.json({
    code: row.code,
    inviteType: row.invite_type,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    vipMessage: row.vip_message,
    preApprovedAmount: parseFloat(row.pre_approved_amount ?? "0"),
    preApprovedTermWeeks: row.pre_approved_term_weeks,
    preApprovedRate: row.pre_approved_rate ? parseFloat(row.pre_approved_rate) : null,
    preApprovedFee: row.pre_approved_fee ? parseFloat(row.pre_approved_fee) : null,
    expiresAt: row.expires_at,
  });
});


// ── POST /invite-codes/redeem-vip ────────────────────────────────────────────
// Called by the client immediately after registration if they came from a VIP link.
// Creates the pre-approved credit in "pending" status.
router.post("/invite-codes/redeem-vip", requireAuth, async (req, res): Promise<void> => {
  await ensureVipColumns();
  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "Código requerido" }); return; }

  const now = new Date();
  const result = await pool.query(`
    SELECT * FROM invite_codes
    WHERE UPPER(code) = UPPER($1)
      AND is_active = true
      AND used_by_id IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
      AND invite_type IN ('vip_new','vip_renewal')
  `, [code]);

  const inv = result.rows[0];
  if (!inv) { res.status(404).json({ error: "Código VIP inválido, expirado o ya usado" }); return; }

  // Resolve client record
  const { resolveClientId } = await import("../lib/clientResolver");
  let clientId = await resolveClientId(req.userId!);

  // If no client record yet, create one from the invite data
  if (!clientId) {
    const [user] = (await pool.query(`SELECT full_name, phone FROM users WHERE id = $1`, [req.userId!])).rows;
    const ins = await pool.query(`
      INSERT INTO clients (full_name, phone, status, user_id, registered_at)
      VALUES ($1, $2, 'current', $3, NOW())
      RETURNING id
    `, [inv.recipient_name ?? user?.full_name ?? "Cliente", inv.recipient_phone ?? user?.phone ?? null, req.userId!]);
    clientId = ins.rows[0].id;
  }

  // Create the pre-approved credit in pending status
  const amount      = parseFloat(inv.pre_approved_amount   ?? "1000");
  const termWeeks   = inv.pre_approved_term_weeks           ?? 4;
  const rate        = parseFloat(inv.pre_approved_rate      ?? "30") / 100;
  const fee         = parseFloat(inv.pre_approved_fee       ?? "0");
  const totalRepay  = amount * (1 + rate);
  const weeklyPay   = parseFloat((totalRepay / termWeeks).toFixed(2));
  const disburseDate = new Date().toISOString().split("T")[0];

  const creditRes = await pool.query(`
    INSERT INTO credits
      (client_id, amount, disbursement_date, term_weeks, weekly_payment,
       opening_fee, total_to_repay, remaining_balance, status, notes, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'pending',$8,NOW(),NOW())
    RETURNING id
  `, [clientId, amount, disburseDate, termWeeks, weeklyPay, fee, totalRepay,
      `Credito VIP pre-aprobado (codigo: ${inv.code})`]);

  const creditId = creditRes.rows[0].id;

  // Mark invite as used
  await pool.query(`
    UPDATE invite_codes SET used_by_id=$1, used_at=NOW(), is_active=false WHERE id=$2
  `, [req.userId!, inv.id]);

  res.json({
    ok: true,
    creditId,
    clientId,
    amount,
    termWeeks,
    weeklyPayment: weeklyPay,
    totalToRepay: totalRepay,
    message: "Credito pre-aprobado vinculado a tu cuenta",
  });
});

export default router;
