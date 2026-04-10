import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "");

type Role = "admin" | "executive" | "client" | null;
type Step = "role" | "code" | "form" | "done";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  executive: "Asesor",
  client: "Acreditado",
};

function roleHome(role: string) {
  if (role === "admin")     return "/admin";
  if (role === "executive") return "/dashboard";
  return "/mi-credito";
}

export default function Registro() {
  const [, navigate] = useLocation();
  const [step, setStep]               = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [code, setCode]               = useState("");
  const [codeRole, setCodeRole]       = useState<string | null>(null);
  const [codeError, setCodeError]     = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Only used for client (acreditado) — staff goes to Clerk SignUp
  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "", password2: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role  = localStorage.getItem("hapi_role");
    if (token) navigate(roleHome(role || ""));
  }, []);

  async function handleValidateCode() {
    setCodeError("");
    const trimmed = code.trim();
    if (!trimmed) { setCodeError("Ingresa el código de acceso"); return; }
    setCodeLoading(true);
    try {
      const res  = await fetch(`${API}/invite-codes/validate/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error || "Código inválido"); return; }

      // "staff" codes work for both executive and admin
      const isStaff   = data.role === "staff";
      const roleMatch = isStaff
        ? (selectedRole === "executive" || selectedRole === "admin")
        : data.role === selectedRole;

      if (selectedRole && !roleMatch) {
        setCodeError(`Este código es para ${ROLE_LABEL[data.role] ?? data.role}, no para ${ROLE_LABEL[selectedRole!]}`);
        return;
      }

      const exactCode = data.code || trimmed; // Use exact DB code for clerk-sync lookup
      setCode(exactCode);
      setCodeRole(data.role);

      if (selectedRole === "client") {
        setStep("form");
      } else {
        // Staff (executive / admin) → Clerk SignUp for passkeys + email
        sessionStorage.setItem("hapi_pending_role", selectedRole!);
        sessionStorage.setItem("hapi_pending_code", exactCode);
        window.location.href = `${basePath}/sign-up`;
      }
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.fullName || !form.username || !form.password) { setFormError("Completa todos los campos obligatorios"); return; }
    if (form.password !== form.password2) { setFormError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setFormError("La contraseña debe tener al menos 6 caracteres"); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fullName: form.fullName, email: form.email, username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Error al registrar"); return; }

      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      setStep("done");
      setTimeout(() => navigate(roleHome(data.user.role)), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0f1e3d 0%, #1e2d4f 60%, #162040 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <svg width="44" height="44" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <div style={{ color: "white", fontWeight: 800, fontSize: 20, marginTop: 6 }}>
          Hapi<span style={{ color: "#f87171" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Tu crédito, Tu impulso</div>
      </div>

      <div style={{ background: "white", borderRadius: 22, padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>

        {/* STEP: ROLE */}
        {step === "role" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e2d4f", marginBottom: 6 }}>Crear cuenta</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Selecciona tu tipo de cuenta para continuar.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {([
                { role: "executive", label: "Soy Asesor",       desc: "Ejecutivo de crédito — requiere código de acceso", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
                { role: "client",    label: "Soy Acreditado",   desc: "Cliente con crédito — requiere código de invitación", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
                { role: "admin",     label: "Soy Administrador", desc: "Acceso institucional — código de administrador", color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
              ] as const).map(({ role, label, desc, color, bg, border }) => (
                <button
                  key={role}
                  onClick={() => { setSelectedRole(role); setCode(""); setCodeError(""); setStep("code"); }}
                  style={{ padding: "16px 18px", borderRadius: 14, border: `2px solid ${border}`, background: bg, cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
                </button>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
              Ya tienes cuenta?{" "}
              <a href="/login" style={{ color: "#ef4444", fontWeight: 700, textDecoration: "none" }}>Inicia sesión</a>
            </p>
          </>
        )}

        {/* STEP: CODE */}
        {step === "code" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => { setStep("role"); setSelectedRole(null); setCodeError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, padding: 0 }}>
                ← Regresar
              </button>
              {selectedRole && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: selectedRole === "admin" ? "#ede9fe" : selectedRole === "executive" ? "#dbeafe" : "#dcfce7", color: selectedRole === "admin" ? "#7c3aed" : selectedRole === "executive" ? "#1e40af" : "#166534" }}>
                  {ROLE_LABEL[selectedRole]}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1e2d4f", marginBottom: 6 }}>Código de acceso</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
              {selectedRole === "client"
                ? "Ingresa el código que recibiste por WhatsApp o correo."
                : "Ingresa tu código de acceso institucional."}
            </p>

            {selectedRole !== "client" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: "#1e40af" }}>
                Despues validaremos tu identidad con correo y podras configurar tu huella digital o Face ID.
              </div>
            )}

            <label style={labelStyle}>
              {selectedRole === "client" ? "Código de invitación" : "Código de acceso"}
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={selectedRole === "client" ? "Ej: A1B2C3D4" : "Código proporcionado"}
              maxLength={32}
              autoFocus
              style={{ ...inputStyle, marginTop: 8, marginBottom: codeError ? 6 : 20, fontFamily: "monospace", fontSize: 16, fontWeight: 600, textAlign: "center" }}
              onKeyDown={e => e.key === "Enter" && handleValidateCode()}
            />
            {codeError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{codeError}</p>}

            <button
              onClick={handleValidateCode}
              disabled={codeLoading || !code.trim()}
              style={{ width: "100%", padding: "13px", background: "#ef4444", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: codeLoading || !code.trim() ? 0.6 : 1 }}
            >
              {codeLoading ? "Verificando..." : "Continuar"}
            </button>
          </>
        )}

        {/* STEP: FORM (clients only) */}
        {step === "form" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => { setStep("code"); setFormError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, padding: 0 }}>
                ← Regresar
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#166534" }}>
                Acreditado
              </span>
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1e2d4f", marginBottom: 20 }}>Crea tu cuenta</h2>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Como aparece en tu INE" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Usuario *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))} placeholder="usuario_sin_espacios" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar contraseña *</label>
                <input type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} placeholder="Repite la contraseña" style={inputStyle} />
              </div>

              {formError && <p style={{ color: "#ef4444", fontSize: 13 }}>{formError}</p>}

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          </>
        )}

        {/* STEP: DONE */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l5 5 9-10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e2d4f", marginBottom: 8 }}>Cuenta creada</h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>Bienvenido a HapiCredit. Redirigiendo a tu panel...</p>
          </div>
        )}
      </div>

      {step !== "role" && step !== "done" && (
        <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          Ya tienes cuenta?{" "}
          <a href="/login" style={{ color: "white", fontWeight: 600 }}>Inicia sesión</a>
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: 10,
  fontSize: 15, marginTop: 6, boxSizing: "border-box", outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#374151",
  textTransform: "uppercase", letterSpacing: "0.05em",
};
