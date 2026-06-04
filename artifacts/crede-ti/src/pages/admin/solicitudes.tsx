import { useState } from "react";
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
  const [notes, setNotes]     = useState(credit.status === "needs_info" ? (credit.notes ?? "") : "");
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);

  const interest = credit.totalToRepay - credit.amount;

  const mut = useMutation({
    mutationFn: ({ action, n }: { action: "approve" | "reject" | "needs_info"; n?: string }) =>
      fetch(`${API}/credits/${credit.id}/review`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: n }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries(); // invalida todo
      onDone();
    },
  });

  const rows = [
    { label: "Monto prestado", val: fmt(credit.amount), color: "#111" },
    { label: "Intereses",      val: fmt(interest),      color: "#d97706" },
    { label: "Total a pagar",  val: fmt(credit.totalToRepay), color: "#1e40af", bold: true },
    { label: "Pago semanal",   val: fmt(credit.weeklyPayment), color: "#215DFF" },
    { label: "Plazo",          val: `${credit.termWeeks} semanas`, color: "#111" },
    ...(credit.executiveName ? [{ label: "Asesor", val: credit.executiveName, color: "#111" }] : []),
    { label: "Solicitud",      val: fmtDateTime(credit.createdAt), color: "#6b7280" },
  ];

  if (confirm) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: confirm === "approve" ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${confirm === "approve" ? "#bbf7d0" : "#fecaca"}` }}
        >
          <div className="text-2xl mb-2">{confirm === "approve" ? "✓" : "✕"}</div>
          <div className="font-bold text-gray-900 text-base mb-1">
            {confirm === "approve" ? "¿Aprobar este crédito?" : "¿Rechazar esta solicitud?"}
          </div>
          <div className="text-sm text-gray-500">
            {confirm === "approve"
              ? `Se activará el crédito de ${fmt(credit.amount)} para ${credit.clientName ?? "el cliente"}.`
              : `Se notificará al cliente que su solicitud fue rechazada.`}
          </div>
        </div>
        {notes && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 italic">"{notes}"</div>
        )}
        <button
          onClick={() => mut.mutate({ action: confirm, n: notes || undefined })}
          disabled={mut.isPending}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
          style={{ background: confirm === "approve" ? "#10b981" : "#ef4444" }}
        >
          {mut.isPending ? <IconLoader size={16} /> : (confirm === "approve" ? <IconCheck size={16} /> : <IconCerrar size={16} />)}
          {confirm === "approve" ? "Sí, aprobar crédito" : "Sí, rechazar solicitud"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          disabled={mut.isPending}
          className="py-3 rounded-2xl text-sm font-semibold text-gray-600 bg-gray-100 pressable"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar name={credit.clientName ?? "C"} size="lg" />
        <div>
          <div className="text-base font-bold text-gray-900">{credit.clientName ?? `Cliente #${credit.clientId}`}</div>
          <div className="text-xs text-gray-400">Crédito #{credit.id}</div>
        </div>
      </div>

      {/* Needs-info banner */}
      {credit.status === "needs_info" && credit.notes && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "12px 16px" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#92400e" }}>
            Información solicitada anteriormente
          </div>
          <div className="text-sm" style={{ color: "#b45309" }}>{credit.notes}</div>
        </div>
      )}

      {/* Financial summary */}
      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-0">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resumen financiero</div>
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{r.label}</span>
            <span
              className="text-sm"
              style={{ fontWeight: (r as any).bold ? 900 : 700, color: r.color, fontSize: (r as any).bold ? 17 : 13 }}
            >
              {r.val}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">
          Notas <span className="font-normal text-gray-400">(requerido para solicitar información)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Motivo de decisión o información que requieres del cliente…"
          className="input-field text-sm"
          rows={3}
          style={{ resize: "none" }}
        />
      </div>

      {/* Actions */}
      <button
        onClick={() => setConfirm("approve")}
        className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
        style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
      >
        <IconCheck size={16} /> Aprobar crédito — {fmt(credit.amount)}
      </button>

      <button
        onClick={() => {
          if (!notes.trim()) return;
          mut.mutate({ action: "needs_info", n: notes });
        }}
        disabled={mut.isPending || !notes.trim()}
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold pressable"
        style={{
          background: notes.trim() ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "#e5e7eb",
          color: notes.trim() ? "#451a03" : "#9ca3af",
          border: "none",
        }}
      >
        {mut.isPending ? <IconLoader size={16} /> : <IconDocumento size={16} />}
        Solicitar información al cliente
      </button>

      <button
        onClick={() => setConfirm("reject")}
        className="py-3 text-sm font-semibold text-red-500 pressable rounded-2xl border border-red-100"
        style={{ background: "#fff5f5" }}
      >
        Rechazar solicitud
      </button>
    </div>
  );
}

