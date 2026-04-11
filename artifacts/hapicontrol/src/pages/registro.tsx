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
    sublabel: "Cliente de credito",
    desc: "Solicita y administra tus creditos personales o de negocio.",
    color: "#059669",
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
    desc: "Acceso completo a cartera, reportes, usuarios y arbol de red.",
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
    setStep(r === "client" ? 3 : 2);
  }

  function validateStaffPass() {
    if (!staffPass.trim()) { setStaffError("Ingresa la contrasena de acceso"); return; }
    setStaffError("");
    setStep(3);
  }

  async function handleSubmit() {
    if (!fullName.trim() || fullName.trim().length < 3) { setError("El nombre debe tener al menos 3 caracteres"); return; }
    if (!username.trim() || username.trim().length < 3)  { setError("El usuario debe tener al menos 3 caracteres"); return; }
    if (!/^[a-z0-9_]+$/.test(username.trim()))            { setError("Solo letras minusculas, numeros y guion bajo"); return; }
    if (password.length < 6)                              { setError("La contrasena debe tener al menos 6 caracteres"); return; }
    if (password !== confirmPass)                         { setError("Las contrasennas no coinciden"); return; }

    setError("");
    setSubmitting(true);
    try {
      const isStaff  = role !== "client";
      const endpoint = isStaff ? `${API}/auth/register-staff` : `${API}/auth/register-client`;
      const body: Record<string, string> = {
        fullName: fullName.trim(), username: username.trim(), password, email: email.trim(),
        ...(isStaff ? { staffPassword: staffPass, role: role! } : {}),
      };
      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al registrarse"); return; }
      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      navigate(roleHome(data.user.role));
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && fullName.trim() && username.trim() && password && confirmPass;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg,#080f1f 0%,#142246 55%,#1a3059 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start", padding: "36px 20px 48px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 60, height: 60, borderRadius: 18, margin: "0 auto 12px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="52" r="16" fill="white"/>
            <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
          </svg>
        </div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>
          Hapi<span style={{ color: "#e84545" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>Crea tu cuenta</div>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step >= n ? "var(--coral, #e84545)" : "rgba(255,255,255,0.12)",
                color: step >= n ? "#fff" : "rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                transition: "background 0.25s, color 0.25s",
                boxShadow: step >= n ? "0 2px 8px rgba(232,69,69,0.35)" : "none",
              }}
            >
              {n}
            </div>
            {n < 3 && (
              <div
                style={{
                  width: 28, height: 2, borderRadius: 2,
                  background: step > n ? "var(--coral, #e84545)" : "rgba(255,255,255,0.12)",
                  transition: "background 0.25s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── Step 1: Role selection ── */}
        {step === 1 && (
          <div style={{ padding: "28px 22px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0d1a36", letterSpacing: "-0.03em" }}>
                Como vas a usar HapiCredit?
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                Selecciona el tipo de cuenta que corresponde a tu rol
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectRole(r.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "14px 16px", borderRadius: 16,
                    border: `1.5px solid ${r.border}`, background: r.bg,
                    cursor: "pointer", textAlign: "left",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: r.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {r.id === "client"    && <UserSvg />}
                    {r.id === "executive" && <BriefcaseSvg />}
                    {r.id === "admin"     && <ShieldSvg />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0d1a36" }}>{r.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: r.color, marginBottom: 2, marginTop: 1 }}>{r.sublabel}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                  <ChevronRightSvg />
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Ya tienes cuenta? </span>
              <a href="/login" style={{ fontSize: 13, color: "#e84545", fontWeight: 700, textDecoration: "none" }}>Inicia sesion</a>
            </div>
          </div>
        )}

        {/* ── Step 2: Staff password ── */}
        {step === 2 && (
          <div style={{ padding: "28px 22px" }}>
            <BackBtn onClick={() => { setStep(1); setRole(null); }} label="Cambiar rol" />
            {role && (() => {
              const r = roles.find(x => x.id === role)!;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", borderRadius: 12, background: r.bg, border: `1px solid ${r.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {role === "executive" ? <BriefcaseSvg small /> : <ShieldSvg small />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0d1a36" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.sublabel}</div>
                  </div>
                </div>
              );
            })()}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0d1a36", letterSpacing: "-0.03em" }}>Contrasena de acceso</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                Para registrarte como {role === "admin" ? "Administrador" : "Asesor"} necesitas la contrasena institucional.
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label>Contrasena de acceso</Label>
              <PasswordField
                value={staffPass}
                onChange={v => { setStaffPass(v); setStaffError(""); }}
                onEnter={validateStaffPass}
                show={showPass}
                onToggle={() => setShowPass(v => !v)}
                placeholder="Contrasena institucional"
                autoFocus
              />
              {staffError && <ErrorMsg>{staffError}</ErrorMsg>}
            </div>
            <SubmitBtn onClick={validateStaffPass} disabled={!staffPass.trim()}>Continuar</SubmitBtn>
          </div>
        )}

        {/* ── Step 3: Personal data ── */}
        {step === 3 && (
          <div style={{ padding: "28px 22px" }}>
            <BackBtn onClick={() => role === "client" ? setStep(1) : setStep(2)} label="Atras" />
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0d1a36", letterSpacing: "-0.03em" }}>Tus datos</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Completa tu informacion para crear la cuenta</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label>Nombre completo <Req /></Label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre y apellidos" style={inputStyle} autoFocus />
              </div>
              <div>
                <Label>Usuario <Req /></Label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="solo letras, numeros y _" style={inputStyle} autoCapitalize="none" autoCorrect="off" />
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Sin espacios ni caracteres especiales</div>
              </div>
              <div>
                <Label>Correo <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></Label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" style={inputStyle} />
              </div>
              <div>
                <Label>Contrasena <Req /></Label>
                <PasswordField value={password} onChange={setPassword} show={showPwd} onToggle={() => setShowPwd(v => !v)} placeholder="Minimo 6 caracteres" />
              </div>
              <div>
                <Label>Confirmar contrasena <Req /></Label>
                <input
                  type="password" value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repite tu contrasena"
                  style={{ ...inputStyle, borderColor: confirmPass && confirmPass !== password ? "#fca5a5" : undefined }}
                />
              </div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}
              <SubmitBtn onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </SubmitBtn>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Ya tienes cuenta? </span>
              <a href="/login" style={{ fontSize: 13, color: "#e84545", fontWeight: 700, textDecoration: "none" }}>Inicia sesion</a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Terminos y condiciones</a>
      </div>
    </div>
  );
}

/* ── Small helpers ── */
function Req() { return <span style={{ color: "#e84545" }}> *</span>; }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626", fontWeight: 500 }}>{children}</div>;
}

function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, fontWeight: 600 }}
    >
      <ChevronLeftSvg /> {label}
    </button>
  );
}

function SubmitBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 14,
        fontWeight: 700, fontSize: 15, cursor: disabled ? "default" : "pointer",
        background: disabled ? "#e5e7eb" : "#e84545",
        color: disabled ? "#9ca3af" : "#fff",
        transition: "background 0.15s, color 0.15s",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function PasswordField({ value, onChange, show, onToggle, placeholder, autoFocus, onEnter }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
  placeholder: string; autoFocus?: boolean; onEnter?: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 44 }}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}
      >
        {show ? <EyeOffSvg /> : <EyeSvg />}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", border: "1.5px solid #e2e8f0",
  borderRadius: 12, fontSize: 15, boxSizing: "border-box", outline: "none",
  color: "#0d1a36", background: "#f8fafc", fontFamily: "inherit",
  transition: "border-color 0.15s",
};

function UserSvg()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function BriefcaseSvg({ small }: { small?: boolean } = {}) { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>; }
function ShieldSvg({ small }: { small?: boolean } = {})    { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function ChevronRightSvg() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, alignSelf: "center" }}><path d="M9 18l6-6-6-6"/></svg>; }
function ChevronLeftSvg()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>; }
function EyeSvg()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffSvg() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
