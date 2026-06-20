import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import {
  IconSubir, IconCarpeta, IconDocumento, IconBorrar,
  IconOjo, IconCerrar, IconLoader, IconInfo, IconTelefono, IconUbicacion, IconID,
} from "@/components/hapi/HapiIcons";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { usePush } from "@/hooks/usePush";
// @vercel/blob/client is dynamically imported inside handleFile so an error
// in that bundle never blocks the initial render of the perfil page.

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const DOC_LABELS: Record<string, string> = {
  ine_front: "INE — Frente", ine_back: "INE — Reverso", curp_doc: "CURP",
  domicilio: "Comprobante de domicilio", ingresos: "Comprobante de ingresos",
  foto: "Fotografía reciente", otro: "Otro documento",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function roleLabel(role: string) {
  if (role === "admin")     return "Administrador";
  if (role === "executive") return "Asesor";
  return "Acreditado";
}

function roleBadge(role: string) {
  if (role === "admin")     return { bg: "var(--surface-3)", color: "var(--text-secondary)" };
  if (role === "executive") return { bg: "var(--surface-3)", color: "#2563eb" };
  return { bg: "var(--surface-3)", color: "var(--success)" };
}

/* ── WhatsApp share icon ── */
function IconWhatsapp({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function IconCopiar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function IconTrash({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function IconMas({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

/* ─── Invite Codes Section ─────────────────────────────────────────────────── */
function InviteCodes({ userRole }: { userRole: string }) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState<"executive" | "client" | "admin" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const appBase = window.location.origin + import.meta.env.BASE_URL?.replace(/\/$/, "");

  const { data: codes = [], isLoading } = useQuery<any[]>({
    queryKey: ["invite-codes-mine"],
    queryFn: async () => {
      const r = await fetch(`${API}/invite-codes/mine`, { headers: auth() });
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  async function generate(role: "executive" | "client" | "admin") {
    setGenerating(role);
    try {
      const r = await fetch(`${API}/invite-codes/generate`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!r.ok) { const d = await r.json(); alert(d.error); return; }
      await qc.invalidateQueries({ queryKey: ["invite-codes-mine"] });
    } finally {
      setGenerating(null);
    }
  }

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API}/invite-codes/${id}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invite-codes-mine"] }),
  });

  function copyLink(code: string) {
    const link = `${appBase}/registro?inv=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function shareWhatsApp(code: string, role: string) {
    const link = `${appBase}/registro?inv=${code}`;
    let text = "";

    if (role === "admin") {
      text = `¡Hola! Eres parte del equipo directivo de *credeti* como *Administrador*.\n\n` +
        `Para comenzar:\n` +
        `1. Abre este enlace en tu cel: ${link}\n` +
        `2. Ingresa la clave de acceso institucional\n` +
        `3. Crea tu cuenta con correo y verifica\n` +
        `4. Instala la app: toca el menú de tu navegador → *"Agregar a inicio"*\n\n` +
        `_credeti — Creemos en ti_`;
    } else if (role === "executive") {
      text = `¡Hola! Te invito a ser parte del equipo de asesores de *credeti*.\n\n` +
        `Para registrarte como *Asesor*:\n` +
        `1. Entra a: ${link}\n` +
        `2. Ingresa la clave de acceso que te compartí\n` +
        `3. Crea tu cuenta con correo y verifica\n` +
        `4. Instala la app: menú del navegador → *"Agregar a inicio"*\n\n` +
        `_credeti — Creemos en ti_`;
    } else {
      text = `¡Hola! Tu acceso a *credeti* ya está listo.\n\n` +
        `Para registrarte y consultar tu crédito:\n` +
        `1. Entra a este enlace: ${link}\n` +
        `2. Crea tu cuenta con correo y verifica\n` +
        `3. Instala la app: toca menú del navegador → *"Agregar a inicio"*\n\n` +
        `¡Bienvenido/a! _credeti — Creemos en ti_`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const activeCodes = (codes as any[]).filter((c: any) => c.isActive && !c.usedAt);
  const usedCodes   = (codes as any[]).filter((c: any) => c.usedAt);

  const canGenAdmin  = userRole === "admin";
  const canGenExec   = userRole === "admin";
  const canGenClient = userRole === "admin" || userRole === "executive";

  function roleBadgeStyle(role: string) {
    if (role === "admin")     return { background: "var(--surface-3)", color: "var(--text-secondary)" };
    if (role === "executive") return { background: "var(--surface-3)", color: "#2563eb" };
    return { background: "var(--success-bg)", color: "var(--success)" };
  }
  function roleLabel2(role: string) {
    if (role === "admin")     return "Administrador";
    if (role === "executive") return "Asesor";
    return "Acreditado";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Códigos de invitación</div>

      {/* Generate buttons */}
      <div className="flex flex-col gap-2">
        {canGenAdmin && (
          <button
            onClick={() => generate("admin")}
            disabled={generating === "admin"}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold pressable"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
          >
            {generating === "admin" ? <IconLoader size={14} className="animate-spin" /> : <IconMas size={14} />}
            Invitar Administrador
          </button>
        )}
        <div className="flex gap-2">
          {canGenExec && (
            <button
              onClick={() => generate("executive")}
              disabled={generating === "executive"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold pressable"
              style={{ background: "var(--surface-3)", color: "#2563eb" }}
            >
              {generating === "executive" ? <IconLoader size={14} className="animate-spin" /> : <IconMas size={14} />}
              Asesor
            </button>
          )}
          {canGenClient && (
            <button
              onClick={() => generate("client")}
              disabled={generating === "client"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold pressable"
              style={{ background: "var(--success-bg)", color: "var(--success)" }}
            >
              {generating === "client" ? <IconLoader size={14} className="animate-spin" /> : <IconMas size={14} />}
              Acreditado
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="text-xs text-gray-400 text-center py-3">Cargando...</div>}

      {/* Active codes */}
      {activeCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Disponibles</div>
          {activeCodes.map((c: any) => (
            <div key={c.id} className="rounded-2xl p-3" style={{ background: "var(--surface-inset)", border: "1.5px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-base font-bold text-gray-900">{c.code}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={roleBadgeStyle(c.role)}>
                    {roleLabel2(c.role)}
                  </span>
                </div>
                <button onClick={() => deleteMut.mutate(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center pressable" style={{ background: "var(--danger-bg)" }}>
                  <IconTrash size={13} color="var(--danger)" />
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Expira: {new Date(c.expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              {c.role === "admin" && (
                <div className="text-xs rounded-lg px-2.5 py-1.5 mb-2 font-medium" style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-3)" }}>
                  Recuerda compartir la clave de acceso institucional por separado
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => shareWhatsApp(c.code, c.role)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold pressable text-white"
                  style={{ background: "#25d366" }}
                >
                  <IconWhatsapp size={14} /> Compartir WhatsApp
                </button>
                <button
                  onClick={() => copyLink(c.code)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center pressable"
                  style={{ background: copied === c.code ? "var(--surface-3)" : "var(--surface-2)", color: copied === c.code ? "var(--success)" : "var(--text-secondary)" }}
                >
                  <IconCopiar size={15} />
                </button>
              </div>
              {copied === c.code && (
                <div className="text-xs text-green-600 font-medium mt-1.5 text-center">¡Enlace copiado!</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Used codes */}
      {usedCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ya utilizados</div>
          {usedCodes.slice(0, 5).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--surface-inset)", border: "1px solid var(--border)" }}>
              <div>
                <span className="font-mono text-sm text-gray-500 line-through">{c.code}</span>
                {c.usedByName && <span className="ml-2 text-xs text-gray-400">→ {c.usedByName}</span>}
              </div>
              <span className="text-xs text-gray-400">{new Date(c.usedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeCodes.length === 0 && usedCodes.length === 0 && (
        <div className="text-xs text-gray-400 text-center py-3">
          Sin códigos generados. Usa los botones de arriba para crear uno.
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

function NotificationsCard() {
  const { supported, enabled, denied, busy, enable, disable } = usePush();
  if (!supported) return null;
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-gray-900">Notificaciones push</div>
          <div className="text-xs text-gray-400">
            {denied
              ? "Bloqueadas en tu navegador. Actívalas en la configuración del sitio."
              : "Entérate al instante del estado de tu crédito y tus pagos."}
          </div>
        </div>
        <button
          className="pressable"
          disabled={busy || denied}
          onClick={() => (enabled ? disable() : enable())}
          style={{
            minWidth: 96, padding: "9px 14px", borderRadius: "var(--r-lg)", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#fff", opacity: busy || denied ? 0.6 : 1,
            background: enabled ? "var(--success)" : "#215DFF",
          }}
        >
          {busy ? "..." : enabled ? "Activas ✓" : "Activar"}
        </button>
      </div>
    </div>
  );
}


/* ─── Editable client profile form ─────────────────────────────────────────── */
function ClientProfileEditor({ client, onSaved }: { client: any; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [phone, setPhone]       = useState(client?.phone ?? "");
  const [altPhone, setAltPhone] = useState(client?.altPhone ?? "");
  const [address, setAddress]   = useState(client?.address ?? "");
  const [curp, setCurp]         = useState(client?.curp ?? "");
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState("");

  async function save() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${API}/me/profile`, {
        method: "PUT",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, altPhone, address, curp }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Error");
      setMsg("Datos guardados");
      setEditing(false);
      onSaved();
    } catch (e: any) {
      setMsg(e.message ?? "Error al guardar");
    } finally { setBusy(false); }
  }

  const fields = [
    { label: "Nombre completo", val: fullName, set: setFullName, type: "text", ph: "Tu nombre completo" },
    { label: "Teléfono", val: phone, set: setPhone, type: "tel", ph: "10 dígitos" },
    { label: "Teléfono alterno", val: altPhone, set: setAltPhone, type: "tel", ph: "Opcional" },
    { label: "Domicilio", val: address, set: setAddress, type: "text", ph: "Calle, número, colonia" },
    { label: "CURP", val: curp, set: setCurp, type: "text", ph: "18 caracteres" },
  ];

  if (!editing) {
    return (
      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información personal</div>
          <button onClick={() => setEditing(true)}
            className="text-xs font-bold pressable"
            style={{ color: "#215DFF", background: "none", border: "none", cursor: "pointer" }}>
            {client?.phone ? "Editar" : "Completar"}
          </button>
        </div>
        {[
          ["Nombre", client?.fullName],
          ["Teléfono", client?.phone],
          ["Tel. alterno", client?.altPhone],
          ["Domicilio", client?.address],
          ["CURP", client?.curp],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex items-start gap-3 text-sm">
            <div className="flex-1">
              <div className="text-xs text-gray-400">{String(label)}</div>
              <div className="font-medium text-gray-800">{val ? String(val) : "—"}</div>
            </div>
          </div>
        ))}
        {!client?.phone && (
          <div className="text-xs rounded-lg px-3 py-2 mt-1" style={{ background: "var(--surface-3)", color: "#215DFF" }}>
            Completa tu información para agilizar tu solicitud de crédito.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editar información</div>
      {fields.map(f => (
        <div key={f.label}>
          <div className="text-xs font-semibold text-gray-500 mb-1">{f.label}</div>
          <input
            type={f.type}
            value={f.val}
            onChange={e => f.set(e.target.value)}
            placeholder={f.ph}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:outline-none"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      ))}
      {msg && <div className="text-xs font-medium" style={{ color: msg.includes("Error") ? "var(--danger)" : "var(--success)" }}>{msg}</div>}
      <div className="flex gap-2 mt-1">
        <button onClick={() => setEditing(false)}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold pressable"
          style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
          Cancelar
        </button>
        <button onClick={save} disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white pressable"
          style={{ background: "#215DFF", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function Perfil() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [labelKey, setLabelKey] = useState("ine_front");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [purgeStep, setPurgeStep] = useState<0 | 1 | 2>(0);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { data: avatarData } = useQuery<{ url: string | null }>({
    queryKey: ["my-avatar"],
    queryFn: async () => { const r = await fetch(`${API}/uploads/avatar`, { headers: auth() }); if (!r.ok) return { url: null }; return r.json(); },
  });

  const { data: docRequests = [] } = useQuery<any[]>({
    queryKey: ["my-doc-requests"],
    queryFn: async () => { const r = await fetch(`${API}/document-requests/mine`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
  });

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `${API}/uploads/sign`,
        clientPayload: JSON.stringify({ type: "foto" }),
        headers: { Authorization: `Bearer ${localStorage.getItem("credeti_token")}` },
      });
      // Respaldo: registrar explícitamente por si el callback no disparó
      await fetch(`${API}/uploads/register`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, type: "foto", filename: file.name, mimeType: file.type }),
      });
      await qc.invalidateQueries({ queryKey: ["my-avatar"] });
    } catch (err) {
      console.error("avatar upload failed", err);
    } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setAvatarUploading(true);
    try {
      await fetch(`${API}/uploads/avatar`, { method: "DELETE", headers: auth() });
      await qc.invalidateQueries({ queryKey: ["my-avatar"] });
    } catch (err) {
      console.error("remove avatar failed", err);
    } finally {
      setAvatarUploading(false);
    }
  }

  const purgeM = useMutation({
    mutationFn: () =>
      fetch(`${API}/admin/purge-demo-data`, { method: "POST", headers: auth() }).then(r => r.json()),
    onSuccess: () => {
      setPurgeStep(0);
      window.location.reload();
    },
  });

  const deleteMeM = useMutation({
    mutationFn: () =>
      fetch(`${API}/users/me`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => {
      localStorage.clear();
      window.location.href = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/login";
    },
  });

  const rawUser  = localStorage.getItem("credeti_user");
  const userObj  = rawUser ? JSON.parse(rawUser) : {};
  const userRole: string = localStorage.getItem("credeti_role") ?? "client";
  const badge    = roleBadge(userRole);

  // For clients: load their own client record via /me/client (not /clients which is admin-only)
  const { data: clientData } = useQuery<any>({
    queryKey: ["my-client"],
    queryFn: async () => { const r = await fetch(`${API}/me/client`, { headers: auth() }); if (!r.ok) return null; return r.json(); },
    enabled: userRole === "client",
  });
  const client = clientData;

  const { data: docs = [], isLoading: loadingDocs } = useQuery<any[]>({
    queryKey: ["client-docs", client?.id],
    queryFn: async () => { const r = await fetch(`${API}/clients/${client!.id}/documents`, { headers: auth() }); if (!r.ok) throw new Error(); return r.json(); },
    enabled: !!client?.id,
  });

  const deleteMut = useMutation({
    mutationFn: (docId: number) =>
      fetch(`${API}/clients/${client!.id}/documents/${docId}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-docs", client?.id] }),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      // Lazy-import so this chunk is fetched only at upload time, never at
      // first render of the page (which keeps the cold boot resilient).
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `${API}/uploads/sign`,
        clientPayload: JSON.stringify({ type: labelKey }),
        headers: { Authorization: `Bearer ${localStorage.getItem("credeti_token")}` },
      });
      await fetch(`${API}/uploads/register`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, type: labelKey, filename: file.name, mimeType: file.type }),
      });
      // Si había una solicitud pendiente de este tipo, marcarla cumplida
      const matchReq = docRequests.find((r: any) => r.doc_type === labelKey);
      if (matchReq) {
        await fetch(`${API}/document-requests/${matchReq.id}/fulfill`, { method: "PATCH", headers: auth() });
        await qc.invalidateQueries({ queryKey: ["my-doc-requests"] });
      }
      await qc.invalidateQueries({ queryKey: ["client-docs", client?.id] });
      await qc.invalidateQueries({ queryKey: ["uploads-mine"] });
      setUploadMsg("Documento cargado correctamente");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir el documento";
      setUploadMsg(msg);
    } finally {
      setUploading(false);
    }
  }

  // Use the localStorage cache for the profile header for now. The
  // Clerk-driven version of this lives in the bridge component but is
  // currently disabled while we stabilize the boot; see the ClerkProfileHeader
  // follow-up. localStorage values are populated either by the legacy login
  // flow OR by the Clerk webhook + auth/me sync.
  const displayName    = userObj.fullName ?? userRole;
  const displayUsername = userObj.username ?? "";
  const displayEmail    = userObj.email ?? "";

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-8 px-4 pt-4">

        {/* Profile header card */}
        <div className="card flex flex-col items-center text-center py-6">
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" id="avatar-up" />
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={avatarUploading}
            style={{ position: "relative", background: "transparent", border: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}
            title="Cambiar foto de perfil"
          >
            <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", background: avatarData?.url ? "var(--surface-3)" : "var(--brand-blue-deep)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
              {avatarData?.url
                ? <img src={avatarData.url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>{displayName.trim().split(/\s+/).slice(0,2).map((w:string)=>w[0]?.toUpperCase()??"").join("")}</span>}
            </div>
            {/* Botón de cámara */}
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: "var(--brand-blue)", border: "2.5px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
              {avatarUploading
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
            </div>
          </button>
          <div className="text-xl font-extrabold text-gray-900 mt-3">{displayName}</div>
          {displayUsername && <div className="text-sm text-gray-400 mt-0.5">@{displayUsername}</div>}
          <div className="mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: badge.bg, color: badge.color }}>
              {roleLabel(userRole)}
            </span>
          </div>
          {displayEmail && (
            <div className="text-xs text-gray-400 mt-2">{displayEmail}</div>
          )}
          {avatarData?.url && (
            <button
              onClick={removeAvatar}
              disabled={avatarUploading}
              style={{ marginTop: 10, background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              Quitar foto
            </button>
          )}
        </div>

        {/* Client info + docs */}
        {userRole === "client" && (
          <>
            <ClientProfileEditor
              client={client}
              onSaved={() => qc.invalidateQueries({ queryKey: ["my-client"] })}
            />

            {/* Documentos — solo cuando ya hay registro de cliente */}
            {!client && (
              <div className="card" style={{ background: "var(--surface-inset)" }}>
                <div className="text-sm text-gray-500 text-center py-2">
                  Completa tu información personal arriba para poder cargar documentos.
                </div>
              </div>
            )}
            {client && (<>
            {/* Documentos solicitados por el asesor */}
            {docRequests.length > 0 && (
              <div className="card" style={{ background: "var(--info-bg, var(--surface-2))", border: "1.5px solid var(--brand-blue)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-blue)", marginBottom: 8 }}>Tu asesor te pide estos documentos</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {docRequests.map((r: any) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-blue)", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</span>
                    </div>
                  ))}
                </div>
                {docRequests[0]?.note && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>{docRequests[0].note}</div>
                )}
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Súbelos en la sección de abajo.</div>
              </div>
            )}

            {/* Document upload */}
            <div className="card" style={{ border: "2px dashed var(--border)", background: "var(--surface-inset)" }}>
              <div className="flex items-center gap-2 mb-3">
                <IconSubir size={20} color="#215DFF" />
                <div className="text-sm font-bold text-gray-800">Cargar documento</div>
              </div>
              <div className="flex flex-col gap-3">
                <select
                  value={labelKey}
                  onChange={e => setLabelKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:outline-none"
                >
                  {Object.entries(DOC_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" id="doc-up" />
                <label
                  htmlFor="doc-up"
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold pressable cursor-pointer"
                  style={{ background: "#215DFF", color: "#fff", opacity: uploading ? 0.6 : 1 }}
                >
                  {uploading ? <IconLoader size={16} className="animate-spin" /> : <IconSubir size={16} />}
                  {uploading ? "Subiendo..." : "Seleccionar archivo"}
                </label>
                {uploadMsg && (
                  <div className={`text-xs font-medium px-3 py-2 rounded-xl ${uploadMsg.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                    {uploadMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Documents list */}
            <div>
              <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <IconCarpeta size={16} /> Mis documentos
              </div>
              {loadingDocs ? (
                <div className="text-xs text-gray-400 text-center py-6">Cargando...</div>
              ) : (docs as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="mx-auto mb-2"><IconCarpeta size={30} color="var(--text-muted)" /></span>
                  <div className="text-sm">Sin documentos cargados</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(docs as any[]).slice().reverse().map((doc: any) => {
                    let parsed: any = null;
                    try { parsed = JSON.parse(doc.content); } catch { return null; }
                    if (!parsed) return null;
                    const isImage = parsed.mimeType?.startsWith("image/");
                    return (
                      <div key={doc.id} className="card flex items-center gap-3">
                        {isImage ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 cursor-pointer" onClick={() => setPreview(parsed)}>
                            <img src={`data:${parsed.mimeType};base64,${parsed.base64}`} alt={parsed.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <IconDocumento size={24} color="var(--text-muted)" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{parsed.label}</div>
                          <div className="text-xs text-gray-400">{parsed.filename}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {isImage && (
                            <button onClick={() => setPreview(parsed)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "var(--surface-3)" }}>
                              <IconOjo size={14} color="#2563eb" />
                            </button>
                          )}
                          <button onClick={() => deleteMut.mutate(doc.id)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "var(--danger-bg)" }}>
                            <IconBorrar size={14} color="var(--danger)" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>)}
          </>
        )}

        {/* Admin demote — only visible when already in admin mode */}
        {userRole === "admin" && <DemoteCard />}

        {/* Invite codes for admin and executive */}
        {(userRole === "admin" || userRole === "executive") && (
          <div className="card flex flex-col gap-4">
            <InviteCodes userRole={userRole} />
          </div>
        )}

        {/* Push notifications */}
        <NotificationsCard />

        {/* Legal links */}
        <div className="card" style={{ padding: "4px 0", background: "var(--surface)" }}>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ padding: "12px 16px 8px" }}>Información y legal</div>
          {[
            { label: "Preguntas frecuentes",   path: "/faq" },
            { label: "Términos y condiciones",  path: "/terminos" },
            { label: "Aviso de privacidad",     path: "/privacidad" },
          ].map(item => (
            <button
              key={item.path}
              className="pressable"
              onClick={() => navigate(item.path)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer",
                borderTop: "1px solid var(--surface-2)",
              }}
            >
              <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
          {userRole === "admin" && (
            <button
              className="pressable"
              onClick={() => navigate("/admin/faq")}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer",
                borderTop: "1px solid var(--surface-2)",
              }}
            >
              <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>Administrar FAQ</span>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
        </div>

        {/* App info */}
        <div className="card flex items-start gap-3" style={{ background: "var(--surface-inset)" }}>
          <span className="mt-0.5 shrink-0"><IconInfo size={20} color="var(--text-muted)" /></span>
          <div>
            <div className="text-sm font-semibold text-gray-700">credeti v1.0</div>
            <div className="text-xs text-gray-400 leading-relaxed mt-1">
              Sistema de gestión de créditos de credeti
            </div>
          </div>
        </div>

        {/* Admin: purge demo data */}
        {userRole === "admin" && (
          <button
            onClick={() => setPurgeStep(1)}
            className="w-full py-3 rounded-2xl text-sm font-semibold pressable"
            style={{ background: "var(--warning-bg)", color: "#c2410c", border: "1px solid var(--surface-3)" }}
          >
            Limpiar datos de prueba
          </button>
        )}

        {/* Acceso discreto al panel de administración — solo para admins */}
        {userRole === "admin" && (
          <button
            onClick={() => { window.location.href = "/admin"; }}
            className="w-full py-3.5 rounded-2xl text-sm font-bold pressable"
            style={{ background: "var(--brand-blue-deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Panel de administración
          </button>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            fetch(`${API}/auth/logout`, { method: "POST", headers: auth() }).finally(() => {
              localStorage.clear();
              window.location.href = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/login";
            });
          }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold pressable"
          style={{ background: "var(--danger-bg)", color: "#215DFF" }}
        >
          Cerrar sesión
        </button>

        {/* Delete account */}
        <button
          onClick={() => setDeleteStep(1)}
          className="w-full py-3 rounded-2xl text-sm font-semibold pressable"
          style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--surface-2)" }}
        >
          Eliminar mi cuenta
        </button>

        {/* Purge step 1 — warning */}
        {purgeStep === 1 && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", background: "var(--surface)", borderRadius: "24px 24px 0 0", padding: "28px 20px 48px" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 12 }}>
                Limpiar datos de prueba
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                Esto eliminará permanentemente todos los clientes, créditos, pagos y asesores de prueba. Tu cuenta de administrador se conserva.
              </div>
              <div style={{ borderRadius: "var(--r-lg)", background: "var(--warning-bg)", border: "1px solid var(--surface-3)", padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#c2410c", fontWeight: 600, marginBottom: 4 }}>Se eliminará:</div>
                <ul style={{ fontSize: 13, color: "#c2410c", paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
                  <li>Todos los clientes y sus documentos</li>
                  <li>Todos los créditos y pagos</li>
                  <li>Todos los asesores (ejecutivos)</li>
                  <li>Movimientos de caja y alertas</li>
                </ul>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPurgeStep(0)} className="pressable" style={{ flex: 1, padding: "13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface-inset)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
                  Cancelar
                </button>
                <button onClick={() => setPurgeStep(2)} className="pressable" style={{ flex: 1, padding: "13px", borderRadius: "var(--r-lg)", border: "none", background: "var(--warning)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purge step 2 — final confirm */}
        {purgeStep === 2 && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "28px 24px", maxWidth: 340, width: "100%" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", textAlign: "center", marginBottom: 10 }}>
                Confirmar limpieza
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                Esta es la última confirmación. Todos los datos de prueba se eliminarán de forma permanente. No se puede deshacer.
              </div>
              {purgeM.isError && (
                <div style={{ fontSize: 13, color: "var(--danger)", textAlign: "center", marginBottom: 12 }}>
                  Error al limpiar datos. Intenta de nuevo.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => purgeM.mutate()}
                  disabled={purgeM.isPending}
                  className="pressable"
                  style={{ padding: "13px", borderRadius: "var(--r-lg)", border: "none", background: "var(--warning)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: purgeM.isPending ? 0.7 : 1 }}
                >
                  {purgeM.isPending ? "Limpiando..." : "Sí, eliminar todos los datos de prueba"}
                </button>
                <button onClick={() => setPurgeStep(0)} className="pressable" style={{ padding: "13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface-inset)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm — step 1 */}
        {deleteStep === 1 && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", background: "var(--surface)", borderRadius: "24px 24px 0 0", padding: "28px 20px 48px" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 12 }}>
                Eliminar cuenta
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                Al eliminar tu cuenta se eliminarán permanentemente tus datos personales. Esta acción no se puede deshacer.
              </div>
              <div style={{ borderRadius: "var(--r-lg)", background: "var(--surface-3)", border: "1px solid var(--surface-3)", padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600, marginBottom: 4 }}>Lo que se eliminará:</div>
                <ul style={{ fontSize: 13, color: "var(--danger)", paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
                  <li>Nombre, correo y datos de perfil</li>
                  <li>Sesión activa</li>
                </ul>
                <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>
                  Los registros de transacciones y créditos se conservan por obligación legal.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDeleteStep(0)}
                  className="pressable"
                  style={{ flex: 1, padding: "13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface-inset)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setDeleteStep(2)}
                  className="pressable"
                  style={{ flex: 1, padding: "13px", borderRadius: "var(--r-lg)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm — step 2 final */}
        {deleteStep === 2 && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "28px 24px", maxWidth: 340, width: "100%" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", textAlign: "center", marginBottom: 10 }}>
                Confirma la eliminación
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                Esta es la última confirmación. Tu cuenta y datos personales serán eliminados de forma permanente.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => deleteMeM.mutate()}
                  disabled={deleteMeM.isPending}
                  className="pressable"
                  style={{ padding: "13px", borderRadius: "var(--r-lg)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: deleteMeM.isPending ? 0.7 : 1 }}
                >
                  {deleteMeM.isPending ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                </button>
                <button
                  onClick={() => setDeleteStep(0)}
                  className="pressable"
                  style={{ padding: "13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "var(--surface-inset)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  No, conservar mi cuenta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setPreview(null)}>
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
              <IconCerrar size={20} color="#1f2937" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900 px-4 py-3">
                <div className="text-white text-sm font-semibold">{preview.label}</div>
              </div>
              <img src={`data:${preview.mimeType};base64,${preview.base64}`} alt={preview.label} className="w-full max-h-[60vh] object-contain bg-black" />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* ─── Admin-mode self-elevation card + sheet ─────────────────────────────── */
function AdminModeCard() {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function elevate() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API}/users/me/elevate`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "No se pudo activar"); return; }
      if (data.token) localStorage.setItem("credeti_token", data.token);
      if (data.user) {
        localStorage.setItem("credeti_role", data.user.role);
        localStorage.setItem("credeti_user", JSON.stringify(data.user));
      }
      window.location.href = "/admin";
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setPwd(""); setErr(""); }}
        className="card flex items-center gap-3 text-left pressable w-full"
        style={{
          background: "linear-gradient(135deg, var(--surface-3) 0%, var(--surface-3) 100%)",
          border: "1.5px solid var(--surface-3)",
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--text-secondary)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900">Modo administrador</div>
          <div className="text-xs text-gray-500">Acceder al panel de control con clave maestra</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--text-secondary)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">Activar modo administrador</div>
                <div className="text-xs text-gray-500 mt-0.5">Ingresa la clave maestra para tomar control de la operación.</div>
              </div>
            </div>

            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Clave maestra</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={e => { setPwd(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && pwd && elevate()}
                placeholder="••••••••"
                autoFocus
                className="w-full h-12 px-4 pr-16 rounded-xl border-2 outline-none text-sm font-medium"
                style={{ borderColor: err ? "#fca5a5" : "var(--border)", background: "#f9fafb" }}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500"
              >
                {show ? "Ocultar" : "Ver"}
              </button>
            </div>

            {err && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--surface-3)", color: "var(--danger)", border: "1px solid var(--surface-3)" }}>
                {err}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-12 rounded-xl text-sm font-bold pressable"
                style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={elevate}
                disabled={!pwd || busy}
                className="flex-1 h-12 rounded-xl text-sm font-bold text-white pressable disabled:opacity-60"
                style={{ background: "var(--text-secondary)" }}
              >
                {busy ? "Verificando…" : "Acceder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Switch role from admin ─────────────────────────────────────────────── */
function DemoteCard() {
  const [open, setOpen]   = useState(false);
  const [target, setTarget] = useState<"executive" | "client">("client");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  async function switchRole() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API}/users/me/demote`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: target }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "No se pudo cambiar el rol"); return; }
      if (data.token) localStorage.setItem("credeti_token", data.token);
      if (data.user) {
        localStorage.setItem("credeti_role", data.user.role);
        localStorage.setItem("credeti_user", JSON.stringify(data.user));
      }
      window.location.href = target === "executive" ? "/dashboard" : "/mi-credito";
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const roleOptions = [
    { value: "executive" as const, label: "Asesor", desc: "Gestiona clientes y cobranza", color: "#2563eb", bg: "var(--surface-3)", border: "var(--surface-3)" },
    { value: "client"   as const, label: "Cliente", desc: "Vista del acreditado",         color: "var(--success)", bg: "var(--surface-3)", border: "var(--surface-3)" },
  ];

  return (
    <>
      <button
        onClick={() => { setOpen(true); setErr(""); }}
        className="card flex items-center gap-3 text-left pressable w-full"
        style={{ background: "linear-gradient(135deg, var(--surface-3) 0%, var(--surface-3) 100%)", border: "1.5px solid var(--surface-3)" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--success)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900">Cambiar modo de usuario</div>
          <div className="text-xs text-gray-500">Entrar como asesor o cliente</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
            <div className="text-base font-bold text-gray-900 mb-1">Cambiar modo de usuario</div>
            <div className="text-xs text-gray-500 mb-5">Elige el rol al que quieres cambiar temporalmente. Puedes volver a modo administrador con la clave maestra.</div>

            <div className="flex flex-col gap-3 mb-5">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className="flex items-center gap-3 p-4 rounded-xl text-left pressable"
                  style={{
                    border: `2px solid ${target === opt.value ? opt.color : "var(--border)"}`,
                    background: target === opt.value ? opt.bg : "#f9fafb",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: target === opt.value ? opt.color : "#d1d5db" }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: target === opt.value ? opt.color : "var(--text-primary)" }}>{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {err && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--surface-3)", color: "var(--danger)", border: "1px solid var(--surface-3)" }}>
                {err}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-12 rounded-xl text-sm font-bold pressable"
                style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={switchRole}
                disabled={busy}
                className="flex-1 h-12 rounded-xl text-sm font-bold text-white pressable disabled:opacity-60"
                style={{ background: "var(--success)" }}
              >
                {busy ? "Cambiando…" : `Entrar como ${target === "executive" ? "Asesor" : "Cliente"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
