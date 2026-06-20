import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { IconEquipo, IconMas } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const ROLE_LABEL: Record<string, string> = { admin: "Administrador", executive: "Asesor", client: "Acreditado" };
const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  admin:     { bg: "var(--surface-3)", color: "var(--text-secondary)" },
  executive: { bg: "rgba(33,93,255,0.10)", color: "var(--brand-blue)" },
  client:    { bg: "var(--surface-3)", color: "#166534" },
};

type Code = {
  id: number; code: string; role: string; isActive: boolean;
  expiresAt: string; createdAt: string; usedAt: string | null; usedByName: string | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminCodigos() {
  const [generating, setGenerating] = useState(false);
  const [newRole, setNewRole] = useState<"executive" | "client" | "admin">("executive");
  const [copied, setCopied] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<Code | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailName, setEmailName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const qc = useQueryClient();

  const userRole = (() => { try { return JSON.parse(localStorage.getItem("credeti_user") || "{}").role; } catch { return ""; } })();

  const { data: codes = [], isLoading } = useQuery<Code[]>({
    queryKey: ["invite-codes-mine"],
    queryFn: async () => {
      const res = await fetch(`${API}/invite-codes/mine`, { headers: auth() });
      if (!res.ok) throw new Error("Error al cargar códigos");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch(`${API}/invite-codes/generate`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invite-codes-mine"] }); setGenerating(false); },
  });

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function openWhatsApp(code: string, role: string) {
    const appBase = window.location.origin + (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");
    const link = `${appBase}/registro?inv=${code}`;
    let text = "";

    if (role === "admin") {
      text =
        `*credeti — Invitación de Administrador*\n\n` +
        `Hola! Eres parte del equipo directivo de *credeti* como *Administrador*.\n\n` +
        `Para comenzar:\n` +
        `1. Abre este enlace: ${link}\n` +
        `2. Ingresa la clave de acceso institucional\n` +
        `3. Crea tu cuenta con correo y verifícala\n` +
        `4. Instala la app: menú del navegador → *"Agregar a inicio"*\n\n` +
        `_Válido 30 días · Código de un solo uso_\n\n` +
        `*credeti* — Creemos en ti`;
    } else if (role === "executive") {
      text =
        `*credeti — Invitación de Asesor*\n\n` +
        `Hola! Te invito a ser parte del equipo de asesores de *credeti*.\n\n` +
        `Para registrarte como *Asesor*:\n` +
        `1. Entra a: ${link}\n` +
        `2. Ingresa la clave de acceso que te compartí\n` +
        `3. Crea tu cuenta con correo y verifícala\n` +
        `4. Instala la app: menú del navegador → *"Agregar a inicio"*\n\n` +
        `_Válido 30 días · Código de un solo uso_\n\n` +
        `*credeti* — Creemos en ti`;
    } else {
      text =
        `*credeti — Tu acceso está listo*\n\n` +
        `Hola! Tu acceso a *credeti* ha sido habilitado.\n\n` +
        `Para registrarte y consultar tu crédito:\n` +
        `1. Entra a este enlace: ${link}\n` +
        `2. Crea tu cuenta con correo y verifícala\n` +
        `3. Instala la app: menú del navegador → *"Agregar a inicio"*\n\n` +
        `_Válido 30 días · Código de un solo uso_\n\n` +
        `*credeti* — Creemos en ti`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function openEmailModal(c: Code) {
    setEmailModal(c);
    setEmailTo("");
    setEmailName("");
    setEmailSent(false);
    setEmailError("");
  }

  async function sendEmail() {
    if (!emailModal || !emailTo) return;
    setEmailLoading(true);
    setEmailError("");
    try {
      const res = await fetch(`${API}/invite-codes/send-email`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailModal.code, toEmail: emailTo, toName: emailName }),
      });
      const data = await res.json();
      if (!res.ok) { setEmailError(data.error || "Error al enviar"); return; }
      setEmailSent(true);
    } finally {
      setEmailLoading(false);
    }
  }

  const pendingCodes = codes.filter(c => !c.usedAt && c.isActive);
  const usedCodes = codes.filter(c => c.usedAt);

  return (
    <Layout>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)" }}>Códigos de invitación</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Genera y comparte códigos para registrar nuevos usuarios</p>
          </div>
          <button
            onClick={() => setGenerating(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            <IconMas size={16} /> Nuevo
          </button>
        </div>

        {/* Generate modal */}
        {generating && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Generar código</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>Selecciona el rol para el que generarás el código:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {(userRole === "admin" ? ["admin", "executive", "client"] : ["client"]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewRole(r as "executive" | "client" | "admin")}
                    style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${newRole === r ? ROLE_COLOR[r].color : "var(--border)"}`, background: newRole === r ? ROLE_COLOR[r].bg : "white", cursor: "pointer", textAlign: "left", fontWeight: 600, color: newRole === r ? ROLE_COLOR[r].color : "var(--text-primary)" }}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
                {newRole === "admin" && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--surface-3)", border: "1px solid var(--surface-3)", borderRadius: 8, padding: "8px 12px", lineHeight: 1.5 }}>
                    El administrador invitado tendrá su propio árbol independiente. Comparte la clave de acceso institucional por separado.
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setGenerating(false)} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "white", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={() => generateMutation.mutate(newRole)} disabled={generateMutation.isPending} style={{ flex: 2, padding: "12px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: generateMutation.isPending ? 0.7 : 1 }}>
                  {generateMutation.isPending ? "Generando..." : "Generar"}
                </button>
              </div>
              {generateMutation.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(generateMutation.error as Error).message}</p>}
            </div>
          </div>
        )}

        {/* Email modal */}
        {emailModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
            <div style={{ background: "white", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxWidth: 540 }}>
              {emailSent ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="var(--surface-3)"/>
                      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy-800)", marginBottom: 8 }}>Correo enviado</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>El código <strong>{emailModal.code}</strong> fue enviado a <strong>{emailTo}</strong></p>
                  <button onClick={() => setEmailModal(null)} style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Listo</button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy-800)", marginBottom: 4 }}>Enviar por correo</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                    Codigo <strong style={{ fontFamily: "monospace", fontSize: 15, letterSpacing: 2 }}>{emailModal.code}</strong> · {ROLE_LABEL[emailModal.role]}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Correo del destinatario *</label>
                      <input value={emailTo} onChange={e => setEmailTo(e.target.value)} type="email" placeholder="ejemplo@correo.com" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre (opcional)</label>
                      <input value={emailName} onChange={e => setEmailName(e.target.value)} placeholder="Nombre del invitado" style={inputStyle} />
                    </div>
                  </div>
                  {emailError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{emailError}</p>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setEmailModal(null)} style={{ flex: 1, padding: "12px", border: "1.5px solid var(--border)", borderRadius: 10, background: "white", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={sendEmail} disabled={emailLoading || !emailTo} style={{ flex: 2, padding: "12px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: emailLoading || !emailTo ? 0.6 : 1 }}>
                      {emailLoading ? "Enviando..." : "Enviar código"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isLoading && <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 40 }}>Cargando...</p>}

        {/* Pending codes */}
        {pendingCodes.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Disponibles ({pendingCodes.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingCodes.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 14, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1.5px solid var(--surface-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.12em", color: "var(--navy-800)", fontFamily: "monospace" }}>{c.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: ROLE_COLOR[c.role]?.bg, color: ROLE_COLOR[c.role]?.color }}>{ROLE_LABEL[c.role]}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: c.role === "admin" ? 8 : 12 }}>Expira: {formatDate(c.expiresAt)}</p>
                  {c.role === "admin" && (
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--surface-3)", border: "1px solid var(--surface-3)", borderRadius: 8, padding: "6px 10px", marginBottom: 12, lineHeight: 1.5 }}>
                      Recuerda compartir la clave institucional por separado
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => copyCode(c.code)} style={{ flex: 1, padding: "9px", border: "1.5px solid var(--border)", borderRadius: 8, background: copied === c.code ? "var(--surface-3)" : "white", color: copied === c.code ? "#166534" : "var(--text-primary)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                      {copied === c.code ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      onClick={() => openEmailModal(c)}
                      style={{ flex: 1, padding: "9px", border: "1.5px solid var(--border)", borderRadius: 8, background: "white", color: "var(--text-primary)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                    >
                      Correo
                    </button>
                    <button
                      onClick={() => openWhatsApp(c.code, c.role)}
                      style={{ flex: 1, padding: "9px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.123 1.526 5.855L0 24l6.337-1.502A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.882 0-3.648-.511-5.163-1.4l-.37-.22-3.762.892.936-3.647-.242-.378A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Used codes */}
        {usedCodes.length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Usados ({usedCodes.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {usedCodes.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--surface-2)" }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{c.code}</span>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{c.usedByName || "—"} · {c.usedAt ? formatDate(c.usedAt) : ""}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--surface-2)", color: "var(--text-secondary)" }}>{ROLE_LABEL[c.role]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && codes.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <IconEquipo size={40} color="var(--text-muted)" />
            <p style={{ color: "var(--text-muted)", marginTop: 12 }}>Aún no has generado códigos</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Toca "Nuevo" para crear tu primer código de invitación</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  fontSize: 15,
  marginTop: 6,
  boxSizing: "border-box",
  outline: "none",
};
