import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "");

function roleHome(role: string) {
  if (role === "admin")     return "/admin";
  if (role === "executive") return "/dashboard";
  return "/mi-credito";
}

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role  = localStorage.getItem("hapi_role");
    if (token) navigate(roleHome(role ?? ""));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { token?: string; user?: { role: string }; error?: string };
      if (!res.ok || !data.token || !data.user) {
        setError(data.error ?? "Credenciales incorrectas");
        return;
      }
      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      navigate(roleHome(data.user.role));
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && username.trim().length > 0 && password.length > 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg,#080f1f 0%,#142246 55%,#1a3059 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Brand ── */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div
          style={{
            width: 68, height: 68, borderRadius: 20, margin: "0 auto 14px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width="38" height="38" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="52" r="16" fill="white"/>
            <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
          </svg>
        </div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: "-0.04em" }}>
          Hapi<span style={{ color: "#e84545" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
          Tu credito, Tu impulso
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 400,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)", padding: "28px 26px 24px",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0d1a36", marginBottom: 4, textAlign: "center", letterSpacing: "-0.03em" }}>
          Bienvenido de vuelta
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
          Ingresa con tu usuario y contrasena
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Usuario</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contrasena</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contrasena"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 52 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", fontSize: 12, fontWeight: 700, padding: 0,
                  letterSpacing: "0.01em",
                }}
              >
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 14px",
                color: "#dc2626", fontSize: 13, fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "14px",
              background: canSubmit ? "#e84545" : "#e5e7eb",
              color: canSubmit ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              cursor: canSubmit ? "pointer" : "default",
              transition: "background 0.15s, color 0.15s",
              fontFamily: "inherit",
              boxShadow: canSubmit ? "0 2px 12px rgba(232,69,69,0.3)" : "none",
            }}
          >
            {loading ? "Verificando..." : "Iniciar sesion"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
          <div style={{ flex: 1, height: 1, background: "#e9e8e4" }} />
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#e9e8e4" }} />
        </div>

        {/* Clerk passkey / email button */}
        <a
          href={`${basePath}/sign-in`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", padding: "13px",
            background: "#f5f4f1", color: "#0d1a36",
            borderRadius: 14, fontWeight: 700, fontSize: 14,
            textDecoration: "none", boxSizing: "border-box",
            border: "1.5px solid #e9e8e4",
            transition: "background 0.15s",
          }}
        >
          Continuar con correo o passkey
        </a>

        <div style={{ textAlign: "center", marginTop: 22, paddingTop: 16, borderTop: "1px solid #f1f0ed" }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>No tienes cuenta? </span>
          <a href="/registro" style={{ fontSize: 13, color: "#e84545", fontWeight: 700, textDecoration: "none" }}>
            Registrate
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 28, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Terminos y condiciones</a>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#374151",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px",
  border: "1.5px solid #e2e0db", borderRadius: 12,
  fontSize: 15, boxSizing: "border-box", outline: "none",
  color: "#0d1a36", background: "#f8f7f4",
  fontFamily: "inherit", transition: "border-color 0.15s",
};
