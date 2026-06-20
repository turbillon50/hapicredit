import React, { useState } from "react";
import logoImg from "@assets/logo-credeti-square.jpeg";

const API = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

const inStyle: React.CSSProperties = { width: "100%", marginTop: 6, padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", boxSizing: "border-box" };

const STATUS_MAP: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  pending:   { label: "En revisión",          desc: "Recibimos tu solicitud y nuestro equipo la está revisando.", color: "#b45309", bg: "#fffbeb" },
  approved:  { label: "Aprobada",             desc: "¡Felicidades! Tu solicitud fue aprobada. Pronto te contactaremos.", color: "#059669", bg: "var(--surface-3)" },
  rejected:  { label: "No aprobada",          desc: "Por ahora tu solicitud no procedió. Contáctanos para más información.", color: "#dc2626", bg: "var(--surface-3)" },
  contacted: { label: "Requiere tu atención", desc: "Necesitamos más información o documentos. Revisa los mensajes abajo.", color: "#2563eb", bg: "var(--surface-3)" },
};

const fmtMoney = (n: any) => n == null ? "" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(n));
const fmtDate = (s: any) => { try { return new Date(s).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };

export default function Seguimiento() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const consultar = async () => {
    setError(""); setData(null);
    const r = ref.trim(); const p = phone.replace(/\D/g, "");
    if (!r || p.length < 10) { setError("Escribe tu folio (HC-XXXXX) y un teléfono de 10 dígitos."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/public/status?ref=${encodeURIComponent(r)}&phone=${encodeURIComponent(p)}`);
      const d = await res.json();
      if (!res.ok) setError(d.error || "No encontramos tu solicitud.");
      else setData(d);
    } catch { setError("Hubo un problema. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  const sm = data ? (STATUS_MAP[data.status] ?? STATUS_MAP.pending) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src={logoImg} alt="Crede-Ti" style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 10px", display: "block", objectFit: "cover" }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Seguimiento de solicitud</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Consulta el estatus de tu afiliación con tu folio.</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Folio
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="HC-00001" style={inStyle} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Teléfono
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="10 dígitos" style={inStyle} onKeyDown={e => { if (e.key === "Enter") consultar(); }} />
          </label>
          {error && <div style={{ fontSize: 13, color: "#dc2626" }}>{error}</div>}
          <button onClick={consultar} disabled={loading} style={{ padding: "12px", borderRadius: 12, border: "none", background: "#215DFF", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}>{loading ? "Consultando..." : "Consultar estatus"}</button>
        </div>

        {data && sm && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: sm.bg, borderRadius: 18, border: `1.5px solid ${sm.color}33`, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{data.ref} · {data.name}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: sm.color, margin: "6px 0" }}>{sm.label}</div>
              <div style={{ fontSize: 14, color: "#334155" }}>{sm.desc}</div>
              {data.requestedAmount != null && <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>Monto solicitado: <strong>{fmtMoney(data.requestedAmount)}</strong></div>}
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Solicitud del {fmtDate(data.createdAt)}</div>
            </div>

            {data.updates?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Mensajes del equipo</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.updates.map((u: any, i: number) => (
                    <div key={i} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 14, color: "#334155", whiteSpace: "pre-wrap" }}>{u.comment}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{fmtDate(u.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <a href="/" style={{ fontSize: 13, color: "#215DFF", fontWeight: 600, textDecoration: "none" }}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
