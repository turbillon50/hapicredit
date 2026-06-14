import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge, statusBadge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  IconAtras, IconTelefono, IconUbicacion, IconPersona,
  IconCheck, IconReloj, IconDocumento, IconAlerta,
  IconMoneda, IconCalendario, IconImagen, IconOjo,
  IconCerrar, IconGrupo,
} from "@/components/hapi/HapiIcons";
import { useState } from "react";
import { Link } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number | string | null | undefined) => {
  const v = parseFloat(String(n ?? "0"));
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
};
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function AdminExpediente() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [docPreview, setDocPreview] = useState<any | null>(null);
  const [showReasignar, setShowReasignar] = useState(false);
  const [showCambiarFecha, setShowCambiarFecha] = useState(false);
  const [newExecId, setNewExecId] = useState<number | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const { data: emailTemplates = [] } = useQuery<{ key: string; label: string; subject: string }[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const r = await fetch(`${API}/email-templates`, { headers: auth() });
      if (!r.ok) return [];
      return r.json();
    },
  });
  const [newDate, setNewDate] = useState("");
  const [showEditCond, setShowEditCond] = useState(false);
  const [cond, setCond] = useState<{ amount: string; termWeeks: string; weeklyPayment: string; totalToRepay: string; remainingBalance: string; notes: string }>({ amount: "", termWeeks: "", weeklyPayment: "", totalToRepay: "", remainingBalance: "", notes: "" });

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ["client", id],
    queryFn: () => fetch(`${API}/clients/${id}`, { headers: auth() }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: executives } = useQuery<any[]>({
    queryKey: ["executives-list"],
    queryFn: () => fetch(`${API}/users?role=executive`, { headers: auth() }).then(r => r.json()),
    enabled: showReasignar,
  });

  const reasignarMut = useMutation({
    mutationFn: async (executiveId: number) => {
      const r = await fetch(`${API}/clients/${id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ executiveId }),
      });
      if (!r.ok) throw new Error("Error al reasignar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      setShowReasignar(false);
      setNewExecId(null);
    },
  });

  const cambiarFechaMut = useMutation({
    mutationFn: async ({ creditId, date }: { creditId: number; date: string }) => {
      const r = await fetch(`${API}/credits/${creditId}/conditions`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ disbursementDate: date }),
      });
      if (!r.ok) throw new Error("Error al cambiar fecha");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      setShowCambiarFecha(false);
      setNewDate("");
    },
  });

  const editCondMut = useMutation({
    mutationFn: async ({ creditId, body }: { creditId: number; body: Record<string, unknown> }) => {
      const r = await fetch(`${API}/credits/${creditId}/conditions`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? "Error al guardar"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      setShowEditCond(false);
    },
  });

  if (isLoading) return (
    <Layout>
      <div className="px-4 py-4"><SkeletonList count={5} /></div>
    </Layout>
  );

  if (!client) return (
    <Layout>
      <div className="px-4 py-6">
        <EmptyState icon={<IconPersona />} title="Cliente no encontrado" description="El expediente no existe." />
      </div>
    </Layout>
  );

  const credits = client.credits ?? [];
  const payments = client.recentPayments ?? client.payments ?? [];
  const allNotes: any[] = client.recentNotes ?? client.notes ?? [];
  const docNotes = allNotes.filter((n: any) => n.noteType === "document");
  const chatNotes = allNotes.filter((n: any) => n.noteType === "mensaje_cliente");
  const notes = allNotes.filter((n: any) => n.noteType !== "document" && n.noteType !== "mensaje_cliente");
  const commitments = client.openCommitments ?? client.commitments ?? [];
  const activeCredit = credits.find((c: any) => c.status === "active");
  const paid = payments.filter((p: any) => p.paymentStatus === "completed" || p.status === "completed").length;
  const total = activeCredit?.termWeeks ?? 0;
  const pct = total > 0 ? (paid / total) * 100 : 0;

  async function sendMsg() {
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const r = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, noteType: "mensaje_cliente", content: msgText.trim() }),
      });
      if (r.ok) {
        setMsgText("");
        queryClient.invalidateQueries({ queryKey: ["client", id] });
      }
    } finally {
      setSendingMsg(false);
    }
  }

  async function sendEmail() {
    if (!emailTemplate || sendingEmail) return;
    setSendingEmail(true);
    setEmailMsg(null);
    try {
      const r = await fetch(`${API}/clients/${client.id}/email`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: emailTemplate, alsoInApp: true }),
      });
      const data = await r.json().catch(() => ({} as any));
      if (r.ok) {
        setEmailMsg(`Correo enviado a ${data.to ?? "el cliente"} y registrado en el chat`);
        setEmailTemplate("");
        queryClient.invalidateQueries({ queryKey: ["client", id] });
      } else {
        setEmailMsg(data.error ?? "No se pudo enviar el correo");
      }
    } catch {
      setEmailMsg("Error de red al enviar");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-6">

        <div className="px-4 pt-4 md:pt-0 flex items-center gap-3">
          <Link href="/admin/cartera">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center pressable">
              <IconAtras size={16} color="#4b5563" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expediente</h1>
            <p className="text-xs text-gray-400">Perfil completo del cliente</p>
          </div>
        </div>

        <div className="mx-4 card">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={client.fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900">{client.fullName}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={statusBadge(client.status).variant} size="sm">
                  {statusBadge(client.status).label}
                </Badge>
                {client.daysOverdue > 0 && (
                  <Badge variant="danger" size="sm">{client.daysOverdue} días de atraso</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <IconTelefono size={14} color="#9ca3af" />
                <a href={`tel:${client.phone}`} className="text-blue-600 font-medium">{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 text-sm">
                <IconUbicacion size={14} color="#9ca3af" className="mt-0.5 shrink-0" />
                <span className="text-gray-600">{client.address}</span>
              </div>
            )}
            {client.curp && (
              <div className="flex items-center gap-2 text-sm">
                <IconPersona size={14} color="#9ca3af" />
                <span className="text-gray-600 font-mono text-xs">{client.curp}</span>
              </div>
            )}
          </div>
        </div>

        {activeCredit && (
          <div className="mx-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">Crédito activo</div>
            <div className="hero-gradient rounded-2xl p-5 text-white">
              <div className="text-3xl font-bold mb-1">{fmt(activeCredit.amount)}</div>
              <div className="text-sm opacity-70 mb-4">Monto del crédito</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Saldo pendiente", fmt(activeCredit.remainingBalance)],
                  ["Pago semanal", fmt(activeCredit.weeklyPayment)],
                  ["Plazo", `${activeCredit.termWeeks} semanas`],
                  ["Próximo pago", fmtDate(activeCredit.nextPaymentDate)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/10 rounded-xl p-2.5">
                    <div className="text-[10px] opacity-60 font-semibold uppercase tracking-wide">{k}</div>
                    <div className="text-sm font-bold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <ProgressBar value={pct} animate height={8} />
              <div className="text-xs opacity-60 mt-1.5">{paid} de {total} pagos realizados</div>
            </div>
          </div>
        )}

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Historial de créditos ({credits.length})
          </div>
          <div className="flex flex-col gap-2">
            {credits.length === 0 ? (
              <EmptyState icon={<IconMoneda />} title="Sin créditos" description="Este cliente no tiene créditos registrados." />
            ) : credits.map((c: any) => {
              const sb = statusBadge(c.status);
              return (
                <div key={c.id} className="card flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{fmt(c.amount)}</div>
                    <div className="text-xs text-gray-500">{c.termWeeks} semanas · {fmtDate(c.startDate)}</div>
                  </div>
                  <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Pagos ({payments.length})
          </div>
          {payments.length === 0 ? (
            <EmptyState icon={<IconCalendario />} title="Sin pagos" description="No hay pagos registrados." />
          ) : (
            <div className="flex flex-col gap-2">
              {payments.slice().reverse().slice(0, 10).map((p: any) => {
                const done = p.status === "completed";
                return (
                  <div key={p.id} className="card flex items-center gap-3 py-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: done ? "#d1fae5" : "#fef3c7", color: done ? "#065f46" : "#92400e" }}
                    >
                      {done ? <IconCheck size={16} /> : <IconReloj size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{fmt(p.amountPaid)}</div>
                      <div className="text-xs text-gray-500">
                        {p.paymentDate ? fmtDate(p.paymentDate) : "Pendiente"}
                      </div>
                    </div>
                    <Badge variant={done ? "success" : "warning"} size="sm">
                      {done ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>
                );
              })}
              {payments.length > 10 && (
                <div className="text-xs text-center text-gray-400 py-1">
                  +{payments.length - 10} pagos adicionales
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentos del expediente */}
        {docNotes.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Documentos cargados ({docNotes.length})
            </div>
            <div className="grid grid-cols-2 gap-3">
              {docNotes.map((n: any) => {
                let parsed: any = null;
                try { parsed = JSON.parse(n.content); } catch {}
                if (!parsed) return null;
                const isImage = parsed.mimeType?.startsWith("image/");
                return (
                  <div
                    key={n.id}
                    className="card p-0 overflow-hidden cursor-pointer pressable"
                    onClick={() => isImage && setDocPreview(parsed)}
                  >
                    {isImage ? (
                      <img
                        src={`data:${parsed.mimeType};base64,${parsed.base64}`}
                        alt={parsed.label}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <IconDocumento size={28} color="#9ca3af" />
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <div className="text-xs font-semibold text-gray-800 truncate">{parsed.label}</div>
                      <div className="text-[10px] text-gray-400">
                        {n.authorName ?? "Cliente"} · {fmtDate(parsed.uploadedAt?.split("T")[0])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -- Correo precargado al cliente (Resend) -- */}
        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Enviar correo al cliente
          </div>
          <div className="card" style={{ padding: 12 }}>
            <select
              value={emailTemplate}
              onChange={e => { setEmailTemplate(e.target.value); setEmailMsg(null); }}
              style={{ width: "100%", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", fontSize: 14, padding: "9px 12px", outline: "none", marginBottom: 8 }}
            >
              <option value="">Elige un mensaje precargado...</option>
              {emailTemplates.map(t => (<option key={t.key} value={t.key}>{t.label}</option>))}
            </select>
            <button
              onClick={sendEmail}
              disabled={!emailTemplate || sendingEmail}
              style={{ width: "100%", borderRadius: 10, border: "none", cursor: emailTemplate && !sendingEmail ? "pointer" : "default", background: emailTemplate && !sendingEmail ? "var(--accent)" : "var(--border)", color: emailTemplate && !sendingEmail ? "#fff" : "var(--text-muted)", padding: "10px 14px", fontWeight: 700, fontSize: 14 }}
            >
              {sendingEmail ? "Enviando..." : "Enviar correo + registrar en chat"}
            </button>
            {emailMsg && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 8, textAlign: "center" }}>{emailMsg}</div>}
          </div>
        </div>

        {/* ── Chat con cliente ──────────────────────────────────── */}
        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Mensajes con cliente
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Thread */}
            <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {chatNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Sin mensajes — inicia la conversación
                </div>
              ) : (
                chatNotes.map((n: any) => {
                  const isAdmin = n.isFromClient != null ? !n.isFromClient : (n.authorName && n.authorName !== client.fullName);
                  return (
                    <div key={n.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%", padding: "9px 13px",
                        borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isAdmin ? "var(--accent)" : "var(--surface-2)",
                        color: isAdmin ? "#fff" : "var(--text-primary)",
                        fontSize: 14, lineHeight: 1.5,
                      }}>
                        {n.content}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                        {isAdmin ? (n.authorName ?? "Asesor") : client.fullName} · {new Date(n.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Input */}
            <div style={{ borderTop: "1px solid var(--border)", display: "flex", gap: 8, padding: "10px 12px" }}>
              <input
                type="text"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={`Mensaje a ${client.fullName.split(" ")[0]}...`}
                style={{
                  flex: 1, borderRadius: 10, border: "1.5px solid var(--border)",
                  background: "var(--surface-2)", color: "var(--text-primary)",
                  fontSize: 14, padding: "8px 12px", outline: "none",
                }}
              />
              <button
                onClick={sendMsg}
                disabled={!msgText.trim() || sendingMsg}
                style={{
                  borderRadius: 10, border: "none", cursor: msgText.trim() && !sendingMsg ? "pointer" : "default",
                  background: msgText.trim() && !sendingMsg ? "var(--accent)" : "var(--border)",
                  color: msgText.trim() && !sendingMsg ? "#fff" : "var(--text-muted)",
                  padding: "0 14px", fontWeight: 700, fontSize: 14, transition: "all .15s",
                }}
              >
                {sendingMsg ? "…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>

        {notes.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Notas ({notes.length})
            </div>
            <div className="flex flex-col gap-2">
              {notes.map((n: any) => (
                <div key={n.id} className="card py-3">
                  <div className="text-sm text-gray-700">{n.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtDate(n.createdAt?.split("T")[0])} · {n.authorName ?? "Sistema"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {commitments.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Compromisos ({commitments.length})
            </div>
            <div className="flex flex-col gap-2">
              {commitments.map((c: any) => (
                <div key={c.id} className="card flex items-start gap-3 py-3">
                  <IconAlerta
                    size={16}
                    color={c.status === "kept" ? "var(--success)" : c.status === "broken" ? "var(--danger)" : "var(--warning)"}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{c.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(c.promisedDate)}</div>
                  </div>
                  <Badge
                    variant={c.status === "kept" ? "success" : c.status === "broken" ? "danger" : "warning"}
                    size="sm"
                  >
                    {c.status === "kept" ? "Cumplido" : c.status === "broken" ? "Roto" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones administrativas */}
        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Acciones del Admin
          </div>
          <div className="card flex flex-col gap-3">
            <button
              onClick={() => setShowReasignar(true)}
              className="flex items-center gap-3 pressable w-full text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                <IconGrupo size={16} color="#1d4ed8" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Reasignar asesor</div>
                {client.executiveName && (
                  <div className="text-xs text-gray-500">Actual: {client.executiveName}</div>
                )}
              </div>
              <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {activeCredit && (
              <button
                onClick={() => { setShowCambiarFecha(true); setNewDate(activeCredit.disbursementDate ?? ""); }}
                className="flex items-center gap-3 pressable w-full text-left border-t border-gray-100 pt-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                  <IconCalendario size={16} color="#16a34a" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Cambiar fecha de pago</div>
                  {activeCredit.disbursementDate && (
                    <div className="text-xs text-gray-500">Actual: {fmtDate(activeCredit.disbursementDate)}</div>
                  )}
                </div>
                <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )}

            {activeCredit && (
              <button
                onClick={() => {
                  setCond({
                    amount: String(activeCredit.amount ?? ""),
                    termWeeks: String(activeCredit.termWeeks ?? ""),
                    weeklyPayment: String(activeCredit.weeklyPayment ?? ""),
                    totalToRepay: String(activeCredit.totalToRepay ?? ""),
                    remainingBalance: String(activeCredit.remainingBalance ?? ""),
                    notes: String(activeCredit.notes ?? ""),
                  });
                  setShowEditCond(true);
                }}
                className="flex items-center gap-3 pressable w-full text-left border-t border-gray-100 pt-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                  <IconMoneda size={16} color="#215DFF" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Editar condiciones</div>
                  <div className="text-xs text-gray-500">Monto, plazo, pago y observaciones</div>
                </div>
                <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Doc preview modal */}
      {docPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setDocPreview(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setDocPreview(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10"
            >
              <IconCerrar size={18} color="#1f2937" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900 px-4 py-3">
                <div className="text-white text-sm font-semibold">{docPreview.label}</div>
                <div className="text-gray-400 text-xs">{docPreview.filename}</div>
              </div>
              <img
                src={`data:${docPreview.mimeType};base64,${docPreview.base64}`}
                alt={docPreview.label}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal reasignar asesor */}
      {showReasignar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Reasignar asesor</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Selecciona el nuevo asesor para {client?.fullName}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {(executives ?? []).filter((e: any) => e.role === "executive" && e.isActive).map((exec: any) => (
                <button
                  key={exec.id}
                  onClick={() => setNewExecId(exec.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: `1.5px solid ${newExecId === exec.id ? "#1d4ed8" : "#e2e8f0"}`,
                    background: newExecId === exec.id ? "#eff6ff" : "#fff",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#1e40af" }}>
                    {exec.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{exec.fullName}</div>
                    {exec.username && <div style={{ fontSize: 11, color: "#64748b" }}>{exec.username}</div>}
                  </div>
                  {newExecId === exec.id && (
                    <div style={{ marginLeft: "auto" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
              {(!executives || executives.length === 0) && (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>Cargando asesores...</p>
              )}
            </div>
            <button
              onClick={() => newExecId && reasignarMut.mutate(newExecId)}
              disabled={!newExecId || reasignarMut.isPending}
              style={{ width: "100%", padding: 14, background: "#215DFF", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: (!newExecId || reasignarMut.isPending) ? "default" : "pointer", marginBottom: 10, opacity: (!newExecId || reasignarMut.isPending) ? 0.5 : 1, fontFamily: "inherit" }}
            >
              {reasignarMut.isPending ? "Guardando..." : "Reasignar"}
            </button>
            <button
              onClick={() => { setShowReasignar(false); setNewExecId(null); }}
              style={{ width: "100%", padding: 14, background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal cambiar fecha de pago */}
      {showCambiarFecha && activeCredit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Cambiar fecha de pago</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Modifica la fecha de inicio del ciclo de {client?.fullName}.<br />
              <span style={{ color: "#dc2626", fontSize: 12 }}>Esto recalculara las fechas de todos los pagos del crédito activo.</span>
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Nueva fecha de inicio</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={() => newDate && cambiarFechaMut.mutate({ creditId: activeCredit.id, date: newDate })}
              disabled={!newDate || cambiarFechaMut.isPending}
              style={{ width: "100%", padding: 14, background: "#215DFF", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: (!newDate || cambiarFechaMut.isPending) ? "default" : "pointer", marginBottom: 10, opacity: (!newDate || cambiarFechaMut.isPending) ? 0.5 : 1, fontFamily: "inherit" }}
            >
              {cambiarFechaMut.isPending ? "Guardando..." : "Cambiar fecha"}
            </button>
            <button
              onClick={() => { setShowCambiarFecha(false); setNewDate(""); }}
              style={{ width: "100%", padding: 14, background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {/* Modal editar condiciones del credito */}
      {showEditCond && activeCredit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Editar condiciones</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Ajusta los terminos del credito de {client?.fullName}. Cada cambio queda registrado en la bitacora.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {([
                ["amount", "Monto ($)"],
                ["termWeeks", "Plazo (semanas)"],
                ["weeklyPayment", "Pago semanal ($)"],
                ["totalToRepay", "Total a pagar ($)"],
                ["remainingBalance", "Saldo pendiente ($)"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cond[key]}
                    onChange={e => setCond(cc => ({ ...cc, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const wk = parseFloat(cond.weeklyPayment) || 0;
                const tw = parseInt(cond.termWeeks) || 0;
                const total = (wk * tw).toFixed(2);
                setCond(cc => ({ ...cc, totalToRepay: total, remainingBalance: (activeCredit.currentPaymentNumber ?? 0) === 0 ? total : cc.remainingBalance }));
              }}
              style={{ width: "100%", padding: "9px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 12, cursor: "pointer", marginBottom: 14, fontFamily: "inherit" }}
            >
              Recalcular total = pago semanal x plazo
            </button>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Observaciones</label>
              <textarea
                value={cond.notes}
                onChange={e => setCond(cc => ({ ...cc, notes: e.target.value }))}
                rows={3}
                placeholder="Notas internas del credito (motivo de ajuste, acuerdos, etc.)"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none" }}
              />
            </div>
            {editCondMut.isError && (
              <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10, textAlign: "center" }}>{(editCondMut.error as Error).message}</div>
            )}
            <button
              onClick={() => editCondMut.mutate({ creditId: activeCredit.id, body: { amount: cond.amount, termWeeks: cond.termWeeks, weeklyPayment: cond.weeklyPayment, totalToRepay: cond.totalToRepay, remainingBalance: cond.remainingBalance, notes: cond.notes } })}
              disabled={editCondMut.isPending}
              style={{ width: "100%", padding: 14, background: "#215DFF", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: editCondMut.isPending ? "default" : "pointer", marginBottom: 10, opacity: editCondMut.isPending ? 0.5 : 1, fontFamily: "inherit" }}
            >
              {editCondMut.isPending ? "Guardando..." : "Guardar condiciones"}
            </button>
            <button
              onClick={() => setShowEditCond(false)}
              style={{ width: "100%", padding: 14, background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
