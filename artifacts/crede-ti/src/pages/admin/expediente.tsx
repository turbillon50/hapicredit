import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const money = (n: any) => "$" + Math.round(parseFloat(n ?? "0")).toLocaleString("es-MX");

const DOC_CATALOG: Record<string, string> = {
  ine_front: "INE — Frente",
  ine_back: "INE — Reverso",
  comprobante_domicilio: "Comprobante de domicilio",
  estado_cuenta: "Estado de cuenta",
  recibo_nomina: "Recibo de nómina",
  selfie_ine: "Selfie con INE",
  curp: "CURP",
  foto: "Fotografía",
  otro: "Otro documento",
};

const statusLabel: Record<string, string> = {
  active: "Activo", pending: "Pendiente", closed: "Liquidado",
  rejected: "Rechazado", defaulted: "Incumplido", needs_info: "Requiere info",
  approved: "Validado",
};

/* ── Mini iconos ── */
const IcDoc = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcCheck = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcX = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default function Expediente() {
  const [, params] = useRoute("/admin/expediente/:userId");
  const [, navigate] = useLocation();
  const userId = params?.userId ? parseInt(params.userId, 10) : 0;
  const qc = useQueryClient();
  const [preview, setPreview] = useState<any | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [reqNote, setReqNote] = useState("");
  // Control del crédito: editar condiciones y registrar pagos
  const [editCredit, setEditCredit] = useState<any | null>(null);
  const [payCredit, setPayCredit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", termWeeks: "", remainingBalance: "", weeklyPayment: "" });
  const [payForm, setPayForm] = useState({ amountPaid: "", paymentDate: "", notes: "" });

  // El parámetro de la ruta es el clientId (lo que la cartera siempre tiene).
  // Cargamos el expediente por clientId — funciona para clientes directos y los registrados por la app.
  const clientId = userId;
  const { data: detail, isLoading } = useQuery<any>({
    queryKey: ["expediente-detail", clientId],
    queryFn: async () => { const r = await fetch(`${API}/clients/${clientId}/expediente`, { headers: auth() }); if (!r.ok) return null; return r.json(); },
    enabled: clientId > 0,
  });
  // userId real (si el cliente tiene usuario vinculado) para docs/avatar
  const linkedUserId = detail?.user?.id ?? null;

  // Documentos subidos (tabla documents — avatar, etc.)
  const { data: tableDocs = [] } = useQuery<any[]>({
    queryKey: ["expediente-docs", linkedUserId],
    queryFn: async () => { const r = await fetch(`${API}/uploads/user/${linkedUserId}`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
    enabled: !!linkedUserId,
  });

  // Documentos de las solicitudes (INE/selfie, archivados en cada crédito).
  const creditIds: number[] = (detail?.credits ?? []).map((cr: any) => cr.id);
  const { data: appDocs = [] } = useQuery<any[]>({
    queryKey: ["expediente-appdocs", clientId, creditIds.join(",")],
    queryFn: async () => {
      const all: any[] = [];
      for (const cid of creditIds) {
        try {
          const r = await fetch(`${API}/credits/${cid}/application`, { headers: auth() });
          if (r.ok) { const j = await r.json(); (j.documents ?? []).forEach((d: any) => all.push({ ...d, blobUrl: d.url, creditId: cid })); }
        } catch {}
      }
      return all;
    },
    enabled: creditIds.length > 0,
  });

  // Combinar ambas fuentes, sin duplicar por URL.
  const seen = new Set<string>();
  const docs = [...appDocs, ...tableDocs].filter((d: any) => {
    const u = d.url ?? d.blobUrl ?? d.id;
    if (seen.has(u)) return false; seen.add(u); return true;
  });

  // Documentos solicitados
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["expediente-requests", linkedUserId],
    queryFn: async () => { const r = await fetch(`${API}/document-requests/user/${linkedUserId}`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
    enabled: !!linkedUserId,
  });

  // Avatar
  const { data: avatar } = useQuery<{ url: string | null }>({
    queryKey: ["expediente-avatar", linkedUserId],
    queryFn: async () => { const r = await fetch(`${API}/uploads/avatar?userId=${linkedUserId}`, { headers: auth() }); if (!r.ok) return { url: null }; return r.json(); },
    enabled: !!linkedUserId,
  });

  const validateM = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${API}/uploads/${id}/status`, { method: "PATCH", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expediente-docs", linkedUserId] }),
  });

  const requestM = useMutation({
    mutationFn: () =>
      fetch(`${API}/document-requests`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ userId: linkedUserId, docTypes: selectedDocs, note: reqNote }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expediente-requests", linkedUserId] }); setRequesting(false); setSelectedDocs([]); setReqNote(""); },
  });

  const cancelReqM = useMutation({
    mutationFn: (id: number) => fetch(`${API}/document-requests/${id}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expediente-requests", linkedUserId] }),
  });

  // Editar condiciones del crédito (monto, plazo, tasa, pago semanal)
  const editCreditM = useMutation({
    mutationFn: (body: any) =>
      fetch(`${API}/credits/${editCredit.id}`, { method: "PATCH", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expediente-detail", clientId] }); setEditCredit(null); },
  });

  // Registrar un pago
  const payM = useMutation({
    mutationFn: (body: any) =>
      fetch(`${API}/payments`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expediente-detail", clientId] }); setPayCredit(null); },
  });

  // Cambiar estado del crédito (activar, liquidar, marcar incumplido)
  const creditStatusM = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${API}/credits/${id}`, { method: "PATCH", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expediente-detail", clientId] }),
  });

  function openEdit(cr: any) {
    setEditForm({
      amount: String(Math.round(parseFloat(cr.amount ?? "0"))),
      termWeeks: String(cr.termWeeks ?? ""),
      remainingBalance: String(Math.round(parseFloat(cr.remainingBalance ?? "0"))),
      weeklyPayment: String(Math.round(parseFloat(cr.weeklyPayment ?? "0"))),
    });
    setEditCredit(cr);
  }
  function openPay(cr: any) {
    setPayForm({ amountPaid: String(Math.round(parseFloat(cr.weeklyPayment ?? "0"))), paymentDate: new Date().toISOString().slice(0,10), notes: "" });
    setPayCredit(cr);
  }

  if (isLoading) return <Layout title="Expediente"><div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando expediente…</div></Layout>;
  if (!detail) return <Layout title="Expediente"><div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No se encontró el expediente.</div></Layout>;

  const u = detail.user;
  const client = detail.client;
  const initials = (u?.fullName ?? "?").split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  const pendingReqs = requests.filter((r: any) => r.status === "pending");

  return (
    <Layout title="Expediente" back="/admin/centro">
      <div style={{ padding: "8px 16px 40px", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ═══ CABECERA: identidad del acreditado ═══ */}
        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: avatar?.url ? "var(--surface-3)" : "var(--brand-blue-deep)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            {avatar?.url
              ? <img src={avatar.url} alt={u.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{initials}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{u.fullName}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.email ?? client?.phone ?? "—"}</div>
            {client?.status && (
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                {statusLabel[client.status] ?? client.status}
              </span>
            )}
          </div>
        </div>

        {/* ═══ RESUMEN FINANCIERO ═══ */}
        {client && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              [money(detail.stats.totalBorrowed), "Prestado total"],
              [money(detail.stats.totalPaid), "Pagado"],
              [money(detail.stats.remainingBalance), "Saldo activo"],
              [String(detail.stats.activeCredits), "Créditos activos"],
            ].map(([val, lbl], i) => (
              <div key={i} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{val}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ DATOS PERSONALES ═══ */}
        {client && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Datos personales</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Teléfono", client.phone],
                ["Domicilio", client.address],
                ["CURP", client.curp],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DOCUMENTOS (el baúl) ═══ */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Documentos</div>
            <button onClick={() => setRequesting(true)} className="pressable" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--brand-blue)", background: "transparent", border: "none", cursor: "pointer" }}>
              <IcPlus /> Solicitar
            </button>
          </div>

          {/* Solicitudes pendientes */}
          {pendingReqs.length > 0 && (
            <div style={{ marginBottom: 14, padding: 12, background: "var(--warning-bg, var(--surface-2))", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warning, var(--text-secondary))", marginBottom: 8 }}>Pendientes de subir por el cliente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pendingReqs.map((r: any) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{r.label}</span>
                    <button onClick={() => cancelReqM.mutate(r.id)} style={{ fontSize: 11, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>quitar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos subidos */}
          {docs.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "14px 0" }}>Sin documentos subidos aún.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((d: any) => {
                const imgUrl = d.blobUrl ?? d.url ?? "";
                const isImg = (d.mimeType ?? "").startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(imgUrl) || (!!imgUrl && !d.mimeType);
                const isFromTable = typeof d.id === "number"; // solo los de la tabla 'documents' tienen id y se pueden validar
                return (
                  <div key={d.id ?? imgUrl} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                    <button onClick={() => setPreview({ ...d, blobUrl: imgUrl })} style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", overflow: "hidden", flexShrink: 0, background: "var(--surface-3)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                      {isImg && imgUrl ? <img src={imgUrl} alt={d.type} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IcDoc />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{DOC_CATALOG[d.type] ?? d.type}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.status ? (statusLabel[d.status] ?? d.status) : "Subido en la solicitud"}</div>
                    </div>
                    <div style={{ display: isFromTable ? "flex" : "none", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => validateM.mutate({ id: d.id, status: "approved" })} title="Validar"
                        style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--border)", background: d.status === "approved" ? "var(--success)" : "var(--surface)", color: d.status === "approved" ? "#fff" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IcCheck />
                      </button>
                      <button onClick={() => validateM.mutate({ id: d.id, status: "rejected" })} title="Rechazar"
                        style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--border)", background: d.status === "rejected" ? "var(--danger)" : "var(--surface)", color: d.status === "rejected" ? "#fff" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IcX />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ CRÉDITOS ═══ */}
        {detail.credits.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Créditos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.credits.map((cr: any) => (
                <div key={cr.id} style={{ padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{money(cr.amount)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{cr.termWeeks} sem · {money(cr.weeklyPayment)}/sem · saldo {money(cr.remainingBalance)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: "var(--surface-3)", color: "var(--text-secondary)" }}>{statusLabel[cr.status] ?? cr.status}</span>
                  </div>
                  {/* Controles de admin: editar, registrar pago, estado */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button onClick={() => openEdit(cr)} className="pressable" style={{ flex: "1 1 auto", minWidth: 90, padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer" }}>Editar</button>
                    {(cr.status === "active" || cr.status === "approved") && (
                      <button onClick={() => openPay(cr)} className="pressable btn-brand" style={{ flex: "1 1 auto", minWidth: 110, padding: "8px 10px", borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Registrar pago</button>
                    )}
                    {cr.status === "active" && (
                      <button onClick={() => { if (confirm("¿Marcar este crédito como liquidado?")) creditStatusM.mutate({ id: cr.id, status: "closed" }); }} className="pressable" style={{ flex: "1 1 auto", minWidth: 90, padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer" }}>Liquidar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PAGOS RECIENTES ═══ */}
        {detail.payments.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Pagos recientes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {detail.payments.slice(0, 8).map((p: any) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{p.paymentDate}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(p.amountPaid)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ═══ MODAL: solicitar documentos ═══ */}
      {requesting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setRequesting(false); }}>
          <div style={{ width: "100%", maxWidth: 460, background: "var(--surface)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Solicitar documentos</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>El cliente los verá como pendientes en su perfil.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {Object.entries(DOC_CATALOG).filter(([k]) => k !== "otro").map(([k, label]) => {
                const sel = selectedDocs.includes(k);
                return (
                  <button key={k} onClick={() => setSelectedDocs(s => sel ? s.filter(x => x !== k) : [...s, k])}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "var(--r-md)", border: `1.5px solid ${sel ? "var(--brand-blue)" : "var(--border)"}`, background: sel ? "var(--info-bg, var(--surface-2))" : "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                    {sel && <span style={{ color: "var(--brand-blue)" }}><IcCheck /></span>}
                  </button>
                );
              })}
            </div>
            <textarea value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="Nota para el cliente (opcional)" rows={2} className="input-field" style={{ resize: "vertical", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRequesting(false)} className="pressable" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>Cancelar</button>
              <button onClick={() => requestM.mutate()} disabled={selectedDocs.length === 0 || requestM.isPending} className="pressable btn-brand" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: selectedDocs.length === 0 ? 0.5 : 1 }}>
                {requestM.isPending ? "Enviando…" : `Solicitar (${selectedDocs.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: preview de documento ═══ */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setPreview(null)}>
          <div style={{ maxWidth: "92vw", maxHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {(preview.mimeType ?? "").startsWith("image/")
              ? <img src={preview.blobUrl} alt={preview.type} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12, objectFit: "contain" }} />
              : <a href={preview.blobUrl} target="_blank" rel="noopener noreferrer" className="btn-brand" style={{ padding: "14px 28px", borderRadius: 100, fontWeight: 700, textDecoration: "none" }}>Abrir documento</a>}
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{DOC_CATALOG[preview.type] ?? preview.type}</div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: editar condiciones del crédito ═══ */}
      {editCredit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setEditCredit(null); }}>
          <div className="card" style={{ width: "100%", maxWidth: 460, borderRadius: "20px 20px 0 0", padding: 22, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Editar crédito</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Ajusta las condiciones del crédito</div>
            {[
              ["Monto del crédito", "amount", "$"],
              ["Plazo (semanas)", "termWeeks", ""],
              ["Saldo restante", "remainingBalance", "$"],
              ["Pago semanal", "weeklyPayment", "$"],
            ].map(([label, key, sym]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
                <input type="number" inputMode="decimal" value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key as string]: e.target.value }))}
                  className="input-field" style={{ width: "100%" }} placeholder={sym} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setEditCredit(null)} className="pressable" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>Cancelar</button>
              <button onClick={() => editCreditM.mutate({
                  amount: parseFloat(editForm.amount) || undefined,
                  termWeeks: parseInt(editForm.termWeeks) || undefined,
                  remainingBalance: parseFloat(editForm.remainingBalance) || undefined,
                  weeklyPayment: parseFloat(editForm.weeklyPayment) || undefined,
                })} disabled={editCreditM.isPending} className="pressable btn-brand" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {editCreditM.isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: registrar pago ═══ */}
      {payCredit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setPayCredit(null); }}>
          <div className="card" style={{ width: "100%", maxWidth: 460, borderRadius: "20px 20px 0 0", padding: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Registrar pago</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Saldo actual: {money(payCredit.remainingBalance)} · Pago semanal: {money(payCredit.weeklyPayment)}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Monto pagado</label>
              <input type="number" inputMode="decimal" value={payForm.amountPaid} onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))} className="input-field" style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Fecha del pago</label>
              <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className="input-field" style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Nota (opcional)</label>
              <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="input-field" style={{ width: "100%" }} placeholder="Ej. pago en efectivo" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPayCredit(null)} className="pressable" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>Cancelar</button>
              <button onClick={() => payM.mutate({
                  clientId: payCredit.clientId,
                  creditId: payCredit.id,
                  amountPaid: parseFloat(payForm.amountPaid) || 0,
                  paymentDate: payForm.paymentDate,
                  notes: payForm.notes || undefined,
                })} disabled={payM.isPending || !payForm.amountPaid} className="pressable btn-brand" style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !payForm.amountPaid ? 0.5 : 1 }}>
                {payM.isPending ? "Registrando…" : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
