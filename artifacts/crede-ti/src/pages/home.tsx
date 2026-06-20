import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import heroTexture from "@assets/hero-texture.jpg";
import logoImg from "@assets/logo-credeti-square.jpeg";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

/* ── Datos ── */
const steps = [
  { n: "01", title: "Regístrate en minutos", body: "Crea tu cuenta con tu información básica. Solo necesitas tu identificación." },
  { n: "02", title: "Solicita tu crédito",   body: "Elige el monto y el plazo que mejor se adapte a tu negocio. Tú decides." },
  { n: "03", title: "Recibe tu dinero",      body: "Tu asesor te contacta para entregarte el crédito en menos de 24 horas." },
];

const ventajas = [
  { title: "Sin comisión", body: "No cobramos comisión por apertura. Lo que pides es lo que recibes." },
  { title: "Tú eliges", body: "Pago semanal o quincenal, cualquier día de la semana que prefieras." },
  { title: "Hasta 48 semanas", body: "Cliente recurrente puede pagar de 4 a 48 semanas según su flujo." },
  { title: "Mora justa", body: "Solo 10% del pago atrasado, no por día. Sin penalizaciones abusivas." },
];

const condiciones = [
  { label: "Cliente nuevo",          value: "$500 – $1,000 · 4 semanas · 30%" },
  { label: "Cliente recurrente",     value: "$1,000 – $30,000 · 4–48 sem · 5% mensual" },
  { label: "Frecuencia de pago",     value: "Semanal o quincenal" },
  { label: "Día de pago",            value: "A elección (lun a dom)" },
  { label: "Comisión por apertura",  value: "Sin comisión" },
  { label: "Mora",                   value: "10% del pago atrasado" },
  { label: "Penalización anticipada",value: "Ninguna" },
  { label: "Respuesta",              value: "Menos de 24 horas" },
];

