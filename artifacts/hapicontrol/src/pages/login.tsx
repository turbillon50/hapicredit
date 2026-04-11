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
    if (token) navigate(roleHome(role || ""));
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
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales incorrectas"); return; }
      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      navigate(roleHome(data.user.role));
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
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}>
          <svg width="40" height="40" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="52" r="16" fill="white"/>
            <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
          </svg>
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>
          Hapi<span style={{ color: "#f87171" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>
          Tu credito, Tu impulso
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)", padding: "28px 28px 24px",
        boxSizing: "border-box",
      }}>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e2d4f", marginBottom: 4, textAlign: "center" }}>
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
                style={{ ...inputStyle, paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                  fontSize: 13, fontWeight: 600, padding: 0,
                }}
              >
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "10px 14px",
              color: "#dc2626", fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: "100%", padding: "14px",
              background: loading || !username || !password ? "#cbd5e1" : "#ef4444",
              color: "white", border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15,
              cursor: loading || !username || !password ? "default" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Verificando..." : "Iniciar sesion"}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          margin: "22px 0 18px",
        }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Clerk passkey / email */}
        <a
          href={`${basePath}/sign-in`}
          style={{
            display: "block", width: "100%", padding: "13px",
            background: "#f1f5f9", color: "#1e2d4f", borderRadius: 12,
            fontWeight: 700, fontSize: 14, textAlign: "center",
            textDecoration: "none", boxSizing: "border-box",
            border: "1.5px solid #e2e8f0",
          }}
        >
          Continuar con correo o passkey
        </a>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>No tienes cuenta?{" "}</span>
          <a href="/registro" style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, textDecoration: "none" }}>
            Registrate
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 28, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>Terminos y condiciones</a>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#374151",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px",
  border: "1.5px solid #e2e8f0", borderRadius: 12,
  fontSize: 15, boxSizing: "border-box", outline: "none",
  color: "#1e2d4f", background: "#f8fafc",
};
