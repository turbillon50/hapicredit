import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });
const HDR = () => ({ "Content-Type": "application/json", ...auth() });

type Tab = "resumen" | "usuarios" | "creditos" | "banners" | "avisos";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen",  label: "Resumen" },
  { id: "usuarios", label: "Usuarios" },
  { id: "creditos", label: "Tipos de crédito" },
  { id: "banners",  label: "Publicidad" },
  { id: "avisos",   label: "Notificaciones" },
];

function roleLabel(r: string) {
  return r === "admin" ? "Administrador" : r === "executive" ? "Asesor" : "Acreditado";
}

/* ═══════════ TAB: RESUMEN (estadísticas de uso) ═══════════ */
function ResumenTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["usage-stats"],
    queryFn: async () => { const r = await fetch(`${API}/content/usage-stats`, { headers: auth() }); if (!r.ok) return null; return r.json(); },
  });

  if (isLoading || !data) return <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Cargando estadísticas…</div>;

  const maxTrend = Math.max(1, ...(data.trend ?? []).map((t: any) => t.count));

  const StatBox = ({ value, label, sub }: { value: any; label: string; sub?: string }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Grid de métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox value={data.newClients?.week ?? 0}  label="Clientes nuevos" sub="Últimos 7 días" />
        <StatBox value={data.newClients?.month ?? 0} label="Clientes nuevos" sub="Últimos 30 días" />
        <StatBox value={data.credits?.active ?? 0}   label="Créditos activos" sub={`${data.credits?.pending ?? 0} pendientes`} />
        <StatBox value={data.newClients?.total ?? 0} label="Total acreditados" sub="Histórico" />
      </div>

      {/* Distribución de usuarios por rol */}
      <div className="card flex flex-col gap-3">
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Usuarios por rol</div>
        {([["admin","Administradores"],["executive","Asesores"],["client","Acreditados"]] as [string,string][]).map(([k,lbl]) => {
          const count = data.byRole?.[k] ?? 0;
          const total = Object.values(data.byRole ?? {}).reduce((s: number, v: any) => s + v, 0) || 1;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{lbl}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{count}</span>
              </div>
              <div style={{ height: 7, borderRadius: 100, background: "var(--surface-3)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--brand-blue)", borderRadius: 100, transition: "width 0.6s var(--ease-out-expo)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tendencia de registros — mini gráfica de barras */}
      <div className="card flex flex-col gap-3">
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Registros últimos 8 días</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, paddingTop: 8 }}>
          {(data.trend ?? []).map((t: any, i: number) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", maxWidth: 28, height: `${Math.max(4, (t.count / maxTrend) * 70)}px`, background: t.count > 0 ? "var(--brand-blue)" : "var(--surface-3)", borderRadius: 6, transition: "height 0.5s var(--ease-out-expo)" }} />
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido activo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox value={data.content?.banners ?? 0} label="Banners activos" />
        <StatBox value={data.content?.notifications ?? 0} label="Avisos activos" />
      </div>
    </div>
  );
}

/* ── Panel de detalle de usuario (créditos, pagos, stats) ── */
/* ── Avatar de cliente: muestra su foto de perfil si existe ── */
function ClientAvatar({ userId, name, size = 46 }: { userId: number; name: string; size?: number }) {
  const { data } = useQuery<{ url: string | null }>({
    queryKey: ["avatar", userId],
    queryFn: async () => { const r = await fetch(`${API}/uploads/avatar?userId=${userId}`, { headers: auth() }); if (!r.ok) return { url: null }; return r.json(); },
  });
  const initials = (name ?? "?").split(" ").filter(Boolean).slice(0,2).map((w:string)=>w[0]?.toUpperCase()??"").join("");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: data?.url ? "var(--surface-3)" : "var(--brand-blue-deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {data?.url
        ? <img src={data.url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

function UserDetailPanel({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["user-detail", userId],
    queryFn: async () => { const r = await fetch(`${API}/users/${userId}/detail`, { headers: auth() }); if (!r.ok) return null; return r.json(); },
  });

  if (isLoading) return <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>Cargando detalle…</div>;
  if (!data || !data.client) return (
    <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0 16px" }}>
      Este usuario no tiene expediente de crédito.
    </div>
  );

  const money = (n: any) => "$" + Math.round(parseFloat(n ?? "0")).toLocaleString("es-MX");
  const statusLabel: Record<string, string> = { active: "Activo", pending: "Pendiente", closed: "Liquidado", rejected: "Rechazado", defaulted: "Incumplido", needs_info: "Requiere info" };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          [money(data.stats.totalBorrowed), "Prestado total"],
          [money(data.stats.totalPaid), "Pagado"],
          [money(data.stats.remainingBalance), "Saldo activo"],
          [String(data.stats.activeCredits), "Créditos activos"],
        ].map(([val, lbl], i) => (
          <div key={i} style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{val}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginTop: 1 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Créditos */}
      {data.credits.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Créditos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {data.credits.map((cr: any) => (
              <div key={cr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{money(cr.amount)}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{cr.termWeeks} sem · {money(cr.weeklyPayment)}/sem</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  {statusLabel[cr.status] ?? cr.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagos recientes */}
      {data.payments.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Pagos recientes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.payments.slice(0, 5).map((p: any) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                <span style={{ color: "var(--text-muted)" }}>{p.paymentDate}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(p.amountPaid)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════ TAB: USUARIOS ═══════════ */
function UsuariosTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "executive" | "client">("all");
  const [editing, setEditing] = useState<any | null>(null);

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["all-users"],
    queryFn: async () => { const r = await fetch(`${API}/users`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  const saveM = useMutation({
    mutationFn: async ({ id, role, isActive }: { id: number; role?: string; isActive?: boolean }) => {
      const body: any = {};
      if (role !== undefined) body.role = role;
      if (isActive !== undefined) body.isActive = isActive;
      const r = await fetch(`${API}/users/${id}`, { method: "PATCH", headers: HDR(), body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-users"] }); setEditing(null); },
  });

  const filtered = (users as any[]).filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (u.fullName ?? "").toLowerCase().includes(s)
      || (u.email ?? "").toLowerCase().includes(s)
      || (u.username ?? "").toLowerCase().includes(s);
  });

  const counts = {
    all: users.length,
    admin: (users as any[]).filter(u => u.role === "admin").length,
    executive: (users as any[]).filter(u => u.role === "executive").length,
    client: (users as any[]).filter(u => u.role === "client").length,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar por nombre, correo o usuario…"
        className="input-field"
      />
      {/* Role filter chips */}
      <div className="snap-x-carousel" style={{ gap: 8 }}>
        {([
          ["all", `Todos · ${counts.all}`],
          ["admin", `Admins · ${counts.admin}`],
          ["executive", `Asesores · ${counts.executive}`],
          ["client", `Acreditados · ${counts.client}`],
        ] as [typeof roleFilter, string][]).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setRoleFilter(k)}
            className="pressable"
            style={{
              padding: "8px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700,
              whiteSpace: "nowrap", border: "1.5px solid",
              borderColor: roleFilter === k ? "var(--brand-blue)" : "var(--border)",
              background: roleFilter === k ? "var(--brand-blue)" : "var(--surface)",
              color: roleFilter === k ? "#fff" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Cargando usuarios…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Sin resultados</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(u => (
            <div key={u.id} onClick={() => setEditing(u)} className="card pressable" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 21, flexShrink: 0, overflow: "hidden",
                background: u.avatarUrl ? "var(--surface-3)" : "var(--brand-blue-deep)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 15,
              }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt={u.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (u.fullName ?? "?").split(" ").filter(Boolean).slice(0,2).map((w:string)=>w[0].toUpperCase()).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{u.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {u.email ?? u.username ?? "—"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                  background: "var(--surface-3)", color: "var(--text-secondary)",
                }}>
                  {roleLabel(u.role)}
                </span>
                {u.isActive === false && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Inactivo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición de usuario */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,20,0.55)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
             onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div style={{ width: "100%", maxWidth: 460, background: "var(--surface)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 100, background: "var(--border-mid)", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, overflow: "hidden", flexShrink: 0, background: editing.avatarUrl ? "var(--surface-3)" : "var(--brand-blue-deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
                {editing.avatarUrl
                  ? <img src={editing.avatarUrl} alt={editing.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (editing.fullName ?? "?").split(" ").filter(Boolean).slice(0,2).map((w:string)=>w[0].toUpperCase()).join("")}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{editing.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{editing.email ?? editing.username}</div>
              </div>
            </div>

            <UserDetailPanel userId={editing.id} />

            <button onClick={() => { window.location.href = `/admin/expediente/${editing.id}`; }} className="pressable"
              style={{ width: "100%", padding: 13, marginBottom: 16, borderRadius: "var(--r-lg)", border: "1.5px solid var(--brand-blue)", background: "var(--info-bg, var(--surface-2))", color: "var(--brand-blue)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Ver expediente completo
            </button>

            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Rol</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {([["client","Acreditado"],["executive","Asesor"],["admin","Administrador"]] as [string,string][]).map(([val,lbl]) => (
                <button key={val} onClick={() => saveM.mutate({ id: editing.id, role: val })} disabled={saveM.isPending} className="pressable"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: "var(--r-lg)", cursor: "pointer",
                    border: `1.5px solid ${editing.role === val ? "var(--brand-blue)" : "var(--border)"}`,
                    background: editing.role === val ? "rgba(33,93,255,0.06)" : "var(--surface)" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: editing.role === val ? "var(--brand-blue)" : "var(--text-secondary)" }}>{lbl}</span>
                  {editing.role === val && <span style={{ fontSize: 12, color: "var(--brand-blue)", fontWeight: 700 }}>Actual</span>}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => saveM.mutate({ id: editing.id, isActive: !editing.isActive })} disabled={saveM.isPending} className="pressable"
                style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
                {editing.isActive === false ? "Reactivar" : "Desactivar"}
              </button>
              <button onClick={() => setEditing(null)} className="pressable btn-brand"
                style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TAB: TIPOS DE CRÉDITO ═══════════ */
function CreditosTab() {
  const qc = useQueryClient();
  const { data: cfg = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["config"],
    queryFn: async () => { const r = await fetch(`${API}/config`, { headers: HDR() }); if (!r.ok) return {}; return r.json(); },
  });

  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const data = draft ?? cfg;
  const set = (k: string, v: string) => setDraft({ ...data, [k]: v });

  const saveM = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/config`, { method: "PUT", headers: HDR(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["config"] }); setDraft(null); },
  });

  if (isLoading) return <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Cargando…</div>;

  const Field = ({ label, k, suffix }: { label: string; k: string; suffix?: string }) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          value={data[k] ?? ""}
          onChange={e => set(k, e.target.value)}
          className="input-field"
          inputMode="numeric"
        />
        {suffix && <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Crédito nuevo */}
      <div className="card flex flex-col gap-3">
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Cliente nuevo
        </div>
        <Field label="Monto mínimo" k="calc_nuevo_min" suffix="MXN" />
        <Field label="Monto máximo" k="calc_nuevo_max" suffix="MXN" />
        <Field label="Plazo fijo" k="calc_nuevo_plazo" suffix="semanas" />
        <Field label="Tasa total" k="calc_nuevo_tasa" suffix="%" />
      </div>

      {/* Crédito recurrente */}
      <div className="card flex flex-col gap-3">
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Cliente recurrente
        </div>
        <Field label="Monto mínimo" k="calc_exist_min" suffix="MXN" />
        <Field label="Monto máximo" k="calc_exist_max" suffix="MXN" />
        <Field label="Plazo mínimo" k="calc_exist_plazo_min" suffix="semanas" />
        <Field label="Plazo máximo" k="calc_exist_plazo_max" suffix="semanas" />
        <Field label="Tasa mensual" k="calc_exist_tasa_mensual" suffix="%" />
      </div>

      {draft && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDraft(null)} className="pressable"
            style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
            Cancelar
          </button>
          <button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="pressable btn-brand"
            style={{ flex: 1, padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {saveM.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TAB: BANNERS / PUBLICIDAD ═══════════ */
function BannersTab() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ title: "", body: "", ctaLabel: "", ctaUrl: "" });

  const { data: banners = [], isLoading } = useQuery<any[]>({
    queryKey: ["banners"],
    queryFn: async () => { const r = await fetch(`${API}/content/banners`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  const openNew = () => { setForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" }); setEditId("new"); };
  const openEdit = (b: any) => { setForm({ title: b.title ?? "", body: b.body ?? "", ctaLabel: b.cta_label ?? "", ctaUrl: b.cta_url ?? "" }); setEditId(b.id); };
  const close = () => setEditId(null);

  const saveM = useMutation({
    mutationFn: async () => {
      const isNew = editId === "new";
      const url = isNew ? `${API}/content/banners` : `${API}/content/banners/${editId}`;
      const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: HDR(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["banners"] }); close(); },
  });
  const toggleM = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await fetch(`${API}/content/banners/${id}`, { method: "PUT", headers: HDR(), body: JSON.stringify({ isActive }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
  const deleteM = useMutation({
    mutationFn: async (id: number) => { await fetch(`${API}/content/banners/${id}`, { method: "DELETE", headers: auth() }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });

  return (
    <div className="flex flex-col gap-3">
      {editId === null && (
        <button onClick={openNew} className="pressable btn-brand"
          style={{ padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nuevo banner
        </button>
      )}

      {editId !== null && (
        <div className="card flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{editId === "new" ? "Nuevo banner" : "Editar banner"}</div>
          <input className="input-field" placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-field" placeholder="Mensaje (opcional)" rows={2} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ resize: "vertical" }} />
          <input className="input-field" placeholder="Texto del botón (opcional)" value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} />
          <input className="input-field" placeholder="Enlace del botón (opcional)" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={close} className="pressable"
              style={{ flex: 1, padding: 12, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={() => saveM.mutate()} disabled={!form.title || saveM.isPending} className="pressable btn-brand"
              style={{ flex: 1, padding: 12, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !form.title ? 0.5 : 1 }}>
              {saveM.isPending ? "Guardando…" : (editId === "new" ? "Crear banner" : "Guardar cambios")}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Cargando…</div>
      ) : banners.length === 0 ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Sin banners. Crea el primero para mostrarlo a tus clientes.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {(banners as any[]).map(b => (
            <div key={b.id} className="card" style={{ padding: 14, opacity: b.is_active ? 1 : 0.55 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{b.title}</div>
                  {b.body && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{b.body}</div>}
                  {b.cta_label && <div style={{ fontSize: 11, color: "var(--brand-blue)", marginTop: 4, fontWeight: 600 }}>{b.cta_label} →</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(b)} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)" }}>
                    Editar
                  </button>
                  <button onClick={() => toggleM.mutate({ id: b.id, isActive: !b.is_active })} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: b.is_active ? "var(--brand-blue)" : "var(--text-muted)" }}>
                    {b.is_active ? "Activo" : "Oculto"}
                  </button>
                  <button onClick={() => deleteM.mutate(b.id)} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ═══════════ TAB: NOTIFICACIONES ═══════════ */
function AvisosTab() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ title: "", body: "", audience: "all", startsAt: "", endsAt: "" });

  const { data: avisos = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: async () => { const r = await fetch(`${API}/content/notifications`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  const openNew = () => { setForm({ title: "", body: "", audience: "all", startsAt: "", endsAt: "" }); setEditId("new"); };
  const openEdit = (n: any) => { setForm({ title: n.title ?? "", body: n.body ?? "", audience: n.audience ?? "all", startsAt: n.starts_at ? n.starts_at.slice(0,10) : "", endsAt: n.ends_at ? n.ends_at.slice(0,10) : "" }); setEditId(n.id); };
  const close = () => setEditId(null);

  const saveM = useMutation({
    mutationFn: async () => {
      const isNew = editId === "new";
      const url = isNew ? `${API}/content/notifications` : `${API}/content/notifications/${editId}`;
      const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: HDR(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); close(); },
  });
  const toggleM = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await fetch(`${API}/content/notifications/${id}`, { method: "PUT", headers: HDR(), body: JSON.stringify({ isActive }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const deleteM = useMutation({
    mutationFn: async (id: number) => { await fetch(`${API}/content/notifications/${id}`, { method: "DELETE", headers: auth() }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const audLabel = (a: string) => a === "executive" ? "Asesores" : a === "client" ? "Acreditados" : "Todos";

  return (
    <div className="flex flex-col gap-3">
      {editId === null && (
        <button onClick={openNew} className="pressable btn-brand"
          style={{ padding: 13, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nueva notificación
        </button>
      )}

      {editId !== null && (
        <div className="card flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{editId === "new" ? "Nueva notificación general" : "Editar notificación"}</div>
          <input className="input-field" placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-field" placeholder="Mensaje" rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ resize: "vertical" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Dirigido a</div>
            <select className="input-field" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Todos los usuarios</option>
              <option value="client">Solo acreditados</option>
              <option value="executive">Solo asesores</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Desde (opcional)</div>
              <input type="date" className="input-field" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Hasta (opcional)</div>
              <input type="date" className="input-field" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={close} className="pressable"
              style={{ flex: 1, padding: 12, borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={() => saveM.mutate()} disabled={!form.title || !form.body || saveM.isPending} className="pressable btn-brand"
              style={{ flex: 1, padding: 12, borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!form.title || !form.body) ? 0.5 : 1 }}>
              {saveM.isPending ? "Guardando…" : (editId === "new" ? "Publicar" : "Guardar cambios")}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Cargando…</div>
      ) : avisos.length === 0 ? (
        <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Sin notificaciones. Publica un aviso general para tus usuarios.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {(avisos as any[]).map(n => (
            <div key={n.id} className="card" style={{ padding: 14, opacity: n.is_active ? 1 : 0.55 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{n.title}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "var(--surface-3)", color: "var(--text-secondary)" }}>{audLabel(n.audience)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{n.body}</div>
                  {(n.starts_at || n.ends_at) && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontWeight: 600 }}>
                      {n.starts_at ? `Desde ${n.starts_at.slice(0,10)}` : ""}{n.starts_at && n.ends_at ? " · " : ""}{n.ends_at ? `Hasta ${n.ends_at.slice(0,10)}` : ""}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(n)} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)" }}>
                    Editar
                  </button>
                  <button onClick={() => toggleM.mutate({ id: n.id, isActive: !n.is_active })} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: n.is_active ? "var(--brand-blue)" : "var(--text-muted)" }}>
                    {n.is_active ? "Activa" : "Oculta"}
                  </button>
                  <button onClick={() => deleteM.mutate(n.id)} className="pressable"
                    style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100, cursor: "pointer", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ COMPONENTE PRINCIPAL ═══════════ */
export default function AdminCentro() {
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <Layout title="Centro de contenido">
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
            Centro de contenido
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Usuarios, tipos de crédito, publicidad y notificaciones
          </p>
        </div>

        {/* Tabs */}
        <div className="snap-x-carousel" style={{ gap: 8, marginBottom: 18 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="pressable"
              style={{
                padding: "9px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700,
                whiteSpace: "nowrap", cursor: "pointer", border: "1.5px solid",
                borderColor: tab === t.id ? "var(--brand-blue)" : "var(--border)",
                background: tab === t.id ? "var(--brand-blue)" : "var(--surface)",
                color: tab === t.id ? "#fff" : "var(--text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen"  && <ResumenTab />}
        {tab === "usuarios" && <UsuariosTab />}
        {tab === "creditos" && <CreditosTab />}
        {tab === "banners"  && <BannersTab />}
        {tab === "avisos"   && <AvisosTab />}
      </div>
    </Layout>
  );
}
