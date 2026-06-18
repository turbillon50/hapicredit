import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TOKEN = () => localStorage.getItem("credeti_token") ?? "";
const HDR = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` });

async function fetchConfig(): Promise<Record<string, string>> {
  const r = await fetch("/api/config", { headers: HDR() });
  if (!r.ok) throw new Error("Error al cargar configuración");
  return r.json();
}
async function saveConfig(data: Record<string, string>): Promise<void> {
  const r = await fetch("/api/config", { method: "PUT", headers: HDR(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error("Error al guardar");
}
async function testPush(): Promise<void> {
  const r = await fetch("/api/push/test", { method: "POST", headers: HDR() });
  if (!r.ok) throw new Error("Error en push test");
}

function Field({
  label, field, cfg, set, type = "number", min, max, suffix
}: {
  label: string; field: string; cfg: Record<string, string>;
  set: (k: string, v: string) => void;
  type?: string; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <input
          type={type}
          min={min}
          max={max}
          value={cfg[field] ?? ""}
          onChange={e => set(field, e.target.value)}
          className="input-base"
          style={{ borderRadius: suffix ? "12px 0 0 12px" : 12, height: 44, fontSize: 15, flex: 1 }}
        />
        {suffix && (
          <div style={{
            height: 44, padding: "0 12px", display: "flex", alignItems: "center",
            background: "var(--surface-2)", border: "1.5px solid var(--border-mid)",
            borderLeft: "none", borderRadius: "0 12px 12px 0",
            fontSize: 13, color: "var(--text-secondary)", fontWeight: 700,
          }}>{suffix}</div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}


// --- Invitar por WhatsApp ---------------------------------------------------
const STAFF_TOKEN = import.meta.env.VITE_STAFF_ACCESS_TOKEN as string | undefined;
const APP_BASE    = (import.meta.env.VITE_APP_URL as string | undefined) ?? "https://www.crede-ti.info";

function InviteByWhatsApp() {
  const [role, setRole]             = useState<"admin" | "executive">("executive");
  const [copied, setCopied]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [err, setErr]               = useState("");

  const accessUrl = STAFF_TOKEN ? `${APP_BASE}/acceso/${STAFF_TOKEN}` : null;

  async function generateCode() {
    setGenerating(true); setErr("");
    try {
      const r = await fetch("/api/invite-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("credeti_token")}` },
        body: JSON.stringify({ role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Error");
      setInviteCode(d.code);
    } catch (e: any) { setErr(e.message ?? "Error"); }
    finally { setGenerating(false); }
  }

  function buildMsg() {
    if (!accessUrl || !inviteCode) return "";
    const rl = role === "admin" ? "administrador" : "asesor";
    const msg = [
      "Hola, te invito a Crede-Ti como " + rl + ".",
      "",
      "1) Crea tu cuenta en:",
      APP_BASE + "/registro",
      "",
      "Tu codigo de invitacion: " + inviteCode,
      "",
      "2) Accede al panel con este link:",
      accessUrl,
    ].join("\n");
    return encodeURIComponent(msg);
  }

  return (
    <div style={{ padding: "0 16px", marginBottom: 24 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Invitar al equipo por WhatsApp
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          Genera un mensaje con el codigo y link de acceso listo para enviar.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["executive", "admin"] as const).map(r => (
            <button key={r} onClick={() => { setRole(r); setInviteCode(null); }}
              style={{
                flex: 1, padding: "9px", borderRadius: 12,
                border: role === r ? "1.5px solid var(--brand-blue)" : "1.5px solid var(--border)",
                background: role === r ? "#eff6ff" : "var(--surface-2)",
                color: role === r ? "var(--brand-blue)" : "var(--text-muted)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
              {r === "executive" ? "Asesor" : "Admin"}
            </button>
          ))}
        </div>

        {!inviteCode ? (
          <button onClick={generateCode} disabled={generating}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: generating ? "var(--surface-2)" : "var(--brand-blue)",
              color: generating ? "var(--text-muted)" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: generating ? "default" : "pointer",
            }}>
            {generating ? "Generando..." : "Generar codigo de invitacion"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Codigo de registro</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.12em", color: "var(--text-primary)" }}>{inviteCode}</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface)", padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
                {role === "executive" ? "Asesor" : "Admin"}
              </span>
            </div>

            <a href={"https://wa.me/?text=" + buildMsg()} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px", borderRadius: 12, textDecoration: "none",
                background: "#25d366", color: "#fff", fontSize: 14, fontWeight: 700,
              }}>
              Enviar por WhatsApp
            </a>

            {accessUrl && (
              <button onClick={() => {
                  navigator.clipboard.writeText(accessUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  padding: "10px", borderRadius: 12, border: "1.5px solid var(--border)",
                  background: "var(--surface-2)", color: "var(--text-secondary)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                {copied ? "Copiado!" : "Copiar link de acceso al panel"}
              </button>
            )}

            <button onClick={() => setInviteCode(null)}
              style={{ padding: "8px", border: "none", background: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
              Generar nueva invitacion
            </button>
          </div>
        )}

        {err && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{err}</div>}
      </div>
    </div>
  );
}

export default function Configuracion() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-config"], queryFn: fetchConfig });
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "ok" | "err">("idle");
  const [subStatus, setSubStatus] = useState<"idle" | "subscribing" | "subscribed" | "err">("idle");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (data) { setCfg(data); setDirty(false); }
  }, [data]);

  const set = (k: string, v: string) => {
    setCfg(p => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: () => saveConfig(cfg),
    onSuccess: () => {
      setDirty(false);
      setSaveMsg("Guardado ✓");
      qc.invalidateQueries({ queryKey: ["admin-config"] });
      qc.invalidateQueries({ queryKey: ["calc-config"] });
      setTimeout(() => setSaveMsg(""), 2500);
    },
    onError: () => setSaveMsg("Error al guardar"),
  });

  const handleSubscribePush = async () => {
    setSubStatus("subscribing");
    try {
      const r = await fetch("/api/push/public-key", { headers: HDR() });
      const { publicKey } = await r.json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      const j = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST", headers: HDR(),
        body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
      });
      setSubStatus("subscribed");
    } catch (e) {
      console.error(e);
      setSubStatus("err");
    }
  };

  const handleTestPush = async () => {
    setPushStatus("idle");
    try {
      await testPush();
      setPushStatus("ok");
      setTimeout(() => setPushStatus("idle"), 3000);
    } catch {
      setPushStatus("err");
    }
  };

  if (isLoading) return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
    </div>
  );

  return (
    <div style={{ padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 16 }} className="fade-up">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>Configuración</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Ajusta montos, tasas y parámetros del negocio
          </p>
        </div>
        {dirty && (
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            style={{
              padding: "10px 20px", borderRadius: 100, border: "none",
              background: "var(--brand-blue)", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              opacity: saveMut.isPending ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {saveMut.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </div>

      {saveMsg && (
        <div style={{
          padding: "10px 16px", borderRadius: 12,
          background: saveMsg.startsWith("Error") ? "var(--danger-bg)" : "var(--success-bg)",
          color: saveMsg.startsWith("Error") ? "var(--danger)" : "var(--success)",
          fontSize: 13, fontWeight: 600,
        }}>{saveMsg}</div>
      )}

      {/* Crédito nuevo */}
      <Section title="Crédito nuevo — primer ciclo" icon="🆕">
        <Field label="Monto mínimo" field="calc_nuevo_min" cfg={cfg} set={set} min={100} max={99999} suffix="$" />
        <Field label="Monto máximo" field="calc_nuevo_max" cfg={cfg} set={set} min={100} max={99999} suffix="$" />
        <Field label="Plazo (semanas fijas)" field="calc_nuevo_plazo" cfg={cfg} set={set} min={1} max={52} suffix="sem" />
        <Field label="Tasa total" field="calc_nuevo_tasa" cfg={cfg} set={set} min={1} max={200} suffix="%" />
      </Section>

      {/* Crédito existente */}
      <Section title="Crédito existente — renovación" icon="🔄">
        <Field label="Monto mínimo" field="calc_exist_min" cfg={cfg} set={set} min={100} max={999999} suffix="$" />
        <Field label="Monto máximo" field="calc_exist_max" cfg={cfg} set={set} min={100} max={999999} suffix="$" />
        <Field label="Plazo mínimo" field="calc_exist_plazo_min" cfg={cfg} set={set} min={1} max={52} suffix="sem" />
        <Field label="Plazo máximo" field="calc_exist_plazo_max" cfg={cfg} set={set} min={1} max={104} suffix="sem" />
        <Field label="Tasa mensual" field="calc_exist_tasa_mensual" cfg={cfg} set={set} min={0.1} max={100} suffix="%" />
      </Section>

      {/* Empresa */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏢</span>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Información de la empresa</span>
        </div>
        <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          <Field label="Nombre" field="empresa_nombre" cfg={cfg} set={set} type="text" />
          <Field label="Tagline" field="empresa_tagline" cfg={cfg} set={set} type="text" />
          <Field label="WhatsApp" field="empresa_whatsapp" cfg={cfg} set={set} type="text" />
          <Field label="Email contacto" field="empresa_email" cfg={cfg} set={set} type="email" />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Notificaciones push</span>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Activa las notificaciones en este dispositivo para recibir alertas de nuevas solicitudes,
            pagos pendientes y eventos importantes en tiempo real.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleSubscribePush}
              disabled={subStatus === "subscribing" || subStatus === "subscribed"}
              style={{
                padding: "11px 20px", borderRadius: 100, border: "none",
                background: subStatus === "subscribed" ? "var(--success-bg)" : "var(--brand-blue)",
                color: subStatus === "subscribed" ? "var(--success)" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                opacity: subStatus === "subscribing" ? 0.7 : 1,
              }}
            >
              {subStatus === "subscribing" ? "Activando…"
                : subStatus === "subscribed" ? "✓ Activadas en este dispositivo"
                : subStatus === "err" ? "Error — reintentar"
                : "🔔 Activar notificaciones"}
            </button>
            <button
              onClick={handleTestPush}
              style={{
                padding: "11px 20px", borderRadius: 100,
                border: "1.5px solid var(--border-mid)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {pushStatus === "ok" ? "✓ Recibida" : pushStatus === "err" ? "Error" : "Enviar prueba"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 10 }}>
            <strong style={{ color: "var(--text-secondary)" }}>¿Cuándo recibes notificaciones?</strong><br />
            • Nueva solicitud de crédito de un cliente<br />
            • Pago registrado pendiente de validación<br />
            • Alertas de mora en la cartera
          </div>
        </div>
      </div>

      {/* Save sticky bar */}
      {dirty && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--surface)", borderTop: "1px solid var(--border)",
          padding: "12px 20px", display: "flex", justifyContent: "space-between",
          alignItems: "center", zIndex: 100,
        }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Tienes cambios sin guardar</span>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            style={{
              padding: "10px 24px", borderRadius: 100, border: "none",
              background: "var(--brand-blue)", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {saveMut.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