/* ── Iconos de sección (line, sobrios) ── */
const IconSteps = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconWhy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
const IconCond = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
const IconChevron = ({ open }: { open: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s var(--ease-out-expo)" }}><polyline points="6 9 12 15 18 9"/></svg>;

/* ── Tarjeta acordeón premium: muestra resumen, expande al tocar ── */
function AccordionCard({ icon, eyebrow, title, summary, defaultOpen = false, children }: {
  icon: React.ReactNode; eyebrow: string; title: string; summary: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ overflow: "hidden", padding: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="pressable"
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "18px 18px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: "var(--r-md)", flexShrink: 0, background: "var(--surface-3)", color: "var(--brand-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{eyebrow}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{title}</div>
          {!open && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</div>}
        </div>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}><IconChevron open={open} /></span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 20px", animation: "fadeUpSpring 0.4s var(--ease-out-expo)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [demoEnabled, setDemoEnabled] = useState<boolean | null>(null);
  const token = localStorage.getItem("credeti_token");
  const role  = localStorage.getItem("credeti_role");

  useEffect(() => {
    fetch(`${API}/demo/status`).then(r => r.json()).then(d => setDemoEnabled(Boolean(d?.enabled))).catch(() => setDemoEnabled(false));
  }, []);

  function handleCTA() {
    if (token) {
      if (role === "admin")          navigate("/admin");
      else if (role === "executive") navigate("/dashboard");
      else                           navigate("/mi-credito");
    } else {
      navigate("/registro");
    }
  }

  return (
    <Layout>
      <div className="home-premium" style={{ fontFamily: "var(--font-display)" }}>

        {/* ═══════ HERO COMPACTO ═══════ */}
        <section className="mesh-institutional home-hero" style={{ position: "relative", overflow: "hidden" }}>
          {/* Textura sutil */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroTexture})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4, mixBlendMode: "screen", pointerEvents: "none" }} />
          <div className="home-hero-inner" style={{ position: "relative", zIndex: 2 }}>
            <div style={{ width: 64, height: 64, borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 20, boxShadow: "var(--shadow-md)" }}>
              <img src={logoImg} alt="credeti" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <h1 className="font-display" style={{ fontSize: "clamp(30px,7vw,42px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 12px", maxWidth: 340 }}>
              Crédito rápido<br />
              <span style={{ color: "#7FE9EE" }}>para crecer.</span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.62)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 320 }}>
              Desde <strong style={{ color: "#fff", fontWeight: 700 }}>$500</strong> hasta <strong style={{ color: "#fff", fontWeight: 700 }}>$30,000 MXN</strong>. Sin comisión por apertura.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <button onClick={handleCTA} className="pressable" style={{ padding: "13px 26px", background: "#fff", color: "var(--brand-blue-deep)", border: "none", borderRadius: 100, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}>
                {token ? "Ir a mi cuenta" : "Solicitar ahora"}
              </button>
              {!token && (
                <button onClick={() => navigate("/login")} className="pressable btn-glass-teal" style={{ padding: "13px 26px", borderRadius: 100, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Iniciar sesión
                </button>
              )}
            </div>
            {/* Stats compactas inline */}
            <div style={{ display: "flex", gap: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
              {[["$30K", "Monto máx"], ["48", "Semanas"], ["0%", "Comisión"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ CONTENIDO DESCUBRIBLE (acordeones) ═══════ */}
        <div className="home-content">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", paddingLeft: 2 }}>
            Conoce más
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Cómo funciona */}
            <AccordionCard icon={<IconSteps />} eyebrow="¿Cómo funciona?" title="Tres pasos, y listo" summary="Regístrate, solicita, recibe tu dinero" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", flexShrink: 0, background: i === 0 ? "var(--brand-blue)" : "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? "#fff" : "var(--text-secondary)" }}>{s.n}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionCard>

            {/* Por qué nosotros */}
            <AccordionCard icon={<IconWhy />} eyebrow="¿Por qué nosotros?" title="Financiamiento hecho para ti" summary="Sin comisión, tú eliges, mora justa">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ventajas.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-blue)", marginTop: 7, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 1 }}>{v.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{v.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionCard>

            {/* Condiciones */}
            <AccordionCard icon={<IconCond />} eyebrow="Condiciones" title="Claro y sin sorpresas" summary="Tasas, plazos y términos transparentes">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {condiciones.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < condiciones.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </AccordionCard>

          </div>

          {/* CTA final */}
          <button onClick={handleCTA} className="pressable btn-brand" style={{ width: "100%", marginTop: 16, padding: 16, borderRadius: "var(--r-lg)", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            {token ? "Ir a mi cuenta" : "Solicitar mi crédito"}
          </button>

          {demoEnabled && (
            <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {(["admin", "executive", "client"] as const).map(r => (
                <button key={r} onClick={() => { localStorage.setItem("credeti_token", `demo-token-${r}`); localStorage.setItem("credeti_role", r); localStorage.setItem("credeti_user", JSON.stringify({ id: r === "admin" ? 1 : r === "executive" ? 2 : 3, fullName: r === "admin" ? "Admin Demo" : r === "executive" ? "Asesor Demo" : "Cliente Demo", role: r, treeId: 1 })); window.location.href = r === "admin" ? "/admin" : r === "executive" ? "/dashboard" : "/mi-credito"; }}
                  style={{ fontSize: 11, padding: "6px 12px", borderRadius: 100, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 }}>
                  Demo {r}
                </button>
              ))}
            </div>
          )}

          {/* Footer mínimo */}
          <footer style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="https://wa.me/525631908262" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600 }}>WhatsApp</a>
              <a href="https://link.mercadopago.com.mx/credeti" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600 }}>Pagar en línea</a>
              <a href="/privacidad" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Privacidad</a>
              <a href="/terminos" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Términos</a>
              <a href="/faq" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>FAQ</a>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              © {new Date().getFullYear()} credeti · Microfinanzas responsables
            </div>
          </footer>
        </div>

      </div>
    </Layout>
  );
}
