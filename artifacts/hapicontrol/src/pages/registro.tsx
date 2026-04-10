import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

type Step = "code" | "form" | "done";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  executive: "Asesor",
  client: "Acreditado",
};

export default function Registro() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [codeRole, setCodeRole] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "", password2: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role = localStorage.getItem("hapi_role");
    if (token) {
      navigate(role === "admin" ? "/admin" : role === "executive" ? "/dashboard" : "/mi-credito");
    }
  }, []);

  async function handleValidateCode() {
    setCodeError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setCodeError("Ingresa el código"); return; }
    const res = await fetch(`${API}/invite-codes/validate/${trimmed}`);
    const data = await res.json();
    if (!res.ok) { setCodeError(data.error || "Código inválido"); return; }
    setCode(trimmed);
    setCodeRole(data.role);
    setStep("form");
  }

  async function handleRequestCode() {
    setRequesting(true);
    setCodeError("");
    try {
      const res = await fetch(`${API}/invite-codes/request`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error || "Error al solicitar código"); return; }
      setGeneratedCode(data.code);
      setCode(data.code);
      setCodeRole("client");
      setStep("form");
    } finally {
      setRequesting(false);
    }
  }

  function handleCopy() {
    if (generatedCode) { navigator.clipboard.writeText(generatedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.fullName || !form.username || !form.password) { setFormError("Completa todos los campos obligatorios"); return; }
    if (form.password !== form.password2) { setFormError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setFormError("La contraseña debe tener al menos 6 caracteres"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fullName: form.fullName, email: form.email, username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Error al registrar"); return; }

      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role", data.user.role);
      localStorage.setItem("hapi_user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "executive") {
        navigate("/dashboard");
      } else {
        navigate("/mi-credito");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--navy-800)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <svg width="48" height="48" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <div style={{ color: "white", fontWeight: 700, fontSize: 22, marginTop: 8 }}>HapiCredit</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Tu crédito, Tu impulso</div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400 }}>

        {/* STEP: code */}
        {step === "code" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)", marginBottom: 6 }}>Registro</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Ingresa tu código de invitación para registrarte.</p>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Código de invitación</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: A1B2C3D4"
              maxLength={8}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: "0.15em", textAlign: "center", marginTop: 8, marginBottom: codeError ? 4 : 16, boxSizing: "border-box", outline: "none" }}
              onKeyDown={e => e.key === "Enter" && handleValidateCode()}
            />
            {codeError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{codeError}</p>}

            <button
              onClick={handleValidateCode}
              style={{ width: "100%", padding: "13px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}
            >
              Continuar
            </button>

            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>— o —</span>
            </div>

            <button
              onClick={handleRequestCode}
              disabled={requesting}
              style={{ width: "100%", padding: "13px", background: "transparent", color: "var(--accent)", border: "1.5px solid var(--accent)", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20 }}
            >
              {requesting ? "Generando..." : "No tengo código — Solicitar uno"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
              Ya tienes cuenta?{" "}
              <a href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Inicia sesión</a>
            </p>
          </>
        )}

        {/* STEP: form */}
        {step === "form" && (
          <>
            {generatedCode && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 6 }}>Tu código de acceso (guardalo)</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.15em", color: "#15803d" }}>{generatedCode}</span>
                  <button onClick={handleCopy} style={{ fontSize: 12, color: "#166534", background: "#dcfce7", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => { setStep("code"); setCodeRole(null); setGeneratedCode(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13 }}>← Regresar</button>
              {codeRole && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: codeRole === "admin" ? "#7c3aed22" : codeRole === "executive" ? "#1a2e5e22" : "#16a34a22", color: codeRole === "admin" ? "#7c3aed" : codeRole === "executive" ? "#1a2e5e" : "#16a34a" }}>
                  {ROLE_LABEL[codeRole] ?? codeRole}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)", marginBottom: 20 }}>Crea tu cuenta</h2>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre completo *</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Como aparece en tu INE" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))} placeholder="usuario_sin_espacios" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmar contraseña *</label>
                <input type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} placeholder="Repite la contraseña" style={inputStyle} />
              </div>

              {formError && <p style={{ color: "#ef4444", fontSize: 13 }}>{formError}</p>}

              <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Login link */}
      {step === "code" || (
        <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          Ya tienes cuenta?{" "}
          <a href="/login" style={{ color: "white", fontWeight: 600 }}>Inicia sesión</a>
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  fontSize: 15,
  marginTop: 6,
  boxSizing: "border-box",
  outline: "none",
};
