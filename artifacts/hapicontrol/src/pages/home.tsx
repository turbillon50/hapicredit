import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  IconFormulario, IconReloj, IconDesembolso, IconPagos,
  IconEquipo, IconEscudo, IconCrecimiento,
  IconCelular, IconTelefono, IconUbicacion, IconFlecha,
  IconFlechaAbajo,
} from "@/components/hapi/HapiIcons";
import logoSrc from "@assets/IMG_0626_1775411853416.jpeg";

const PROCESS_STEPS = [
  { icon: <IconFormulario size={20} color="#fff" />, n: "1", title: "Solicita", desc: "Llena tu solicitud en linea con tus datos y documentos" },
  { icon: <IconReloj size={20} color="#fff" />,      n: "2", title: "Revision", desc: "Un asesor revisa tu expediente en menos de 24 horas" },
  { icon: <IconDesembolso size={20} color="#fff" />, n: "3", title: "Aprobacion", desc: "Te notificamos y se desembolsa tu credito de inmediato" },
  { icon: <IconPagos size={20} color="#fff" />,      n: "4", title: "Pagos semanales", desc: "Realiza tus pagos semanales con tu asesor asignado" },
];

const FAQS = [
  { q: "Que requisitos necesito para solicitar un credito?",   a: "Necesitas tu INE vigente (frente y reverso), selfie sosteniendo tu INE, comprobante de domicilio reciente, y contar con un aval (obligado solidario). Tambien se solicita informacion de tu negocio y referencias personales." },
  { q: "Cuanto tiempo tarda la aprobacion?",                    a: "Tu solicitud es revisada en menos de 24 horas habiles. Una vez aprobada, el desembolso se realiza de manera inmediata." },
  { q: "Cuales son las tasas y comisiones?",                    a: "Se cobra una comision por apertura del 10% sobre el monto solicitado, la cual se descuenta al momento del desembolso. Las tasas son: $175 por semana por cada $1,000 en plazo de 8 semanas, o $120 por semana por cada $1,000 en plazo de 13 semanas." },
  { q: "Que pasa si me atraso en un pago?",                     a: "Se genera una multa de $200 por cada dia de atraso. Es importante mantener tus pagos al corriente para evitar recargos y conservar un buen historial crediticio." },
  { q: "Puedo liquidar mi credito antes de tiempo?",            a: "Si, puedes liquidar anticipadamente sin penalizacion. Contacta a tu asesor para calcular el monto de liquidacion." },
  { q: "Cuanto puedo solicitar?",                               a: "Los montos van desde $1,000 hasta $30,000 pesos. El monto aprobado depende de tu capacidad de pago y evaluacion crediticia." },
];

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    setExiting(true);
    const t = setTimeout(onDone, 220);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center splash-bg ${exiting ? "splash-out" : ""}`}
      style={{ background: "linear-gradient(160deg,#080f1f 0%,#142246 50%,#1a3059 100%)" }}
    >
      <div className="splash-logo flex flex-col items-center">
        <img src={logoSrc} alt="HapiCredit" className="w-52 h-auto rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: 14, overflow: "hidden",
        background: "#fff",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left pressable"
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", paddingRight: 16, lineHeight: 1.4 }}>{q}</span>
        <span
          style={{
            flexShrink: 0, transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            color: "var(--text-muted)",
          }}
        >
          <IconFlechaAbajo size={17} />
        </span>
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <div style={{ padding: "0 16px 16px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          {a}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();

  const isLoggedIn  = !!localStorage.getItem("hapi_token");
  const storedRole  = localStorage.getItem("hapi_role");
  const [splashSeen] = useState(() => sessionStorage.getItem("hapi_splash") === "1");
  const [showSplash, setShowSplash] = useState(() => !isLoggedIn && !splashSeen);

  useEffect(() => {
    if (isLoggedIn) {
      if (storedRole === "admin") navigate("/admin");
      else if (storedRole === "executive") navigate("/dashboard");
      else navigate("/mi-credito");
    }
  }, []);

  if (isLoggedIn) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)" }}>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Redirigiendo...</div>
    </div>
  );

  function handleSplashDone() {
    setShowSplash(false);
    sessionStorage.setItem("hapi_splash", "1");
  }

  return (
    <>
      {showSplash && !splashSeen && <SplashScreen onDone={handleSplashDone} />}
      <Layout>
        <div className="flex flex-col gap-0">

          {/* ─── Hero ─── */}
          <div
            className="px-5 pt-10 pb-12 text-center anim-section anim-d1"
            style={{
              background: "linear-gradient(160deg,#080f1f 0%,#142246 55%,#1a3059 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0, opacity: 0.04,
                backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 40%), radial-gradient(circle at 80% 20%, #e84545 0%, transparent 40%)",
                pointerEvents: "none",
              }}
            />
            <img
              src={logoSrc}
              alt="HapiCredit"
              style={{ width: 160, height: "auto", margin: "0 auto 18px", borderRadius: 18, boxShadow: "0 12px 48px rgba(0,0,0,0.35)", display: "block" }}
            />
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 10 }}>
              Credito rapido para<br />hacer crecer tu negocio
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.65, maxWidth: 280, margin: "0 auto 24px" }}>
              Montos desde $1,000 hasta $30,000. Aprobacion en 24 horas.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Link href="/registro">
                <button
                  className="pressable float-cta"
                  style={{
                    padding: "13px 24px",
                    background: "var(--coral)", color: "#fff",
                    border: "none", borderRadius: 14,
                    fontSize: 14, fontWeight: 700,
                    boxShadow: "0 4px 20px rgba(232,69,69,0.4)",
                    cursor: "pointer",
                  }}
                >
                  Solicitar ahora
                </button>
              </Link>
              <Link href="/login">
                <button
                  className="pressable"
                  style={{
                    padding: "13px 20px",
                    background: "rgba(255,255,255,0.1)", color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 14,
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Iniciar sesion
                </button>
              </Link>
            </div>

            {/* Quick stats */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1, marginTop: 28,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                { n: "$30K", label: "Monto max" },
                { n: "24h", label: "Aprobacion" },
                { n: "0%", label: "Penalizacion" },
              ].map(s => (
                <div key={s.n} style={{ padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.04em" }}>{s.n}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Quienes somos ─── */}
          <div style={{ padding: "28px 16px 8px" }} className="anim-section anim-d2">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--coral)" }}>Quienes somos</span>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>HapiCredit por Grupo CAFJA</h2>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                Somos una empresa financiera especializada en <strong>microcreditos</strong> para emprendedores y comerciantes. Impulsamos el crecimiento de negocios locales con creditos accesibles, transparentes y atencion personalizada.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: <IconEquipo size={24} color="var(--accent)" />, title: "Atencion personal", sub: "Asesor asignado", bg: "rgba(20,34,70,0.05)" },
                  { icon: <IconEscudo size={24} color="#0ea572" />,        title: "Transparencia",    sub: "Sin letras chicas", bg: "#f0fdf4" },
                  { icon: <IconReloj size={24} color="#f0930a" />,         title: "Aprobacion 24h",  sub: "Proceso rapido", bg: "#fff7ed" },
                  { icon: <IconCrecimiento size={24} color="var(--coral)" />, title: "Crecimiento", sub: "Impulsa tu negocio", bg: "var(--coral-bg)" },
                ].map(c => (
                  <div key={c.title} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 12, background: c.bg }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Como funciona ─── */}
          <div style={{ padding: "20px 16px 8px" }} className="anim-section anim-d3">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--coral)" }}>Proceso</span>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Como funciona</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PROCESS_STEPS.map((s, i) => (
                <div
                  key={s.title}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "#fff", borderRadius: 14, padding: "14px 16px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: `linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--coral)", marginRight: 4, fontSize: 11 }}>{s.n}.</span>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Nuestros creditos ─── */}
          <div style={{ padding: "20px 16px 8px" }} className="anim-section anim-d4">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--coral)" }}>Condiciones</span>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Nuestros creditos</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: "16px 12px", textAlign: "center", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.04em" }}>$1,000</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Monto minimo</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "16px 12px", textAlign: "center", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.04em" }}>$30,000</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Monto maximo</div>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                Opciones de plazo
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(20,34,70,0.04)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>8 semanas</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Plazo corto</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.04em" }}>$175</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>por sem / $1,000</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "var(--coral-bg)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>13 semanas</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Plazo extendido</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--coral)", letterSpacing: "-0.04em" }}>$120</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>por sem / $1,000</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text-secondary)" }}>Comision de apertura:</strong> 10% descontado al desembolso. Ej: solicitas $5,000, recibes $4,500.
              </div>
            </div>
          </div>

          {/* ─── FAQs ─── */}
          <div style={{ padding: "20px 16px 8px" }} className="anim-section anim-d5">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--coral)" }}>Preguntas</span>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Dudas frecuentes</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>

          {/* ─── Instalar app ─── */}
          <div style={{ padding: "20px 16px 8px" }} className="anim-section anim-d6">
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconCelular size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Instala la app en tu celular</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Sin descargar desde la tienda</div>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>iPhone (Safari)</div>
              <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16, marginBottom: 12 }}>
                <li>Abre esta pagina en <strong>Safari</strong></li>
                <li>Toca <strong>Compartir</strong> (cuadro con flecha)</li>
                <li>Selecciona <strong>"Agregar a inicio"</strong></li>
              </ol>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Android (Chrome)</div>
              <ol style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 16 }}>
                <li>Abre en <strong>Chrome</strong></li>
                <li>Menu de tres puntos → <strong>"Instalar app"</strong></li>
              </ol>
            </div>
          </div>

          {/* ─── Contacto ─── */}
          <div style={{ padding: "20px 16px 8px" }} className="anim-section anim-d7">
            <div className="card" style={{ textAlign: "center", padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Contacto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <IconTelefono size={16} color="var(--accent)" />
                  Contacta a tu asesor asignado
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <IconUbicacion size={16} color="var(--accent)" />
                  Cobertura en tu localidad
                </div>
              </div>
            </div>
          </div>

          {/* ─── CTA final ─── */}
          <div style={{ padding: "20px 16px 8px" }}>
            <Link href="/solicitar">
              <button
                className="pressable"
                style={{
                  width: "100%", padding: "16px",
                  background: "linear-gradient(135deg, var(--coral) 0%, var(--coral-light) 100%)",
                  color: "#fff", border: "none", borderRadius: 16,
                  fontWeight: 700, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(232,69,69,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Solicitar mi credito ahora <IconFlecha size={16} color="#fff" />
              </button>
            </Link>
          </div>

          {/* ─── Footer ─── */}
          <div style={{ textAlign: "center", padding: "20px 16px 32px" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 10 }}>
              <Link href="/privacidad" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Privacidad</Link>
              <Link href="/terminos"   style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Terminos</Link>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>HapiCredit por Grupo CAFJA · v1.0</div>
          </div>

        </div>
      </Layout>
    </>
  );
}
