import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const clerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role = localStorage.getItem("hapi_role");
    if (token) {
      navigate(role === "admin" || role === "executive" ? "/admin" : "/mi-credito");
    }
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

      navigate(data.user.role === "admin" || data.user.role === "executive" ? "/admin" : "/mi-credito");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    // Redirect to Clerk sign-in which supports Google OAuth
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    window.location.href = `${base}/sign-in`;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--navy-800)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <svg width="48" height="48" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <div style={{ color: "white", fontWeight: 700, fontSize: 22, marginTop: 8 }}>HapiCredit</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Tu credito, Tu impulso</div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)", marginBottom: 6 }}>Iniciar sesion</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Ingresa tus credenciales para continuar.</p>

        {clerkAvailable && (
          <>
            <button
              onClick={handleGoogle}
              style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 16 }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continuar con Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>o con usuario</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>
          </>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tu nombre de usuario" style={inputStyle} autoComplete="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contrasena</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contrasena" style={inputStyle} autoComplete="current-password" />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Iniciar sesion"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 20 }}>
          No tienes cuenta?{" "}
          <a href="/registro" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Registrate</a>
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
