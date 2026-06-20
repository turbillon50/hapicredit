import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });
const HDR = () => ({ "Content-Type": "application/json", ...auth() });

type Tab = "usuarios" | "creditos" | "banners" | "avisos";

const TABS: { id: Tab; label: string }[] = [
  { id: "usuarios", label: "Usuarios" },
  { id: "creditos", label: "Tipos de crédito" },
  { id: "banners",  label: "Publicidad" },
  { id: "avisos",   label: "Notificaciones" },
];

function roleLabel(r: string) {
  return r === "admin" ? "Administrador" : r === "executive" ? "Asesor" : "Acreditado";
}

/* ═══════════ TAB: USUARIOS ═══════════ */
function UsuariosTab() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "executive" | "client">("all");

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["all-users"],
    queryFn: async () => { const r = await fetch(`${API}/users`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
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
            <div key={u.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 21, flexShrink: 0,
                background: "var(--brand-blue-deep)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 15,
              }}>
                {(u.fullName ?? "?").split(" ").filter(Boolean).slice(0,2).map((w:string)=>w[0].toUpperCase()).join("")}
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
            style={{ flex: 1, padding: 13, borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
            Cancelar
          </button>
          <button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="pressable btn-brand"
            style={{ flex: 1, padding: 13, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", ctaLabel: "", ctaUrl: "" });

  const { data: banners = [], isLoading } = useQuery<any[]>({
    queryKey: ["banners"],
    queryFn: async () => { const r = await fetch(`${API}/content/banners`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  const createM = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/content/banners`, { method: "POST", headers: HDR(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["banners"] }); setCreating(false); setForm({ title: "", body: "", ctaLabel: "", ctaUrl: "" }); },
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
      {!creating && (
        <button onClick={() => setCreating(true)} className="pressable btn-brand"
          style={{ padding: 13, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nuevo banner
        </button>
      )}

      {creating && (
        <div className="card flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Nuevo banner</div>
          <input className="input-field" placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-field" placeholder="Mensaje (opcional)" rows={2} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ resize: "vertical" }} />
          <input className="input-field" placeholder="Texto del botón (opcional)" value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} />
          <input className="input-field" placeholder="Enlace del botón (opcional)" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setCreating(false); }} className="pressable"
              style={{ flex: 1, padding: 12, borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={() => createM.mutate()} disabled={!form.title || createM.isPending} className="pressable btn-brand"
              style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !form.title ? 0.5 : 1 }}>
              {createM.isPending ? "Creando…" : "Crear banner"}
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
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
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
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  const { data: avisos = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: async () => { const r = await fetch(`${API}/content/notifications`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  const createM = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/content/notifications`, { method: "POST", headers: HDR(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); setCreating(false); setForm({ title: "", body: "", audience: "all" }); },
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
      {!creating && (
        <button onClick={() => setCreating(true)} className="pressable btn-brand"
          style={{ padding: 13, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nueva notificación
        </button>
      )}

      {creating && (
        <div className="card flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Nueva notificación general</div>
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
            <button onClick={() => setCreating(false)} className="pressable"
              style={{ flex: 1, padding: 12, borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--surface)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={() => createM.mutate()} disabled={!form.title || !form.body || createM.isPending} className="pressable btn-brand"
              style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!form.title || !form.body) ? 0.5 : 1 }}>
              {createM.isPending ? "Enviando…" : "Publicar"}
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
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
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
  const [tab, setTab] = useState<Tab>("usuarios");

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

        {tab === "usuarios" && <UsuariosTab />}
        {tab === "creditos" && <CreditosTab />}
        {tab === "banners"  && <BannersTab />}
        {tab === "avisos"   && <AvisosTab />}
      </div>
    </Layout>
  );
}
