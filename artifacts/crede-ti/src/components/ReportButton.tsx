import { useState } from "react";
import { useGetAuthHeader } from "@/hooks/useAuthToken";

// Boton flotante "Reportar" — abre un modal para crear un ticket de soporte
// in-app que cae en la tabla support_tickets y el admin lo ve en vivo.
export function ReportButton() {
  const getAuth = useGetAuthHeader();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!subject.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      const headers = { "Content-Type": "application/json", ...(await getAuth()) };
      const r = await fetch("/api/support/tickets", { method: "POST", headers, body: JSON.stringify({ subject, message, category }) });
      if (!r.ok) throw new Error("fail");
      setDone(true);
      setSubject(""); setMessage(""); setCategory("general");
      setTimeout(() => { setDone(false); setOpen(false); }, 1800);
    } catch {
      alert("No se pudo enviar tu reporte. Intenta de nuevo.");
    } finally { setSending(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Reportar un problema" className="pressable"
        style={{ position: "fixed", right: 16, bottom: 92, zIndex: 40, width: 52, height: 52, borderRadius: 16,
          background: "var(--brand-blue, #0E68CC)", color: "#fff", border: "none", cursor: "pointer",
          boxShadow: "0 6px 20px rgba(14,104,204,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      {open && (
        <div onClick={() => !sending && setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "var(--surface, #fff)", borderRadius: "20px 20px 0 0", padding: 24, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--text, #0f172a)" }}>Reportar un problema</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted, #64748b)" }}>Cuentanos que pasa y nuestro equipo te ayudara.</p>
            {done ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#16a34a", fontWeight: 600 }}>Reporte enviado. Gracias \uD83D\uDC99</div>
            ) : (<>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", background: "var(--surface-2,#f8fafc)", color: "var(--text,#0f172a)" }}>
                <option value="general">General</option>
                <option value="pago">Pago</option>
                <option value="credito">Credito</option>
                <option value="tecnico">Problema tecnico</option>
                <option value="otro">Otro</option>
              </select>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" maxLength={200} style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", background: "var(--surface-2,#f8fafc)", color: "var(--text,#0f172a)" }} />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe el problema..." rows={4} maxLength={4000} style={{ width: "100%", padding: 12, marginBottom: 14, borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", background: "var(--surface-2,#f8fafc)", color: "var(--text,#0f172a)", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setOpen(false)} disabled={sending} style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", background: "transparent", color: "var(--text-muted,#64748b)", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={submit} disabled={sending || !subject.trim() || !message.trim()} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: "var(--brand-blue,#0E68CC)", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: sending || !subject.trim() || !message.trim() ? 0.6 : 1 }}>{sending ? "Enviando..." : "Enviar reporte"}</button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </>
  );
}
