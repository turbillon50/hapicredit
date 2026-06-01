import { useState } from "react";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

export default function Acceso() {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  async function elevate() {
    if (!pwd) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API}/users/me/elevate`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Clave incorrecta"); setBusy(false); return; }
      if (data.token) localStorage.setItem("credeti_token", data.token);
      if (data.user) {
        localStorage.setItem("credeti_role", data.user.role);
        localStorage.setItem("credeti_user", JSON.stringify(data.user));
      }
      window.location.href = "/admin";
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #0f1650 0%, #2A3CD6 60%, #3F51E6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <svg width="56" height="56" viewBox="0 0 180 180" fill="none" style={{ marginBottom: 12 }}>
          <circle cx="90" cy="52" r="16" fill="white" />
          <path
            d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z"
            fill="white"
          />
        </svg>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Crede<span style={{ color: "#F0A93A" }}>-Ti</span>
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
              : "linear-gradient(135deg, #F0A93A, #e8951e)",
            color: busy || !pwd ? "rgba(255,255,255,0.4)" : "#15206E",
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
