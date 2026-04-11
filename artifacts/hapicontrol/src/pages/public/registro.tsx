import { useState } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

type Role = "client" | "executive" | "admin";

function roleHome(role: string) {
  if (role === "admin")     return "/admin";
  if (role === "executive") return "/dashboard";
  return "/mi-credito";
}

const roles: { id: Role; label: string; sublabel: string; desc: string; color: string; bg: string; border: string }[] = [
  {
    id: "client",
    label: "Acreditado",
    sublabel: "Cliente de crédito",
    desc: "Solicita y administra tus créditos personales o de negocio.",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  {
    id: "executive",
    label: "Asesor",
    sublabel: "Ejecutivo de campo",
    desc: "Gestiona clientes, cobra pagos y da seguimiento a tu cartera.",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    id: "admin",
    label: "Administrador",
    sublabel: "Control total",
    desc: "Acceso completo a cartera, reportes, usuarios y árbol de red.",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
];

export default function Registro() {
  const [, navigate] = useLocation();

  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [role, setRole]               = useState<Role | null>(null);
  const [staffPass, setStaffPass]     = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [staffError, setStaffError]   = useState("");

  const [fullName, setFullName]       = useState("");
  const [username, setUsername]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPwd, setShowPwd]         = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  function selectRole(r: Role) {
    setRole(r);
    setStaffPass("");
    setStaffError("");
    if (r === "client") {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function validateStaffPass() {
    if (!staffPass.trim()) { setStaffError("Ingresa la contraseña de acceso"); return; }
    setStaffError("");
    setStep(3);
  }

  async function handleSubmit() {
    if (!fullName.trim() || fullName.trim().length < 3) { setError("El nombre debe tener al menos 3 caracteres"); return; }
    if (!username.trim() || username.trim().length < 3)  { setError("El usuario debe tener al menos 3 caracteres"); return; }
    if (!/^[a-z0-9_]+$/.test(username.trim()))            { setError("El usuario solo puede tener letras minúsculas, números y guión bajo"); return; }
    if (password.length < 6)                              { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirmPass)                         { setError("Las contraseñas no coinciden"); return; }

    setError("");
    setSubmitting(true);
    try {
      let endpoint = "";
      let body: Record<string, string> = { fullName: fullName.trim(), username: username.trim(), password, email: email.trim() };

      if (role === "client") {
        endpoint = `${API}/auth/register-client`;
      } else {
        endpoint = `${API}/auth/register-staff`;
        body = { ...body, staffPassword: staffPass, role: role! };
      }

      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al registrarse"); return; }

      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      navigate(roleHome(data.user.role));
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#0f1e3d 0%,#1e3a7b 60%,#2563eb 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 20px 40px" }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: "1px solid rgba(255,255,255,0.15)" }}>
          <svg width="36" height="36" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="52" r="16" fill="white"/>
            <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
          </svg>
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
          Hapi<span style={{ color: "#f87171" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Crea tu cuenta</div>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: step >= n ? "#ef4444" : "rgba(255,255,255,0.15)",
              color: step >= n ? "white" : "rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, transition: "all 0.2s",
            }}>{n}</div>
            {n < 3 && <div style={{ width: 24, height: 2, background: step > n ? "#ef4444" : "rgba(255,255,255,0.2)", transition: "all 0.2s" }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.35)", overflow: "hidden" }}>

        {/* ── PASO 1: Selección de rol ── */}
        {step === 1 && (
          <div style={{ padding: "28px 24px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1e3d", marginBottom: 4 }}>¿Cómo vas a usar HapiCredit?</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Selecciona el tipo de cuenta que corresponde a tu rol</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectRole(r.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "16px", borderRadius: 16,
                    border: `1.5px solid ${r.border}`,
                    background: r.bg, cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: r.color, display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 } as React.CSSProperties}>
                    {r.id === "client"    && <UserIcon />}
                    {r.id === "executive" && <BriefcaseIcon />}
                    {r.id === "admin"     && <ShieldIcon />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1e3d" }}>{r.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.sublabel}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                  <ChevronRight color="#94a3b8" />
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>¿Ya tienes cuenta?{" "}</span>
              <a href="/login" style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, textDecoration: "none" }}>Inicia sesión</a>
            </div>
          </div>
        )}

        {/* ── PASO 2: Contraseña de staff ── */}
        {step === 2 && (
          <div style={{ padding: "28px 24px" }}>
            <button
              onClick={() => { setStep(1); setRole(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}
            >
              <ChevronLeft color="#64748b" /> Cambiar rol
            </button>

            {role && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", borderRadius: 12, background: roles.find(r => r.id === role)!.bg, border: `1px solid ${roles.find(r => r.id === role)!.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: roles.find(r => r.id === role)!.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {role === "executive" && <BriefcaseIcon small />}
                  {role === "admin"     && <ShieldIcon small />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>{roles.find(r => r.id === role)!.label}</div>
                  <div style={{ fontSize: 11, color: roles.find(r => r.id === role)!.color, fontWeight: 600 }}>{roles.find(r => r.id === role)!.sublabel}</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1e3d", marginBottom: 4 }}>Contraseña de acceso</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                Para registrarte como {role === "admin" ? "Administrador" : "Asesor"} necesitas la contraseña de acceso institucional.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Contraseña de acceso</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={staffPass}
                  onChange={e => { setStaffPass(e.target.value); setStaffError(""); }}
                  onKeyDown={e => e.key === "Enter" && validateStaffPass()}
                  placeholder="Contraseña institucional"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {staffError && <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626", fontWeight: 500 }}>{staffError}</div>}
            </div>

            <button
              onClick={validateStaffPass}
              disabled={!staffPass.trim()}
              style={{
                ...btnStyle,
                background: staffPass.trim() ? "#ef4444" : "#e5e7eb",
                color: staffPass.trim() ? "white" : "#9ca3af",
              }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── PASO 3: Datos personales ── */}
        {step === 3 && (
          <div style={{ padding: "28px 24px" }}>
            <button
              onClick={() => role === "client" ? setStep(1) : setStep(2)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}
            >
              <ChevronLeft color="#64748b" /> Atrás
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1e3d", marginBottom: 4 }}>Tus datos</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Completa tu información para crear la cuenta</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre completo <Req /></label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellidos"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>Usuario <Req /></label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="solo letras, números y _"
                  style={inputStyle}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Sin espacios ni caracteres especiales</div>
              </div>

              <div>
                <label style={labelStyle}>Correo electrónico <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contraseña <Req /></label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                  >
                    {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Confirmar contraseña <Req /></label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repite tu contraseña"
                  style={{ ...inputStyle, borderColor: confirmPass && confirmPass !== password ? "#fca5a5" : undefined }}
                />
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !fullName.trim() || !username.trim() || !password || !confirmPass}
                style={{
                  ...btnStyle,
                  background: submitting || !fullName.trim() || !username.trim() || !password || !confirmPass ? "#e5e7eb" : "#ef4444",
                  color: submitting || !fullName.trim() || !username.trim() || !password || !confirmPass ? "#9ca3af" : "white",
                  marginTop: 4,
                }}
              >
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>¿Ya tienes cuenta?{" "}</span>
              <a href="/login" style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, textDecoration: "none" }}>Inicia sesión</a>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>Términos y condiciones</a>
      </div>
    </div>
  );
}

function Req() {
  return <span style={{ color: "#ef4444" }}> *</span>;
}

function UserIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function BriefcaseIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
}

function ShieldIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ shrink: 0 } as React.CSSProperties}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

function ChevronLeft({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#374151",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px",
  border: "1.5px solid #e2e8f0", borderRadius: 12,
  fontSize: 15, boxSizing: "border-box", outline: "none",
  color: "#1e2d4f", background: "#f8fafc",
};

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "14px",
  border: "none", borderRadius: 12,
  fontWeight: 700, fontSize: 15, cursor: "pointer",
  transition: "all 0.2s",
};
