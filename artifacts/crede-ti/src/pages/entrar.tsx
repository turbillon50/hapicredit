import { useEffect, useState } from "react";
import { useParams } from "wouter";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Entrar() {
  const params = useParams<{ key: string }>();
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const key = params?.key ?? "";
      if (!key) { setErr("Liga invalida."); return; }
      try {
        const res = await fetch(`${API}/auth/magic-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) { setErr(data.error ?? "Liga invalida o expirada."); return; }
        localStorage.setItem("credeti_token", data.token);
        localStorage.setItem("credeti_role", data.user.role);
        localStorage.setItem("credeti_user", JSON.stringify(data.user));
        window.location.replace(`${basePath}/admin`);
      } catch {
        setErr("Error de conexion. Recarga la pagina.");
      }
    })();
  }, [params]);

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg, #06143B 0%, #215DFF 60%, #19D7D7 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", color: "#fff", fontFamily: "Montserrat, Inter, sans-serif", textAlign: "center" }}>
      {err ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No se pudo entrar</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{err}</div>
        </>
      ) : (
        <>
          <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>Entrando al panel...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
