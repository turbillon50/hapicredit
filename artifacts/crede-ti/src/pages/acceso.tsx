import { useState, useEffect } from "react";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Acceso() {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  // Si ya hay sesión admin activa, ir directo al panel
  useEffect(() => {
    const role = localStorage.getItem("credeti_role");
    const token = localStorage.getItem("credeti_token");
    if (token && (role === "admin" || role === "executive")) {
      window.location.replace(`${basePath}/${role === "executive" ? "dashboard" : "admin"}`);
    }
  }, []);

  async function elevate() {
    if (!pwd) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API}/auth/master-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_admin") {
          window.location.href = `${basePath}/sign-in`;
        } else {
          setErr(data.error ?? "Clave incorrecta");
          setBusy(false);
        }
        return;
      }
      localStorage.setItem("credeti_token", data.token);
      localStorage.setItem("credeti_role", data.user.role);
      localStorage.setItem("credeti_user", JSON.stringify(data.user));
      window.location.href = `${basePath}/admin`;
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #06143B 0%, #215DFF 60%, #19D7D7 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "Montserrat, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 12 }}>
          <defs>
            <linearGradient id="cgLA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3A00C8"/>
              <stop offset="100%" stopColor="#215DFF"/>
            </linearGradient>
          </defs>
          <path d="M72 18C62 10 42 8 26 18C12 27 8 42 12 56C16 70 30 80 48 82C58 83 68 80 76 74" stroke="url(#cgLA)" strokeWidth="14" strokeLinecap="round" fill="none"/>
          <circle cx="80" cy="18" r="9" fill="#19D7D7"/>
          <rect x="62" y="46" width="26" height="11" rx="5.5" fill="#19D7D7"/>
        </svg>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          crede<span style={{ color: "#19D7D7" }}>ti</span>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 24,
          padding: "28px 24px",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
            }}
          >
            Clave de acceso
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && elevate()}
              placeholder="••••••••••••"
              autoFocus
              autoComplete="current-password"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                border: `2px solid ${err ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.2)"}`,
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 500,
                padding: "0 52px 0 18px",
                outline: "none",
                boxSizing: "border-box",
                letterSpacing: show ? "0" : "0.2em",
              }}
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                padding: 4,
              }}
            >
              {show ? "Ocultar" : "Ver"}
            </button>
          </div>

          {err && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.35)",
                color: "#fca5a5",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {err}
            </div>
          )}
        </div>

        <button
          onClick={elevate}
          disabled={busy || !pwd}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: "none",
            background: busy || !pwd
              ? "rgba(255,255,255,0.12)"
              : "linear-gradient(135deg, #3A00C8, #215DFF, #19D7D7)",
            color: busy || !pwd ? "rgba(255,255,255,0.4)" : "#fff",
            fontSize: 15,
            fontWeight: 800,
            cursor: busy || !pwd ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {busy ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                </path>
              </svg>
              Verificando…
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
        crede-ti.info
      </div>
    </div>
  );
}
