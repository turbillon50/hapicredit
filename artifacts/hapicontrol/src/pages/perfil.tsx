import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import {
  IconSubir, IconCarpeta, IconDocumento, IconBorrar,
  IconOjo, IconCerrar, IconLoader, IconInfo, IconTelefono, IconUbicacion, IconID,
} from "@/components/hapi/HapiIcons";
import { useState, useRef } from "react";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

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
  if (role === "admin")     return { bg: "#f5f3ff", color: "#7c3aed" };
  if (role === "executive") return { bg: "#eff6ff", color: "#2563eb" };
  return { bg: "#f0fdf4", color: "#16a34a" };
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

function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [generating, setGenerating] = useState<"executive" | "client" | null>(null);
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

  async function generate(role: "executive" | "client") {
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
    const roleTxt = role === "executive" ? "asesor" : "acreditado";
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a HapiCredit como ${roleTxt}.\n\nRegistrate con este enlace:\n${link}\n\n_HapiCredit — Tu crédito, Tu impulso_`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const activeCodes = (codes as any[]).filter((c: any) => c.isActive && !c.usedAt);
  const usedCodes   = (codes as any[]).filter((c: any) => c.usedAt);

  const canGenExec = userRole === "admin";
  const canGenClient = userRole === "admin" || userRole === "executive";

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Códigos de invitación</div>

      {/* Generate buttons */}
      <div className="flex gap-2">
        {canGenExec && (
          <button
            onClick={() => generate("executive")}
            disabled={generating === "executive"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold pressable"
            style={{ background: "#eff6ff", color: "#2563eb" }}
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
            style={{ background: "#f0fdf4", color: "#16a34a" }}
          >
            {generating === "client" ? <IconLoader size={14} className="animate-spin" /> : <IconMas size={14} />}
            Acreditado
          </button>
        )}
      </div>

      {isLoading && <div className="text-xs text-gray-400 text-center py-3">Cargando...</div>}

      {/* Active codes */}
      {activeCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Disponibles</div>
          {activeCodes.map((c: any) => (
            <div key={c.id} className="rounded-2xl p-3" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-base font-bold text-gray-900">{c.code}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={c.role === "executive" ? { background: "#eff6ff", color: "#2563eb" } : { background: "#f0fdf4", color: "#16a34a" }}>
                    {c.role === "executive" ? "Asesor" : "Acreditado"}
                  </span>
                </div>
                <button onClick={() => deleteMut.mutate(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center pressable" style={{ background: "#fff0f0" }}>
                  <IconTrash size={13} color="#ef4444" />
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Expira: {new Date(c.expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
              </div>
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
                  style={{ background: copied === c.code ? "#f0fdf4" : "#f1f5f9", color: copied === c.code ? "#16a34a" : "#64748b" }}
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
            <div key={c.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
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
export default function Perfil() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [labelKey, setLabelKey] = useState("ine_front");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const rawUser  = localStorage.getItem("hapi_user");
  const userObj  = rawUser ? JSON.parse(rawUser) : {};
  const userRole: string = localStorage.getItem("hapi_role") ?? "client";
  const badge    = roleBadge(userRole);

  // For clients: load their client record
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["all-clients"],
    queryFn: async () => { const r = await fetch(`${API}/clients`, { headers: auth() }); if (!r.ok) return []; return r.json(); },
    enabled: userRole === "client",
  });
  const client = (clients as any[])[0];

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
    if (!file || !client?.id) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`${API}/clients/${client.id}/documents`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, base64, label: DOC_LABELS[labelKey] ?? labelKey }),
      });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ["client-docs", client?.id] });
      setUploadMsg("Documento cargado correctamente");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setUploadMsg("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  }

  const displayName = userObj.fullName ?? userRole;

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-8 px-4 pt-4">

        {/* Profile header card */}
        <div className="card flex flex-col items-center text-center py-6">
          <Avatar name={displayName} size="lg" />
          <div className="text-xl font-extrabold text-gray-900 mt-3">{displayName}</div>
          <div className="text-sm text-gray-400 mt-0.5">@{userObj.username ?? ""}</div>
          <div className="mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: badge.bg, color: badge.color }}>
              {roleLabel(userRole)}
            </span>
          </div>
          {userObj.email && (
            <div className="text-xs text-gray-400 mt-2">{userObj.email}</div>
          )}
        </div>

        {/* Client info + docs */}
        {userRole === "client" && (
          <>
            {client && (
              <div className="card flex flex-col gap-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información personal</div>
                {[
                  [<IconTelefono size={16} />, "Teléfono",   client.phone],
                  [<IconTelefono size={16} />, "Tel. alterno", client.altPhone || "—"],
                  [<IconUbicacion size={16} />, "Domicilio",  client.address || "—"],
                  [<IconID size={16} />, "CURP",        client.curp || "—"],
                ].map(([icon, label, val]) => (
                  <div key={String(label)} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-400 mt-0.5">{icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">{String(label)}</div>
                      <div className="font-medium text-gray-800">{String(val)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document upload */}
            <div className="card" style={{ border: "2px dashed #e2e8f0", background: "#f8fafc" }}>
              <div className="flex items-center gap-2 mb-3">
                <IconSubir size={20} color="#142246" />
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
                  style={{ background: "#142246", color: "#fff", opacity: uploading ? 0.6 : 1 }}
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
                  <span className="mx-auto mb-2"><IconCarpeta size={30} color="#9ca3af" /></span>
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
                            <IconDocumento size={24} color="#9ca3af" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{parsed.label}</div>
                          <div className="text-xs text-gray-400">{parsed.filename}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {isImage && (
                            <button onClick={() => setPreview(parsed)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#f0f7ff" }}>
                              <IconOjo size={14} color="#2563eb" />
                            </button>
                          )}
                          <button onClick={() => deleteMut.mutate(doc.id)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#fff0f0" }}>
                            <IconBorrar size={14} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Invite codes for admin and executive */}
        {(userRole === "admin" || userRole === "executive") && (
          <div className="card flex flex-col gap-4">
            <InviteCodes userRole={userRole} />
          </div>
        )}

        {/* App info */}
        <div className="card flex items-start gap-3" style={{ background: "#f8fafc" }}>
          <span className="mt-0.5 shrink-0"><IconInfo size={20} color="#9ca3af" /></span>
          <div>
            <div className="text-sm font-semibold text-gray-700">HapiCredit v1.0</div>
            <div className="text-xs text-gray-400 leading-relaxed mt-1">
              Sistema de gestión de créditos de Grupo CAFJA · HapiCredit
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            fetch(`${API}/auth/logout`, { method: "POST", headers: auth() }).finally(() => {
              localStorage.clear();
              window.location.href = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/login";
            });
          }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold pressable"
          style={{ background: "#fff0f0", color: "#e84545" }}
        >
          Cerrar sesión
        </button>
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