// ─── Public app detail ────────────────────────────────────────────────────────
function PublicAppDetail({ app }: { app: PublicApp }) {
  const parsed = parseApp(app);
  const info   = parsed?.personalInfo ?? {};
  const gtor   = parsed?.guarantor    ?? {};
  const credit = parsed?.creditRequest ?? {};
  const docsMeta = parsed?.documents   ?? {};
  const refNum = `HC-${String(app.id).padStart(5, "0")}`;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-3">
        <Avatar name={app.name} size="lg" />
        <div>
          <div className="text-base font-bold text-gray-900">{app.name}</div>
          <div className="text-sm text-gray-500">{app.phone}</div>
          <div className="text-xs text-gray-400">Ref: <strong>{refNum}</strong> · {fmtDateTime(app.createdAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Monto solicitado</div>
          <div className="text-xl font-extrabold text-blue-700">{fmt(credit.requestedAmount)}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Plazo</div>
          <div className="text-base font-bold text-gray-800">{credit.termWeeks ?? "—"} sem</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 bg-gray-50 rounded-2xl p-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Datos personales</div>
        {[
          { icon: "📋", label: "CURP",      val: info.curp || "No proporcionado" },
          { icon: "📍", label: "Domicilio", val: info.address },
          { icon: "📞", label: "Tel. alt.", val: info.altPhone || "—" },
          { icon: "🎯", label: "Destino",   val: credit.purpose },
        ].map(r => (
          <div key={r.label} className="flex items-start gap-2 text-sm py-0.5">
            <span>{r.icon}</span>
            <span className="text-gray-500 shrink-0 w-20">{r.label}:</span>
            <span className="font-medium text-gray-800">{r.val}</span>
          </div>
        ))}
      </div>

      {credit.bankInfo && (
        <div className="bg-blue-50 rounded-2xl p-3">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Datos bancarios</div>
          <div className="flex flex-col gap-1.5">
            {[["Banco", credit.bankInfo.bankName], ["CLABE", credit.bankInfo.clabe], ["Titular", credit.bankInfo.accountHolder]]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-mono font-semibold text-gray-800 text-xs">{v}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documentos</div>
        <div className="flex flex-col gap-2">
          {[
            { key: "ine_front",  label: "INE frente" },
            { key: "ine_back",   label: "INE reverso" },
            { key: "curp_doc",   label: "CURP" },
            { key: "domicilio",  label: "Comprobante domicilio" },
            { key: "ingresos",   label: "Comprobante ingresos" },
          ].map(d => (
            <div key={d.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{d.label}</span>
              {docsMeta[d.key]?.provided
                ? <span className="text-green-600 font-semibold">✓ Cargado</span>
                : <span className="text-gray-400 text-xs">No enviado</span>
              }
            </div>
          ))}
        </div>
      </div>

      {docsMeta && Object.entries(docsMeta).some(([, v]: any) => v?.preview) && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Imágenes</div>
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
        <a
          href={`${basePath}/dashboard/alta-cliente`}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold pressable"
          style={{ background: "linear-gradient(135deg,#3A00C8,#215DFF)" }}
        >
          <IconGrupo size={16} /> Dar de alta al cliente
        </a>
        <a
          href={`tel:${app.phone}`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 pressable"
        >
          <IconTelefono size={14} /> Llamar a {info.fullName?.split(" ")[0] ?? app.name}
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
    queryFn: () => fetch(`${API}/public/requests`, { headers: auth() }).then(r => r.json()),
  });

  // Pendientes de aprobación
  const { data: pendingCredits = [], isLoading: loadingPending } = useQuery<PendingCredit[]>({
    queryKey: ["credits", "pending-only"],
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
                        <Badge variant="warning" size="sm">Nueva</Badge>
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
          ? <PublicAppDetail app={selected.data as PublicApp} />
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
