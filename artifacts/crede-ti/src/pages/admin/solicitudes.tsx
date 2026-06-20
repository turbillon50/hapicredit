import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge } from "@/components/hapi/Badge";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { BottomSheet } from "@/components/hapi/BottomSheet";
import {
  IconBandeja, IconCheck, IconCerrar, IconOjo,
  IconMoneda, IconCalendario, IconTelefono,
  IconDocumento, IconPersona, IconLoader, IconGrupo,
  IconID, IconUbicacion,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type PublicApp = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status?: string;
  createdAt: string;
};

type PendingCredit = {
  id: number;
  clientId: number;
  clientName: string | null;
  executiveName: string | null;
  amount: number;
  termWeeks: number;
  weeklyPayment: number;
  totalToRepay: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

function parseApp(app: PublicApp) {
  try {
    const data = JSON.parse(app.message);
    if (data.type === "credit_application") return data;
  } catch {}
  return null;
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip({ pending, needsInfo }: { pending: PendingCredit[]; needsInfo: PendingCredit[] }) {
  const totalAmount = [...pending, ...needsInfo].reduce((s, c) => s + c.amount, 0);
  return (
    <div className="flex gap-2 px-4 mb-1">
      <div className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Por aprobar</div>
        <div className="text-lg font-extrabold text-blue-700">{pending.length}</div>
        <div className="text-[10px] text-blue-400">{new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(totalAmount)}</div>
      </div>
      <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Falta info</div>
        <div className="text-lg font-extrabold text-amber-600">{needsInfo.length}</div>
        <div className="text-[10px] text-amber-400">Esperando cliente</div>
      </div>
    </div>
  );
}

// ─── Credit card ─────────────────────────────────────────────────────────────
function CreditCard({ credit, onClick }: { credit: PendingCredit; onClick: () => void }) {
  const needsInfo = credit.status === "needs_info";
  return (
    <div
      className="card pressable"
      onClick={onClick}
      style={needsInfo ? { borderLeft: "4px solid #f59e0b" } : {}}
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={credit.clientName ?? "C"} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{credit.clientName ?? `Cliente #${credit.clientId}`}</div>
          {credit.executiveName && (
            <div className="text-xs text-gray-400 truncate">Asesor: {credit.executiveName}</div>
          )}
          <div className="text-xs text-gray-400">{fmtDate(credit.createdAt)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-base font-extrabold text-blue-700">{fmt(credit.amount)}</div>
          <Badge variant={needsInfo ? "warning" : "info"} size="sm">
            {needsInfo ? "Falta info" : "Pendiente"}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Semanal</div>
          <div className="text-xs font-bold text-gray-800">{fmt(credit.weeklyPayment)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Plazo</div>
          <div className="text-xs font-bold text-gray-800">{credit.termWeeks} sem</div>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Total</div>
          <div className="text-xs font-bold text-gray-800">{fmt(credit.totalToRepay)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Credit detail sheet ──────────────────────────────────────────────────────
function CreditDetail({
  credit,
  onDone,
}: {
  credit: PendingCredit;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes]             = useState(credit.status === "needs_info" ? (credit.notes ?? "") : "");
  const [confirm, setConfirm]         = useState<"approve" | "reject" | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [editAmount, setEditAmount]   = useState(String(credit.amount));
  const [editTerm, setEditTerm]       = useState(String(credit.termWeeks));
  const [editRate, setEditRate]       = useState(() => {
    const i = credit.totalToRepay - credit.amount;
    return String(credit.amount > 0 ? Math.round((i / credit.amount) * 1000) / 10 : 30);
  });
  const [editComm, setEditComm]       = useState(() => String((credit as any).openingFee ?? 0));
  const [editDate, setEditDate]       = useState(credit.disbursementDate ?? new Date().toISOString().split("T")[0]);
  const [savingEdit, setSavingEdit]   = useState(false);
  const [editError, setEditError]     = useState("");

  const amt      = parseFloat(editAmount) || 0;
  const weeks    = parseInt(editTerm)     || 1;
  const rateVal  = parseFloat(editRate)   || 0;
  const comm     = parseFloat(editComm)   || 0;
  const calcInterest  = amt * (rateVal / 100);
  const totalRepay    = amt + calcInterest;
  const weekly        = weeks > 0 ? totalRepay / weeks : 0;
  const delivers      = amt - comm;

  async function saveConditions() {
    setSavingEdit(true); setEditError("");
    try {
      const r = await fetch(`${API}/credits/${credit.id}/conditions`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt, termWeeks: weeks,
          weeklyPayment: parseFloat(weekly.toFixed(2)),
          totalToRepay: parseFloat(totalRepay.toFixed(2)),
          remainingBalance: parseFloat(totalRepay.toFixed(2)),
          openingFee: comm, disbursementDate: editDate,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Error al guardar");
      qc.invalidateQueries(); setEditMode(false);
    } catch (e: any) { setEditError(e.message ?? "Error"); }
    finally { setSavingEdit(false); }
  }

  const mut = useMutation({
    mutationFn: ({ action, n }: { action: "approve" | "reject" | "needs_info"; n?: string }) =>
      fetch(`${API}/credits/${credit.id}/review`, {
        method: "PATCH", headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: n }),
      }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries(); onDone(); },
  });

  if (confirm) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <div className="rounded-2xl p-4 text-center"
          style={{ background: confirm === "approve" ? "var(--surface-3)" : "var(--surface-3)", border: `1.5px solid ${confirm === "approve" ? "var(--surface-3)" : "var(--surface-3)"}` }}>
          <div className="text-2xl mb-2">{confirm === "approve" ? "✓" : "✗"}</div>
          <div className="font-bold text-gray-900 text-base mb-1">
            {confirm === "approve" ? "¿Aprobar este crédito?" : "¿Rechazar esta solicitud?"}
          </div>
          <div className="text-sm text-gray-500">
            {confirm === "approve"
              ? `Se activará el crédito de ${fmt(editMode ? amt : credit.amount)} para ${credit.clientName ?? "el cliente"}.`
              : "Se notificará al cliente que su solicitud fue rechazada."}
          </div>
        </div>
        {notes && <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 italic">"{notes}"</div>}
        <button onClick={() => mut.mutate({ action: confirm, n: notes || undefined })} disabled={mut.isPending}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
          style={{ background: confirm === "approve" ? "#10b981" : "#ef4444" }}>
          {mut.isPending ? <IconLoader size={16} /> : confirm === "approve" ? <IconCheck size={16} /> : <IconCerrar size={16} />}
          {confirm === "approve" ? "Sí, aprobar crédito" : "Sí, rechazar solicitud"}
        </button>
        <button onClick={() => setConfirm(null)} disabled={mut.isPending}
          className="py-3 rounded-2xl text-sm font-semibold text-gray-600 bg-gray-100 pressable">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={credit.clientName ?? "C"} size="lg" />
          <div>
            <div className="text-base font-bold text-gray-900">{credit.clientName ?? `Cliente #${credit.clientId}`}</div>
            <div className="text-xs text-gray-400">Crédito #{credit.id}</div>
          </div>
        </div>
        <button onClick={() => setEditMode(e => !e)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold pressable"
          style={{ background: editMode ? "var(--surface-3)" : "var(--surface-3)", color: editMode ? "#dc2626" : "#215DFF" }}>
          {editMode ? "✕ Cancelar" : "✏️ Editar condiciones"}
        </button>
      </div>

      {credit.status === "needs_info" && credit.notes && (
        <div style={{ background: "var(--warning-bg)", border: "1px solid #fde68a", borderRadius: 14, padding: "12px 16px" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>Información solicitada anteriormente</div>
          <div className="text-sm" style={{ color: "#b45309" }}>{credit.notes}</div>
        </div>
      )}

      {editMode ? (
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--surface-3)", border: "1.5px solid var(--surface-3)" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#1d4ed8" }}>Ajustar condiciones</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Monto ($)</div>
              <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                className="input-field text-sm w-full" min="500" max="100000" step="100" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Plazo (semanas)</div>
              <input type="number" value={editTerm} onChange={e => setEditTerm(e.target.value)}
                className="input-field text-sm w-full" min="1" max="104" step="1" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Tasa interés (%)</div>
              <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)}
                className="input-field text-sm w-full" min="0" max="300" step="0.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Comisión ($)</div>
              <input type="number" value={editComm} onChange={e => setEditComm(e.target.value)}
                className="input-field text-sm w-full" min="0" step="50" />
            </div>
            <div className="col-span-2">
              <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Fecha inicio / desembolso</div>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                className="input-field text-sm w-full" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 grid grid-cols-4 gap-2 text-center" style={{ border: "1px solid rgba(33,93,255,0.10)" }}>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Entrega</div>
              <div className="text-sm font-extrabold text-green-600">{fmt(delivers)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Pago/sem</div>
              <div className="text-sm font-extrabold text-blue-700">{fmt(weekly)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Intereses</div>
              <div className="text-sm font-extrabold text-amber-600">{fmt(calcInterest)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Total</div>
              <div className="text-sm font-extrabold text-gray-800">{fmt(totalRepay)}</div>
            </div>
          </div>
          {editError && <div className="text-xs text-red-600 font-semibold">{editError}</div>}
          <button onClick={saveConditions} disabled={savingEdit || amt <= 0 || weeks <= 0}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-bold pressable"
            style={{ background: savingEdit ? "#9ca3af" : "linear-gradient(135deg,#215DFF,#3b82f6)" }}>
            <IconLoader size={16} style={{ display: savingEdit ? "block" : "none" }} />
            {savingEdit ? "Guardando..." : "💾 Guardar cambios"}
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-0">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resumen financiero</div>
          {[
            { label: "Monto prestado", val: fmt(credit.amount), color: "#111" },
            { label: "Intereses",      val: fmt(credit.totalToRepay - credit.amount), color: "#d97706" },
            { label: "Total a pagar",  val: fmt(credit.totalToRepay), color: "var(--brand-blue)", bold: true },
            { label: "Pago semanal",   val: fmt(credit.weeklyPayment), color: "#215DFF" },
            { label: "Plazo",          val: `${credit.termWeeks} semanas`, color: "#111" },
            ...((credit as any).openingFee > 0 ? [{ label: "Comisión", val: fmt((credit as any).openingFee), color: "#6b7280" }] : []),
            ...(credit.executiveName ? [{ label: "Asesor", val: credit.executiveName, color: "#111" }] : []),
            { label: "Solicitud", val: fmtDateTime(credit.createdAt), color: "#6b7280" },
          ].map((r: any) => (
            <div key={r.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className="text-sm" style={{ fontWeight: r.bold ? 900 : 700, color: r.color, fontSize: r.bold ? 17 : 13 }}>{r.val}</span>
            </div>
          ))}
        </div>
      )}

      <AdminMensajesSection clientId={credit.clientId} />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">
          Notas <span className="font-normal text-gray-400">(requerido para solicitar información)</span>
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Motivo de decisión o información que requieres del cliente…"
          className="input-field text-sm" rows={3} style={{ resize: "none" }} />
      </div>

      <button onClick={() => setConfirm("approve")}
        className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
        style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
        <IconCheck size={16} /> Aprobar crédito — {fmt(editMode ? amt : credit.amount)}
      </button>

      <button onClick={() => { if (!notes.trim()) return; mut.mutate({ action: "needs_info", n: notes }); }}
        disabled={mut.isPending || !notes.trim()}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold pressable"
        style={{ background: notes.trim() ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "#e5e7eb", color: notes.trim() ? "#451a03" : "#9ca3af", border: "none" }}>
        {mut.isPending ? <IconLoader size={16} /> : <IconDocumento size={16} />}
        Solicitar información al cliente
      </button>

      <button onClick={() => setConfirm("reject")}
        className="py-3 text-sm font-semibold text-red-500 pressable rounded-2xl border border-red-100"
        style={{ background: "var(--danger-bg)" }}>
        Rechazar solicitud
      </button>
    </div>
  );
}



// ─── Admin Mensajes Section ───────────────────────────────────────────────────
function AdminMensajesSection({ clientId }: { clientId: number }) {
  const [msg, setMsg] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const qc = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["admin-messages", clientId],
    queryFn: async () => {
      const token = localStorage.getItem("credeti_token");
      const r = await fetch(`/api/notes?clientId=${clientId}&noteType=mensaje_cliente`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) return [];
      const d = await r.json();
      return d.filter((n: any) => n.noteType === "mensaje_cliente");
    },
    refetchInterval: 10_000,
  });

  const sendMsg = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("credeti_token");
      const r = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId,
          noteType: "mensaje_cliente",
          content: msg.trim(),
        }),
      });
      if (r.ok) {
        setMsg("");
        qc.invalidateQueries({ queryKey: ["admin-messages", clientId] });
      }
    } catch {}
    setSending(false);
  };

  const adminName = localStorage.getItem("credeti_user") || "Admin";

  return (
    <div style={{ marginBottom: "24px" }}>
      <h4 style={{ fontWeight: "700", marginBottom: "12px", color: "#1e293b" }}>
        💬 Mensajes con el cliente
      </h4>
      <div style={{
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        maxHeight: "260px",
        overflowY: "auto",
        padding: "12px",
        marginBottom: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "#f8fafc",
      }}>
        {notes.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", fontSize: "14px" }}>
            No hay mensajes aún
          </p>
        ) : (
          notes.map((n: any) => {
            const isAdmin = n.authorName === adminName || n.authorId !== null;
            return (
              <div key={n.id} style={{
                display: "flex",
                justifyContent: isAdmin ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  background: isAdmin ? "#3b82f6" : "#e2e8f0",
                  color: isAdmin ? "white" : "#1e293b",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  maxWidth: "75%",
                  fontSize: "13px",
                }}>
                  <div style={{ fontWeight: "600", fontSize: "11px", marginBottom: "2px", opacity: 0.8 }}>
                    {n.authorName || "Sistema"}
                  </div>
                  {n.content}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()}
          placeholder="Escribe un mensaje al cliente..."
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={sendMsg}
          disabled={sending || !msg.trim()}
          style={{
            background: sending ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

// ─── Public app detail ────────────────────────────────────────────────────────
function reqStatusMeta(st: string): { label: string; bg: string; color: string; border: string } {
  switch (st) {
    case "approved":  return { label: "Aprobada",   bg: "var(--surface-3)", color: "#059669", border: "var(--surface-3)" };
    case "rejected":  return { label: "Rechazada",  bg: "var(--surface-3)", color: "#dc2626", border: "var(--surface-3)" };
    case "contacted": return { label: "Contactado", bg: "var(--surface-3)", color: "#2563eb", border: "var(--surface-3)" };
    default:          return { label: "Pendiente",  bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  }
}

function PublicAppDetail({ app, onDone }: { app: PublicApp; onDone?: () => void }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<"approved" | "rejected" | null>(null);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    curp: "", address: "", altPhone: "", occupation: "", monthlyIncome: "",
    requestedAmount: "", termWeeks: "", purpose: "", payDay: "", paymentFrequency: "",
    interestRate: "", commission: "", disbursement: "", weeklyPayment: "", totalToRepay: "",
    bankName: "", clabe: "", accountHolder: "",
    references: [] as Array<{ name: string; phone: string; relation: string }>,
    guarantorName: "", guarantorPhone: "", guarantorRelation: "", guarantorAddress: "",
  });

  const { data: detail } = useQuery({
    queryKey: ["public-request", app.id],
    queryFn: async () => {
      const r = await fetch(`${API}/public/requests/${app.id}`, { headers: auth() });
      if (!r.ok) throw new Error("error");
      return r.json() as Promise<{ request: { status: string; name: string; phone: string; email: string | null; message: string }; comments: Array<{ id: number; author_name: string; comment: string; notified: boolean; created_at: string }> }>;
    },
  });
  const comments = detail?.comments ?? [];
  const reqStatus = detail?.request?.status ?? "pending";
  const assignedName = (detail?.request as any)?.assignedName ?? null;
  const assignedTo = (detail?.request as any)?.assigned_to ?? null;
  const { data: staff = [] } = useQuery<any[]>({ queryKey: ["staff"], queryFn: () => fetch(`${API}/users`, { headers: auth() }).then(r => r.ok ? r.json() : []), staleTime: 60000 });
  const assignableStaff = (staff as any[]).filter(u => (u.role === "admin" || u.role === "executive") && u.isActive);

  const decisionM = useMutation({
    mutationFn: async (v: { decision: string; comment?: string }) => {
      const r = await fetch(`${API}/public/requests/${app.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(v) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error"); return d;
    },
    onSuccess: () => { setConfirm(null); setComment(""); qc.invalidateQueries({ queryKey: ["public-request", app.id] }); qc.invalidateQueries({ queryKey: ["public-requests"] }); },
  });
  const commentM = useMutation({
    mutationFn: async (v: { comment: string; notify: boolean }) => {
      const r = await fetch(`${API}/public/requests/${app.id}/comment`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(v) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error"); return d;
    },
    onSuccess: () => { setNote(""); qc.invalidateQueries({ queryKey: ["public-request", app.id] }); },
  });
  const convertM = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/public/requests/${app.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: "{}" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Error al convertir");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-requests"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["credits-pending-dashboard"] });
      qc.invalidateQueries(); // refrescar todo para que aparezca en pestaña Pendientes
    },
  });
  const detailsM = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await fetch(`${API}/public/requests/${app.id}/details`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(body) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error al guardar"); return d;
    },
    onSuccess: () => { setEditing(false); qc.invalidateQueries({ queryKey: ["public-request", app.id] }); qc.invalidateQueries({ queryKey: ["public-requests"] }); },
  });
  const assignM = useMutation({
    mutationFn: async (v: { userId?: number | null; mine?: boolean }) => {
      const r = await fetch(`${API}/public/requests/${app.id}/assign`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(v) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error"); return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-request", app.id] }); qc.invalidateQueries({ queryKey: ["public-requests"] }); },
  });

  const reqData = detail?.request;
  const dName = reqData?.name ?? app.name;
  const dPhone = reqData?.phone ?? app.phone;
  const dEmail = reqData?.email ?? app.email;
  const parsed = parseApp({ ...app, message: reqData?.message ?? app.message } as PublicApp);
  const info: any   = parsed?.personalInfo ?? {};
  const gtor: any   = parsed?.guarantor    ?? {};
  const credit: any = parsed?.creditRequest ?? {};
  const bank: any   = credit?.bankInfo ?? {};
  const refs: Array<any> = Array.isArray(parsed?.references) ? parsed.references : [];
  const docsMeta: any = parsed?.documents ?? {};
  const refNum = `HC-${String(app.id).padStart(5, "0")}`;

  // ── payment capacity ──
  const income = Number(info.monthlyIncome) || 0;
  const weekly = Number(credit.weeklyPayment ?? credit.perInstallment ?? 0) || 0;
  const monthlyBurden = weekly * 4.33;
  const pct = income > 0 && weekly > 0 ? Math.round((monthlyBurden / income) * 100) : null;
  const capColor = pct == null ? "#9ca3af" : pct < 30 ? "#059669" : pct <= 50 ? "#d97706" : "#dc2626";
  const capBg = pct == null ? "#f3f4f6" : pct < 30 ? "var(--surface-3)" : pct <= 50 ? "#fffbeb" : "var(--surface-3)";
  const capLabel = pct == null ? "Sin datos" : pct < 30 ? "Saludable" : pct <= 50 ? "Ajustado" : "Riesgo alto";

  // ── inconsistency alerts ──
  const docsOk = ["ine_front", "ine_back", "curp_doc", "domicilio", "ingresos"].filter(k => docsMeta[k]?.provided).length;
  const alerts: string[] = [];
  if (docsOk === 0) alerts.push("Sin documentos cargados");
  if (!dEmail) alerts.push("Sin correo (no se le puede avisar por mail)");
  if (!info.monthlyIncome) alerts.push("Falta ingreso mensual para evaluar capacidad");
  if (bank.clabe && String(bank.clabe).replace(/\D/g, "").length !== 18) alerts.push("CLABE no tiene 18 digitos");
  if (pct != null && pct > 50) alerts.push(`El pago compromete ${pct}% del ingreso (alto)`);
  if (!refs.length) alerts.push("Sin referencias");

  const startEdit = () => {
    setForm({
      name: dName ?? "", phone: dPhone ?? "", email: dEmail ?? "",
      curp: info.curp ?? "", address: info.address ?? "", altPhone: info.altPhone ?? "",
      occupation: info.occupation ?? "", monthlyIncome: String(info.monthlyIncome ?? ""),
      requestedAmount: String(credit.requestedAmount ?? ""), termWeeks: String(credit.termWeeks ?? ""),
      purpose: credit.purpose ?? "", payDay: credit.payDay ?? "", paymentFrequency: credit.paymentFrequency ?? "",
      interestRate: String(credit.interestRate ?? ""), commission: String(credit.commission ?? ""),
      disbursement: String(credit.disbursement ?? ""), weeklyPayment: String(credit.weeklyPayment ?? credit.perInstallment ?? ""),
      totalToRepay: String(credit.totalToRepay ?? credit.totalPayment ?? ""),
      bankName: bank.bankName ?? "", clabe: bank.clabe ?? "", accountHolder: bank.accountHolder ?? "",
      references: refs.length ? refs.map(r => ({ name: r.name ?? "", phone: r.phone ?? "", relation: r.relation ?? "" })) : [{ name: "", phone: "", relation: "" }],
      guarantorName: gtor.name ?? "", guarantorPhone: gtor.phone ?? "", guarantorRelation: gtor.relation ?? "", guarantorAddress: gtor.address ?? "",
    });
    setEditing(true);
  };

  const DOCS = [
    { key: "ine_front", label: "INE frente" },
    { key: "ine_back", label: "INE reverso" },
    { key: "curp_doc", label: "CURP" },
    { key: "domicilio", label: "Comprobante domicilio" },
    { key: "ingresos", label: "Comprobante ingresos" },
  ];
  const missingDocs = DOCS.filter(d => !docsMeta[d.key]?.provided);
  const docM = useMutation({
    mutationFn: async (v: { doc: string; validated: boolean }) => {
      const r = await fetch(`${API}/public/requests/${app.id}/doc-status`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(v) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error"); return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-request", app.id] }),
  });
  const requestDocsM = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/public/requests/${app.id}/request-docs`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify({ missing: missingDocs.map(d => d.label) }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Error"); return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-request", app.id] }),
  });

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const inp = (label: string, key: string, num = false) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 shrink-0 w-24">{label}:</span>
      <input value={String((form as any)[key] ?? "")} onChange={e => setF(key, e.target.value)} inputMode={num ? "decimal" : undefined} className="flex-1 min-w-0 bg-white rounded-lg px-2 py-1 text-gray-800 font-medium" style={{ border: "1.5px solid #e5e7eb", outline: "none" }} />
    </div>
  );
  const kv = (label: string, val: any, mono = false) => (
    <div className="flex justify-between gap-3 text-sm py-0.5">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={"font-medium text-gray-800 text-right " + (mono ? "font-mono text-xs" : "")}>{(val === 0 || val) ? String(val) : "\u2014"}</span>
    </div>
  );
  const cardHdr = (t: string) => <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t}</div>;

  const saveAll = () => detailsM.mutate({
    name: form.name, phone: form.phone, email: form.email,
    personalInfo: { curp: form.curp, address: form.address, altPhone: form.altPhone, occupation: form.occupation, monthlyIncome: form.monthlyIncome },
    creditRequest: {
      requestedAmount: form.requestedAmount, termWeeks: form.termWeeks, purpose: form.purpose,
      payDay: form.payDay, paymentFrequency: form.paymentFrequency, interestRate: form.interestRate,
      commission: form.commission, disbursement: form.disbursement, weeklyPayment: form.weeklyPayment, totalToRepay: form.totalToRepay,
      bankInfo: { bankName: form.bankName, clabe: form.clabe, accountHolder: form.accountHolder },
    },
    references: form.references.filter(r => r.name || r.phone),
    guarantor: { name: form.guarantorName, phone: form.guarantorPhone, relation: form.guarantorRelation, address: form.guarantorAddress },
  });

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar name={dName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-gray-900">{dName}</div>
          <div className="text-sm text-gray-500">{dPhone}</div>
          <div className="text-xs text-gray-400">Ref: <strong>{refNum}</strong> {"\u00b7"} {fmtDateTime(app.createdAt)}</div>
        </div>
        <button onClick={() => (editing ? setEditing(false) : startEdit())} className="pressable shrink-0" style={{ padding: "7px 12px", borderRadius: 12, border: "1.5px solid rgba(33,93,255,0.10)", background: editing ? "var(--surface-3)" : "#fff", color: "#215DFF", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{editing ? "Cerrar" : "\u270f\ufe0f Editar datos"}</button>
      </div>

      {/* Asignacion */}
      <div className="rounded-2xl p-3 flex items-center gap-2 flex-wrap" style={{ background: "#fff", border: "1.5px solid #e5e7eb" }}>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Asignada a</span>
        <span className="text-sm font-semibold" style={{ color: assignedName ? "#0f172a" : "#9ca3af" }}>{assignedName ?? "Sin asignar"}</span>
        <div className="flex items-center gap-2 ml-auto">
          <select value={assignedTo ?? ""} onChange={e => assignM.mutate({ userId: e.target.value === "" ? null : Number(e.target.value) })} disabled={assignM.isPending} className="text-xs rounded-lg px-2 py-1" style={{ border: "1.5px solid #e5e7eb", background: "#fff", outline: "none", maxWidth: 150 }}>
            <option value="">Sin asignar</option>
            {assignableStaff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <button onClick={() => assignM.mutate({ mine: true })} disabled={assignM.isPending} className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ color: "#215DFF", background: "var(--surface-3)", border: "1px solid var(--surface-3)", cursor: "pointer" }}>A mí</button>
        </div>
      </div>

      {/* Review: aprobar / rechazar / comentar */}
      {(() => { const m = reqStatusMeta(reqStatus); return (
      <div className="rounded-2xl p-3.5 flex flex-col gap-3" style={{ background: "#fff", border: "1.5px solid #e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Revision</div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>{m.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="pressable" onClick={() => setConfirm(confirm === "approved" ? null : "approved")} style={{ padding: "11px", borderRadius: 14, border: `1.5px solid ${confirm === "approved" ? "#10b981" : "var(--surface-3)"}`, background: confirm === "approved" ? "#10b981" : "var(--surface-3)", color: confirm === "approved" ? "#fff" : "#059669", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{"\u2713"} Aprobar</button>
          <button className="pressable" onClick={() => setConfirm(confirm === "rejected" ? null : "rejected")} style={{ padding: "11px", borderRadius: 14, border: `1.5px solid ${confirm === "rejected" ? "#ef4444" : "var(--surface-3)"}`, background: confirm === "rejected" ? "#ef4444" : "var(--surface-3)", color: confirm === "rejected" ? "#fff" : "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{"\u2715"} Rechazar</button>
        </div>
        {confirm && (
          <div className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: confirm === "approved" ? "var(--surface-3)" : "var(--surface-3)", border: `1.5px solid ${confirm === "approved" ? "var(--surface-3)" : "var(--surface-3)"}` }}>
            <div className="text-sm font-semibold" style={{ color: confirm === "approved" ? "#059669" : "#dc2626" }}>
              {confirm === "approved" ? "\u00bfAprobar esta solicitud?" : "\u00bfRechazar esta solicitud?"}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder={dEmail ? "Comentario para el solicitante (se enviara por correo)" : "Comentario interno (sin correo registrado)"} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", fontSize: 13, resize: "none", outline: "none" }} />
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "9px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button disabled={decisionM.isPending} onClick={() => decisionM.mutate({ decision: confirm, comment: comment.trim() || undefined })} style={{ flex: 1, padding: "9px", borderRadius: 12, border: "none", background: confirm === "approved" ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: decisionM.isPending ? 0.6 : 1 }}>{decisionM.isPending ? "..." : "Confirmar"}</button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2" style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Escribe un comentario para el solicitante..." style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", fontSize: 13, resize: "none", outline: "none" }} />
          <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} /> Avisar al solicitante por correo
          </label>
          {notify && !dEmail && (
            <div className="text-[11px]" style={{ color: "#d97706" }}>Sin correo registrado {"\u2014"} el aviso no se enviara. Contactalo al {dPhone}.</div>
          )}
          <button disabled={!note.trim() || commentM.isPending} onClick={() => commentM.mutate({ comment: note.trim(), notify })} style={{ padding: "10px", borderRadius: 12, border: "none", background: "#215DFF", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!note.trim() || commentM.isPending) ? 0.5 : 1 }}>{commentM.isPending ? "Enviando..." : "Agregar comentario"}</button>
        </div>
        {comments.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Historial</div>
            {comments.map(c => (
              <div key={c.id} className="rounded-xl p-2.5" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
                  <span className="text-[10px] text-gray-400">{fmtDateTime(c.created_at)}</span>
                </div>
                <div className="text-sm text-gray-700" style={{ whiteSpace: "pre-wrap" }}>{c.comment}</div>
                {c.notified && <div className="text-[10px] mt-1" style={{ color: "#059669" }}>{"\u2713"} Avisado por correo</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      ); })()}

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: "#fff7ed", border: "1.5px solid var(--surface-3)" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#c2410c" }}>{"\u26a0\ufe0f"} Revisar antes de aprobar</div>
          <ul className="flex flex-col gap-1">
            {alerts.map((a, i) => <li key={i} className="text-sm" style={{ color: "#9a3412" }}>{"\u2022"} {a}</li>)}
          </ul>
        </div>
      )}

      {/* Capacidad de pago */}
      <div className="rounded-2xl p-3" style={{ background: capBg, border: `1.5px solid ${capColor}33` }}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: capColor }}>Capacidad de pago</div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff", color: capColor, border: `1px solid ${capColor}55` }}>{capLabel}</span>
        </div>
        <div className="flex items-end justify-between mt-1.5">
          <div>
            <div className="text-2xl font-extrabold" style={{ color: capColor }}>{pct == null ? "\u2014" : pct + "%"}</div>
            <div className="text-[11px] text-gray-500">del ingreso mensual</div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Ingreso: <strong>{income ? fmt(income) : "\u2014"}</strong></div>
            <div>Pago/sem: <strong>{weekly ? fmt(weekly) : "\u2014"}</strong></div>
          </div>
        </div>
        {pct != null && (
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: capColor }} />
          </div>
        )}
      </div>

      {/* Monto / Plazo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Monto solicitado</div>
          {editing ? (
            <input type="number" inputMode="decimal" value={form.requestedAmount} onChange={e => setF("requestedAmount", e.target.value)} className="w-full text-center text-xl font-extrabold text-blue-700 bg-white rounded-xl py-1" style={{ border: "1.5px solid var(--surface-3)", outline: "none" }} />
          ) : (
            <div className="text-xl font-extrabold text-blue-700">{fmt(credit.requestedAmount)}</div>
          )}
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Plazo (sem)</div>
          {editing ? (
            <input type="number" inputMode="numeric" value={form.termWeeks} onChange={e => setF("termWeeks", e.target.value)} className="w-full text-center text-base font-bold text-gray-800 bg-white rounded-xl py-1" style={{ border: "1.5px solid #e5e7eb", outline: "none" }} />
          ) : (
            <div className="text-base font-bold text-gray-800">{credit.termWeeks ?? "\u2014"} sem</div>
          )}
        </div>
      </div>

      {/* Datos personales */}
      <div className="flex flex-col gap-1.5 bg-gray-50 rounded-2xl p-3">
        {cardHdr("Datos personales")}
        {editing ? (
          <div className="flex flex-col gap-2">
            {inp("Nombre", "name")}
            {inp("Telefono", "phone")}
            {inp("Correo", "email")}
            {inp("CURP", "curp")}
            {inp("Domicilio", "address")}
            {inp("Tel. alt.", "altPhone")}
            {inp("Ocupacion", "occupation")}
            {inp("Ingreso mensual", "monthlyIncome", true)}
            {inp("Destino", "purpose")}
          </div>
        ) : (
          <>
            {kv("CURP", info.curp || "No proporcionado")}
            {kv("Domicilio", info.address)}
            {kv("Tel. alt.", info.altPhone)}
            {kv("Ocupacion", info.occupation)}
            {kv("Ingreso mensual", info.monthlyIncome ? fmt(Number(info.monthlyIncome)) : null)}
            {kv("Destino", credit.purpose)}
          </>
        )}
      </div>

      {/* Condiciones financieras */}
      <div className="flex flex-col gap-1.5 bg-gray-50 rounded-2xl p-3">
        {cardHdr("Condiciones financieras")}
        {editing ? (
          <div className="flex flex-col gap-2">
            {inp("Tasa", "interestRate", true)}
            {inp("Comision", "commission", true)}
            {inp("A entregar", "disbursement", true)}
            {inp("Pago/sem", "weeklyPayment", true)}
            {inp("Total a pagar", "totalToRepay", true)}
            {inp("Dia de pago", "payDay")}
            {inp("Frecuencia", "paymentFrequency")}
          </div>
        ) : (
          <>
            {kv("Tasa", credit.interestRate != null ? `${(Number(credit.interestRate) * 100).toFixed(1)}%` : null)}
            {kv("Comision", credit.commission != null ? fmt(Number(credit.commission)) : null)}
            {kv("A entregar", credit.disbursement != null ? fmt(Number(credit.disbursement)) : null)}
            {kv("Pago/sem", weekly ? fmt(weekly) : null)}
            {kv("Total a pagar", (credit.totalToRepay ?? credit.totalPayment) != null ? fmt(Number(credit.totalToRepay ?? credit.totalPayment)) : null)}
            {kv("Dia de pago", credit.payDay)}
            {kv("Frecuencia", credit.paymentFrequency)}
          </>
        )}
      </div>

      {/* Banco */}
      <div className="flex flex-col gap-1.5 bg-blue-50 rounded-2xl p-3">
        {cardHdr("Datos bancarios")}
        {editing ? (
          <div className="flex flex-col gap-2">
            {inp("Banco", "bankName")}
            {inp("CLABE", "clabe")}
            {inp("Titular", "accountHolder")}
          </div>
        ) : (
          <>
            {kv("Banco", bank.bankName)}
            {kv("CLABE", bank.clabe, true)}
            {kv("Titular", bank.accountHolder)}
          </>
        )}
      </div>

      {/* Referencias */}
      <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-3">
        {cardHdr("Referencias")}
        {editing ? (
          <div className="flex flex-col gap-2">
            {form.references.map((r, idx) => (
              <div key={idx} className="rounded-xl p-2 flex flex-col gap-1.5" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">Referencia {idx + 1}</span>
                  <button onClick={() => setForm(f => ({ ...f, references: f.references.filter((_, i) => i !== idx) }))} className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>Quitar</button>
                </div>
                <input value={r.name} onChange={e => setForm(f => ({ ...f, references: f.references.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} placeholder="Nombre" className="bg-white rounded-lg px-2 py-1 text-sm" style={{ border: "1.5px solid #e5e7eb", outline: "none" }} />
                <div className="flex gap-1.5">
                  <input value={r.phone} onChange={e => setForm(f => ({ ...f, references: f.references.map((x, i) => i === idx ? { ...x, phone: e.target.value } : x) }))} placeholder="Telefono" className="flex-1 min-w-0 bg-white rounded-lg px-2 py-1 text-sm" style={{ border: "1.5px solid #e5e7eb", outline: "none" }} />
                  <input value={r.relation} onChange={e => setForm(f => ({ ...f, references: f.references.map((x, i) => i === idx ? { ...x, relation: e.target.value } : x) }))} placeholder="Relacion" className="flex-1 min-w-0 bg-white rounded-lg px-2 py-1 text-sm" style={{ border: "1.5px solid #e5e7eb", outline: "none" }} />
                </div>
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, references: [...f.references, { name: "", phone: "", relation: "" }] }))} className="text-sm font-semibold py-1.5 rounded-lg" style={{ color: "#215DFF", background: "var(--surface-3)", border: "1px dashed var(--surface-3)" }}>+ Agregar referencia</button>
          </div>
        ) : (
          refs.length ? refs.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span>{"\ud83d\udc65"}</span>
              <div>
                <div className="font-medium text-gray-800">{r.name || "\u2014"} {r.relation ? <span className="text-gray-400 text-xs">{"\u00b7"} {r.relation}</span> : null}</div>
                {r.phone && <div className="text-xs text-gray-500">{r.phone}</div>}
              </div>
            </div>
          )) : <div className="text-sm text-gray-400">Sin referencias</div>
        )}
      </div>

      {/* Aval */}
      <div className="flex flex-col gap-1.5 bg-gray-50 rounded-2xl p-3">
        {cardHdr("Aval / garante")}
        {editing ? (
          <div className="flex flex-col gap-2">
            {inp("Nombre", "guarantorName")}
            {inp("Telefono", "guarantorPhone")}
            {inp("Relacion", "guarantorRelation")}
            {inp("Domicilio", "guarantorAddress")}
          </div>
        ) : (
          (gtor.name || gtor.phone) ? (
            <>
              {kv("Nombre", gtor.name)}
              {kv("Telefono", gtor.phone)}
              {kv("Relacion", gtor.relation)}
              {kv("Domicilio", gtor.address)}
            </>
          ) : <div className="text-sm text-gray-400">Sin aval registrado</div>
        )}
      </div>

      {/* Save bar */}
      {editing && (
        <div className="flex flex-col gap-2 sticky bottom-0 pb-1" style={{ background: "linear-gradient(to top, #fff 70%, transparent)" }}>
          {detailsM.isError && <div className="text-xs text-center" style={{ color: "#dc2626" }}>{(detailsM.error as Error).message}</div>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1" style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
            <button disabled={detailsM.isPending} onClick={saveAll} className="flex-1" style={{ padding: "12px", borderRadius: 12, border: "none", background: "#215DFF", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: detailsM.isPending ? 0.6 : 1 }}>{detailsM.isPending ? "Guardando..." : "Guardar todo"}</button>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-gray-50 rounded-2xl p-3">
        {cardHdr("Documentos")}
        <div className="flex flex-col gap-2">
          {DOCS.map(d => {
            const meta = docsMeta[d.key] ?? {};
            return (
              <div key={d.key} className="flex items-center justify-between text-sm gap-2">
                <span className="text-gray-600 flex-1 min-w-0 truncate">{d.label}</span>
                {meta.provided ? (
                  meta.validated
                    ? <span className="text-green-600 font-semibold text-xs shrink-0">{"\u2713"} Validado</span>
                    : <button onClick={() => docM.mutate({ doc: d.key, validated: true })} disabled={docM.isPending} className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#2563eb", background: "var(--surface-3)", border: "1px solid var(--surface-3)", cursor: "pointer" }}>Validar</button>
                ) : <span className="text-gray-400 text-xs shrink-0">No enviado</span>}
              </div>
            );
          })}
        </div>
        {missingDocs.length > 0 && (
          <button onClick={() => requestDocsM.mutate()} disabled={requestDocsM.isPending || !dEmail} className="w-full mt-2.5 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--surface-3)", color: "#215DFF", border: "1px solid var(--surface-3)", cursor: (!dEmail || requestDocsM.isPending) ? "default" : "pointer", opacity: (!dEmail || requestDocsM.isPending) ? 0.5 : 1 }}>
            {requestDocsM.isPending ? "Enviando..." : dEmail ? `Solicitar ${missingDocs.length} documento(s) faltante(s)` : "Solicitar docs (sin correo)"}
          </button>
        )}
        {requestDocsM.isSuccess && <div className="text-[11px] text-center mt-1.5" style={{ color: "#059669" }}>Solicitud de documentos enviada al cliente.</div>}
      </div>

      {docsMeta && Object.entries(docsMeta).some(([, v]: any) => v?.preview) && (
        <div>
          {cardHdr("Imagenes")}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(docsMeta).map(([key, val]: any) =>
              val?.preview ? (
                <div key={key} className="rounded-xl overflow-hidden border border-gray-200">
                  <img src={val.preview} alt={key} className="w-full h-24 object-cover" />
                  <div className="text-[10px] text-center text-gray-500 py-1 bg-gray-50">{key.replace("_", " ")}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        {parsed?.creditId ? (
          <div className="rounded-2xl p-3 text-center text-sm font-semibold"
            style={{ background: "var(--success-bg)", color: "#059669", border: "1.5px solid var(--surface-3)" }}>
            ✓ Convertida — crédito #{parsed.creditId} en revisión
          </div>
        ) : (
          <button
            className="pressable"
            disabled={convertM.isPending}
            onClick={() => convertM.mutate()}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: "#fff",
              background: convertM.isPending ? "#9ca3af" : "linear-gradient(135deg,#059669,#10b981)",
              opacity: convertM.isPending ? 0.7 : 1 }}
          >
            {convertM.isPending ? "Creando expediente..." : "✓ Enviar a revisión — crear crédito pendiente"}
          </button>
        )}
        {convertM.isError && (
          <div className="text-xs text-center" style={{ color: "#dc2626" }}>
            {(convertM.error as Error).message}
          </div>
        )}
        <a
          href={`tel:${dPhone}`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 pressable"
        >
          <IconTelefono size={14} /> Llamar a {info.fullName?.split(" ")[0] ?? dName}
        </a>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = "pending" | "needs_info" | "history" | "public";

export default function AdminSolicitudes() {
  const [tab, setTab]           = useState<Tab>("pending");
  const [selected, setSelected] = useState<{ data: PublicApp | PendingCredit; isPublic: boolean } | null>(null);

  const { data: publicApps = [], isLoading: loadingPublic } = useQuery<PublicApp[]>({
    queryKey: ["public-requests"],
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
    queryFn: () => fetch(`${API}/public/requests`, { headers: auth() }).then(r => r.json()),
  });

  // Pendientes de aprobación
  const { data: pendingCredits = [], isLoading: loadingPending } = useQuery<PendingCredit[]>({
    queryKey: ["credits", "pending-only"],
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
    queryFn: () => fetch(`${API}/credits?status=pending`, { headers: auth() }).then(r => r.json())
      .then((d: any[]) => d.map(r => ({
        ...r,
        clientName: r.clientName ?? `Cliente #${r.clientId}`,
        executiveName: r.executiveName ?? null,
        totalToRepay: r.totalToRepay ?? r.weeklyPayment * r.termWeeks,
      }))),
  });

  // Falta info
  const { data: needsInfoCredits = [], isLoading: loadingNeedsInfo } = useQuery<PendingCredit[]>({
    queryKey: ["credits", "needs_info"],
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
    queryFn: () => fetch(`${API}/credits?status=needs_info`, { headers: auth() }).then(r => r.json())
      .then((d: any[]) => d.map(r => ({
        ...r,
        clientName: r.clientName ?? `Cliente #${r.clientId}`,
        executiveName: r.executiveName ?? null,
        totalToRepay: r.totalToRepay ?? r.weeklyPayment * r.termWeeks,
      }))),
  });

  // Historial (aprobados + rechazados)
  const { data: historyCredits = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["credits", "history"],
    queryFn: async () => {
      const [approved, rejected] = await Promise.all([
        fetch(`${API}/credits?status=active`,   { headers: auth() }).then(r => r.json()),
        fetch(`${API}/credits?status=rejected`, { headers: auth() }).then(r => r.json()),
      ]);
      return [
        ...(Array.isArray(approved)  ? approved  : []).map((c: any) => ({ ...c, decision: "approved" })),
        ...(Array.isArray(rejected)  ? rejected  : []).map((c: any) => ({ ...c, decision: "rejected" })),
      ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
       .slice(0, 50);
    },
    staleTime: 60_000,
    enabled: tab === "history",
  });

  const pendingOnly   = pendingCredits  as PendingCredit[];
  const needsInfoOnly = needsInfoCredits as PendingCredit[];
  const totalCredits  = pendingOnly.length + needsInfoOnly.length;

  const publicFiltered = (publicApps as PublicApp[]).filter(a => {
    try { const d = JSON.parse(a.message); return d.type === "credit_application"; } catch { return true; }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-8">

        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingOnly.length + needsInfoOnly.length} por aprobar · {publicFiltered.length} afiliaciones
          </p>
        </div>

        {/* Stats strip */}
        <StatsStrip pending={pendingOnly} needsInfo={needsInfoOnly} />

        {/* Tabs */}
        <div className="px-4 flex gap-2 flex-wrap">
          {[
            { key: "pending",    label: `Pendientes (${pendingOnly.length})` },
            { key: "needs_info", label: `Falta info (${needsInfoOnly.length})` },
            { key: "history",    label: "Historial" },
            { key: "public",     label: `Públicas (${publicFiltered.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all pressable ${tab === t.key ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={tab === t.key ? { background: "var(--accent)" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending tab */}
        {tab === "pending" && (
          loadingPending ? <div className="px-4"><SkeletonList count={3} /></div> :
          pendingOnly.length === 0 ? (
            <div className="px-4">
              <EmptyState icon={<IconCheck size={18} />} title="¡Todo aprobado!" description="No hay créditos pendientes de revisión." />
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {pendingOnly.map((c: PendingCredit) => (
                <CreditCard key={c.id} credit={c} onClick={() => setSelected({ data: c, isPublic: false })} />
              ))}
            </div>
          )
        )}

        {/* Needs info tab */}
        {tab === "needs_info" && (
          loadingNeedsInfo ? <div className="px-4"><SkeletonList count={3} /></div> :
          needsInfoOnly.length === 0 ? (
            <div className="px-4">
              <EmptyState icon={<IconDocumento size={18} />} title="Sin pendientes" description="No hay créditos esperando información." />
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {needsInfoOnly.map((c: PendingCredit) => (
                <CreditCard key={c.id} credit={c} onClick={() => setSelected({ data: c, isPublic: false })} />
              ))}
            </div>
          )
        )}

        {/* History tab */}
        {tab === "history" && (
          loadingHistory ? <div className="px-4"><SkeletonList count={5} /></div> :
          (historyCredits as any[]).length === 0 ? (
            <div className="px-4">
              <EmptyState icon={<IconDocumento size={18} />} title="Sin historial" description="Aún no hay créditos aprobados o rechazados." />
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {(historyCredits as any[]).map((credit: any) => {
                const approved = credit.decision === "approved";
                return (
                  <div key={credit.id} className="card" style={{ borderLeft: `4px solid ${approved ? "#10b981" : "#ef4444"}` }}>
                    <div className="flex items-center gap-3">
                      <Avatar name={credit.clientName ?? "C"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{credit.clientName ?? `Cliente #${credit.clientId}`}</div>
                        <div className="text-xs text-gray-400">{new Date(credit.createdAt).toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-extrabold" style={{ color: approved ? "#059669" : "#dc2626" }}>
                          {new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(credit.amount)}
                        </div>
                        <Badge variant={approved ? "success" : "danger"} size="sm">
                          {approved ? "Aprobado" : "Rechazado"}
                        </Badge>
                      </div>
                    </div>
                    {credit.notes && (
                      <div className="mt-2 text-xs text-gray-500 italic truncate">"{credit.notes}"</div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Public tab */}
        {tab === "public" && (
          loadingPublic ? <div className="px-4"><SkeletonList count={4} /></div> :
          publicFiltered.length === 0 ? (
            <div className="px-4">
              <EmptyState icon={<IconBandeja size={18} />} title="Sin afiliaciones" description="Aún no hay solicitudes públicas recibidas." />
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {publicFiltered.slice().reverse().map((app: PublicApp) => {
                const parsed = parseApp(app);
                const info   = parsed?.personalInfo ?? {};
                const credit = parsed?.creditRequest ?? {};
                return (
                  <div
                    key={app.id}
                    className="card pressable"
                    onClick={() => setSelected({ data: app, isPublic: true })}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={app.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{app.name}</div>
                        <div className="text-xs text-gray-500">{app.phone}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-extrabold text-blue-700">{fmt(credit.requestedAmount)}</div>
                        {(() => { const m = reqStatusMeta(app.status ?? "pending"); return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>{m.label}</span>; })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Plazo</div>
                        <div className="text-xs font-bold text-gray-800">{credit.termWeeks ?? "—"} sem</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Fecha</div>
                        <div className="text-xs font-bold text-gray-800">
                          {new Date(app.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Docs</div>
                        <div className="text-xs font-bold text-gray-800">
                          {parsed?.documents ? Object.values(parsed.documents).filter((d: any) => d?.provided).length : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.isPublic ? "Afiliación pública" : "Revisión de crédito"}
      >
        {selected?.isPublic
          ? <PublicAppDetail app={selected.data as PublicApp} onDone={() => setSelected(null)} />
          : selected
            ? <CreditDetail
                credit={selected.data as PendingCredit}
                onDone={() => setSelected(null)}
              />
            : null
        }
      </BottomSheet>
    </Layout>
  );
}
