import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role = localStorage.getItem("hapi_role");
    if (token) navigate(role === "admin" || role === "executive" ? "/admin" : "/mi-credito");
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales incorrectas"); return; }

      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role", data.user.role);
      localStorage.setItem("hapi_user", JSON.stringify(data.user));

      if (data.user.role === "admin" || data.user.role === "executive") {
        navigate("/admin");
      } else {
        navigate("/mi-credito");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--navy-800)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <svg width="48" height="48" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <div style={{ color: "white", fontWeight: 700, fontSize: 22, marginTop: 8 }}>HapiCredit</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Tu crédito, Tu impulso</div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)", marginBottom: 6 }}>Iniciar sesión</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Ingresa tus credenciales para continuar.</p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tu nombre de usuario" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" style={inputStyle} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 20 }}>
          No tienes cuenta?{" "}
          <a href="/registro" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Regístrate</a>
        </p>
      </div>
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
