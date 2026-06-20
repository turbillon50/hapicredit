import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import logoImg from "@assets/logo-credeti-square.jpeg";
import { CountUp } from "@/components/hapi/CountUp";
import heroTexture from "@assets/hero-texture.jpg";

function HapiIcon({ size = 24, color = "#215DFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <circle cx="90" cy="52" r="16" fill={color} />
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill={color} />
    </svg>
  );
}

const steps = [
  { n: "01", title: "Regístrate en minutos", body: "Crea tu cuenta con tu información básica.", active: true },
  { n: "02", title: "Solicita tu crédito",   body: "Elige el monto y el plazo que mejor se adapte a tu negocio.",         active: false },
  { n: "03", title: "Recibe tu dinero",       body: "Tu asesor te contacta para entregarte el crédito.",              active: false },
];

const faqs = [
  { q: "¿Cuánto puedo solicitar?",                 a: "Si es tu primer crédito con nosotros: de $500 a $1,000 MXN a 4 semanas con 30% de interés. Cliente recurrente: de $1,000 a $30,000 MXN, de 4 a 48 semanas, 5% de interés mensual." },
  { q: "¿Hay comisión por apertura?",              a: "No. credeti no cobra comisión por apertura." },
  { q: "¿Qué pasa si pago tarde?",                 a: "El cargo por pago tardío es del 10% del pago atrasado. Por ejemplo, si tu cuota es de $300, la mora sería de $30." },
  { q: "¿Cómo elijo la frecuencia y el día de pago?", a: "En la solicitud puedes elegir pago semanal o quincenal, y el día de pago que prefieras de lunes a domingo." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoEnabled, setDemoEnabled] = useState<boolean | null>(null);
  const token = localStorage.getItem("credeti_token");
  const role  = localStorage.getItem("credeti_role");

  // Probe the backend once. While we don't know, hide the demo entry
  // (avoid flash of demo buttons on production loads).
  useEffect(() => {
    fetch("/api/demo/status")
      .then(r => r.json())
      .then(d => setDemoEnabled(Boolean(d?.enabled)))
      .catch(() => setDemoEnabled(false));
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

  function enterDemo(asRole: "admin" | "executive" | "client") {
    const homePath = asRole === "admin" ? "/admin" : asRole === "executive" ? "/dashboard" : "/mi-credito";
    const user = {
      id: asRole === "admin" ? 1 : asRole === "executive" ? 2 : 3,
      username: `demo_${asRole}`,
      fullName: asRole === "admin" ? "Admin Demo" : asRole === "executive" ? "Asesor Demo" : "Cliente Demo",
      email: `${asRole}@demo.crede-ti.info`,
      role: asRole,
      treeId: 1,
    };
    localStorage.setItem("credeti_token", `demo-token-${asRole}`);
    localStorage.setItem("credeti_role", asRole);
    localStorage.setItem("credeti_user", JSON.stringify(user));
    window.location.href = homePath;
  }

  return (
    <Layout>
      <div style={{ fontFamily: "Montserrat, Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section style={{
          background: "linear-gradient(160deg,#06143B 0%,#215DFF 55%,#19D7D7 100%)",
          padding: "44px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Textura Higgsfield de fondo — ondas de seda azul/turquesa */}
          <div style={{
            position:"absolute", inset:0,
            backgroundImage:`url(${heroTexture})`,
            backgroundSize:"cover",
            backgroundPosition:"center bottom",
            opacity:0.55,
            mixBlendMode:"screen",
            pointerEvents:"none",
          }} />
          {/* Overlay para legibilidad del texto */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(165deg, rgba(6,20,59,0.62) 0%, rgba(33,93,255,0.30) 50%, rgba(25,215,215,0.12) 100%)",
            pointerEvents:"none",
          }} />
          {/* Glow blobs */}
          <div style={{ position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,104,204,0.20) 0%,transparent 70%)",pointerEvents:"none" }} />
          <div style={{ position:"absolute",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,104,204,0.10) 0%,transparent 70%)",pointerEvents:"none" }} />

          {/* Logo */}
          <div className="anim-section anim-d1" style={{ position:"relative",zIndex:2,width:84,height:84,borderRadius:22,overflow:"hidden",marginBottom:28,boxShadow:"0 8px 32px rgba(0,0,0,0.28)" }}>
            <img src={logoImg} alt="credeti" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>

          {/* Headline */}
          <h1 className="anim-section anim-d2 font-display" style={{ position:"relative",zIndex:2,
            fontSize:"clamp(38px,10vw,54px)",
            fontWeight:700,lineHeight:1.05,
            letterSpacing:"-0.03em",
            color:"#fff",
            margin:"0 0 16px",
            maxWidth:360,
          }}>
            Crédito rápido<br />
            <span style={{ background:"linear-gradient(90deg,#19D7D7 0%,#7DF0F0 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              para crecer.
            </span>
          </h1>

          <p className="anim-section anim-d3" style={{ position:"relative",zIndex:2,fontSize:16,color:"rgba(255,255,255,0.58)",lineHeight:1.65,margin:"0 0 36px",maxWidth:340 }}>
            Cliente nuevo desde <strong style={{ color:"#fff",fontWeight:700 }}>$500 MXN</strong>. Cliente recurrente hasta <strong style={{ color:"#fff",fontWeight:700 }}>$30,000 MXN</strong>. Sin comisión por apertura.
          </p>

          {/* CTA buttons */}
          <div className="anim-section anim-d4" style={{ position:"relative",zIndex:2,display:"flex",gap:12,flexWrap:"wrap" }}>
            <button onClick={handleCTA} style={{
              padding:"15px 32px",
              background:"#215DFF",color:"#fff",
              border:"none",borderRadius:100,
              fontWeight:800,fontSize:15,
              cursor:"pointer",fontFamily:"inherit",
              boxShadow:"0 4px 24px rgba(14,104,204,0.42)",
              letterSpacing:"-0.01em",
            }}>
              {token ? "Ir a mi cuenta" : "Solicitar ahora"}
            </button>
            {!token && (
              <button onClick={() => navigate("/login")} style={{
                padding:"15px 24px",
                background:"rgba(255,255,255,0.09)",color:"#fff",
                border:"1.5px solid rgba(255,255,255,0.16)",borderRadius:100,
                fontWeight:600,fontSize:15,
                cursor:"pointer",fontFamily:"inherit",
                backdropFilter:"blur(8px)",
                letterSpacing:"-0.01em",
              }}>
                Iniciar sesión
              </button>
            )}
          </div>

          {/* Trust stats — con números animados */}
          <div className="anim-section anim-d5" style={{ position:"relative",zIndex:2,display:"flex",marginTop:44,borderTop:"1px solid rgba(255,255,255,0.09)",paddingTop:28 }}>
            {[
              { node: <CountUp value={30} prefix="$" suffix="K" />, label:"Monto máximo" },
              { node: <CountUp value={48} />,                       label:"Sem. máx" },
              { node: <CountUp value={0} suffix="%" />,             label:"Comisión" },
            ].map((s,i) => (
              <div key={i} style={{
                flex:1,
                textAlign: i===0?"left": i===1?"center":"right",
                borderRight: i<2?"1px solid rgba(255,255,255,0.09)":"none",
                paddingRight: i<2?20:0,
                paddingLeft: i>0?20:0,
              }}>
                <div style={{ fontSize:30,fontWeight:900,color:"#fff",letterSpacing:"-0.05em",lineHeight:1 }}>{s.node}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DEMO ACCESS — only when the backend says demo mode is on
            (DEMO_MODE_ENABLED=true). Hidden in real production.
        ═══════════════════════════════════════════ */}
        {demoEnabled === true && (
        <section style={{
          background:"linear-gradient(135deg,#FFF7E6 0%,#FFF1D6 100%)",
          padding:"32px 24px",
          borderTop:"3px solid #19D7D7",
          borderBottom:"1px solid #F5D88F",
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            <span style={{ fontSize:10,fontWeight:800,color:"#0A2E8A",background:"#19D7D7",padding:"3px 9px",borderRadius:100,letterSpacing:"0.08em" }}>MODO DEMO</span>
            <span style={{ fontSize:11,color:"#7C5B14",fontWeight:600 }}>Para revisión</span>
          </div>
          <h3 style={{ fontSize:18,fontWeight:800,color:"#0A2E8A",margin:"0 0 6px",letterSpacing:"-0.02em" }}>
            Entra sin cuenta a ver cada pantalla
          </h3>
          <p style={{ fontSize:13,color:"#6B5219",margin:"0 0 18px",lineHeight:1.55 }}>
            Sin base de datos real conectada. Los listados aparecerán vacíos
            (es esperado) — el objetivo es navegar la marca, la UX y las
            pantallas de cada rol.
          </p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
            {[
              { role:"client",    label:"Cliente",  sub:"Acreditado", color:"#059669" },
              { role:"executive", label:"Asesor",   sub:"Ejecutivo",  color:"#215DFF" },
              { role:"admin",     label:"Admin",    sub:"Control",    color:"#7C3AED" },
            ].map(d => (
              <button
                key={d.role}
                onClick={() => enterDemo(d.role as "admin"|"executive"|"client")}
                style={{
                  padding:"12px 8px",
                  background:"#fff",
                  border:`1.5px solid ${d.color}`,
                  borderRadius:14,
                  cursor:"pointer",
                  fontFamily:"inherit",
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  gap:2,
                  boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize:13,fontWeight:800,color:d.color,letterSpacing:"-0.01em" }}>{d.label}</span>
                <span style={{ fontSize:10,color:"#94a3b8",fontWeight:500 }}>{d.sub}</span>
              </button>
            ))}
          </div>
        </section>
        )}

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — white
        ═══════════════════════════════════════════ */}
        <section style={{ background:"#fff",padding:"60px 24px" }}>
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#19D7D7",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>¿Cómo funciona?</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Tres pasos,<br />y listo.
            </h2>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
            {steps.map((s,i) => (
              <div key={i} style={{
                display:"flex",gap:20,alignItems:"flex-start",
                padding:"22px 0",
                borderBottom: i<steps.length-1?"1px solid var(--border)":"none",
              }}>
                <div style={{
                  width:46,height:46,borderRadius:14,flexShrink:0,
                  background: s.active?"#215DFF":"var(--bg-warm)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow: s.active?"0 4px 16px rgba(14,104,204,0.35)":"none",
                }}>
                  <span style={{ fontSize:13,fontWeight:800,color:s.active?"#fff":"var(--text-secondary)",letterSpacing:"-0.02em" }}>{s.n}</span>
                </div>
                <div style={{ paddingTop:2 }}>
                  <div style={{ fontSize:16,fontWeight:700,color:"#111",marginBottom:5,letterSpacing:"-0.025em" }}>{s.title}</div>
                  <div style={{ fontSize:14,color:"var(--text-secondary)",lineHeight:1.65 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHY — warm bg
        ═══════════════════════════════════════════ */}
        <section style={{ background:"var(--bg-warm)",padding:"60px 24px" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#19D7D7",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>¿Por qué nosotros?</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Financiamiento<br />hecho para ti.
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                iconBg:"var(--surface-3)",iconColor:"#d97706",
                title:"Sin comisión",body:"No cobramos comisión por apertura.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                iconBg:"var(--surface-3)",iconColor:"#059669",
                title:"Tú eliges",body:"Pago semanal o quincenal, cualquier día de la semana.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
                iconBg:"rgba(33,93,255,0.10)",iconColor:"#2563eb",
                title:"Hasta 48 semanas",body:"Cliente recurrente puede pagar de 4 a 48 semanas.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7L9 18l-5-5"/></svg>,
                iconBg:"var(--surface-3)",iconColor:"var(--text-secondary)",
                title:"Mora justa",body:"Solo 10% del pago atrasado, no por día.",
              },
            ].map((f,i) => (
              <div key={i} style={{
                background:"#fff",borderRadius:20,padding:"20px 16px",
                border:"1px solid var(--border)",
                boxShadow:"var(--shadow-sm)",
              }}>
                <div style={{
                  width:40,height:40,borderRadius:12,flexShrink:0,
                  background:f.iconBg,color:f.iconColor,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  marginBottom:12,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize:14,fontWeight:700,color:"#111",marginBottom:4,letterSpacing:"-0.02em" }}>{f.title}</div>
                <div style={{ fontSize:12,color:"var(--text-secondary)",lineHeight:1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CONDITIONS — white
        ═══════════════════════════════════════════ */}
        <section style={{ background:"#fff",padding:"60px 24px" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#19D7D7",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Condiciones</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Claro y<br />sin sorpresas.
            </h2>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { label:"Cliente nuevo",            value:"$500 – $1,000 · 4 semanas · 30%"     },
              { label:"Cliente recurrente",       value:"$1,000 – $30,000 · 4–48 sem · 5% mensual" },
              { label:"Frecuencia de pago",       value:"Semanal o quincenal"                  },
              { label:"Día de pago",              value:"A elección (lun a dom)"               },
              { label:"Comisión por apertura",    value:"Sin comisión"                         },
              { label:"Mora",                     value:"10% del pago atrasado"                },
              { label:"Penalización anticipada",  value:"Ninguna"                              },
              { label:"Respuesta",                value:"Menos de 24 horas"                    },
            ].map((c,i) => (
              <div key={i} style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"16px 20px",
                background:"var(--bg-warm)",borderRadius:14,
                border:"1px solid var(--border)",
              }}>
                <span style={{ fontSize:14,color:"var(--text-secondary)",fontWeight:500 }}>{c.label}</span>
                <span style={{ fontSize:14,fontWeight:700,color:"#111",letterSpacing:"-0.01em" }}>{c.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <section style={{ background:"var(--bg-warm)",padding:"60px 24px" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#19D7D7",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Preguntas frecuentes</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Resolvemos<br />tus dudas.
            </h2>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {faqs.map((f,i) => (
              <div key={i} style={{
                background:"#fff",borderRadius:18,
                border:"1px solid var(--border)",
                overflow:"hidden",
                boxShadow: openFaq===i?"var(--shadow-md)":"var(--shadow-xs)",
                transition:"box-shadow 0.2s",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq===i?null:i)}
                  style={{
                    width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"18px 20px",background:"none",border:"none",cursor:"pointer",
                    fontFamily:"inherit",textAlign:"left",
                  }}
                >
                  <span style={{ fontSize:15,fontWeight:700,color:"#111",letterSpacing:"-0.02em",paddingRight:12 }}>{f.q}</span>
                  <span style={{
                    width:28,height:28,borderRadius:8,flexShrink:0,
                    background: openFaq===i?"#215DFF":"var(--bg-warm)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"background 0.2s",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d={openFaq===i?"M2 6h8":"M6 2v8M2 6h8"} stroke={openFaq===i?"#fff":"#6b6b6b"} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                <div className={`faq-answer${openFaq===i?" open":""}`}>
                  <div style={{ padding:"0 20px 18px",fontSize:14,color:"var(--text-secondary)",lineHeight:1.7 }}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FINAL CTA — royal blue + teal accent (no gold)
        ═══════════════════════════════════════════ */}
        <section style={{
          background:"linear-gradient(135deg, #3A00C8, #215DFF, #19D7D7)",
          padding:"60px 24px 68px",
          textAlign:"center",
          position:"relative",
          overflow:"hidden",
        }}>
          <div style={{ position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle,rgba(25,215,215,0.18) 0%,transparent 70%)",pointerEvents:"none" }} />
          <div style={{
            width:64,height:64,borderRadius:20,position:"relative",
            background:"rgba(255,255,255,0.10)",
            border:"1.5px solid rgba(25,215,215,0.45)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 22px",
          }}>
            <HapiIcon size={30} color="#19D7D7" />
          </div>
          <div style={{ fontSize:11,fontWeight:700,color:"#19D7D7",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10 }}>
            Creemos en ti
          </div>
          <h2 style={{ fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.04em",margin:"0 0 12px",lineHeight:1.1 }}>
            Empieza hoy<br />sin compromiso
          </h2>
          <p style={{ color:"rgba(255,255,255,0.78)",fontSize:15,margin:"0 0 32px",lineHeight:1.65 }}>
            Más que un crédito — una forma distinta de vivir.<br />La solicitud toma menos de 5 minutos.
          </p>
          <button onClick={handleCTA} style={{
            padding:"16px 42px",
            background:"#19D7D7",color:"#0A2E8A",
            border:"none",borderRadius:100,
            fontWeight:800,fontSize:16,
            cursor:"pointer",fontFamily:"inherit",
            letterSpacing:"-0.01em",
            boxShadow:"0 6px 28px rgba(25,215,215,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}>
            {token?"Ir a mi cuenta":"Crear cuenta gratis"}
          </button>
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#0A2E8A",padding:"36px 24px 48px",color:"rgba(255,255,255,0.32)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
            <HapiIcon size={16} color="#215DFF" />
            <span style={{ fontWeight:800,fontSize:14,color:"rgba(255,255,255,0.65)",letterSpacing:"-0.03em" }}>
              crede<span style={{ color:"#19D7D7" }}>ti</span>
            </span>
          </div>
          <div style={{ fontSize:12,lineHeight:1.7,marginBottom:20 }}>
            Microfinanzas responsables, hechas<br />para impulsar tu negocio.
          </div>

          {/* Social media */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#19D7D7",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10 }}>Síguenos</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {[
                { name:"Facebook", href:"https://www.facebook.com/profile.php?id=61557831849432&sfnsn=wa", bg:"#1877F2" },
                { name:"TikTok",   href:"https://www.tiktok.com/@credeti4?_r=1&_t=ZS-93SMngFBDLb", bg:"#000" },
                { name:"YouTube",  href:"https://youtube.com/@crede-ti?si=LMHLBMcXqtG3Il25", bg:"#FF0000" },
              ].map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding:"8px 14px",borderRadius:100,
                    background:s.bg,color:"#fff",
                    fontSize:12,fontWeight:700,textDecoration:"none",
                    letterSpacing:"-0.01em",
                  }}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#19D7D7",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10 }}>Contacto y cobranza</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              <a
                href="https://wa.me/525631908262"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize:12,color:"rgba(255,255,255,0.6)",textDecoration:"none" }}
              >
                WhatsApp: <strong style={{ color:"rgba(255,255,255,0.85)" }}>56 3190 8262</strong>
              </a>
              <a
                href="mailto:financiamiento@crede-ti.com"
                style={{ fontSize:12,color:"rgba(255,255,255,0.6)",textDecoration:"none" }}
              >
                <strong style={{ color:"rgba(255,255,255,0.85)" }}>financiamiento@crede-ti.com</strong>
              </a>
            </div>
          </div>

          {/* Soporte técnico */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#19D7D7",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10 }}>Soporte técnico</div>
            <a
              href="https://wa.me/529984292748"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:"inline-flex",alignItems:"center",gap:8,
                padding:"10px 16px",borderRadius:100,
                background:"#25d366",color:"#fff",
                fontSize:13,fontWeight:700,textDecoration:"none",
                letterSpacing:"-0.01em",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.523 5.856L0 24l6.335-1.502A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.887 0-3.661-.497-5.2-1.369l-.373-.217-3.864.916.977-3.773-.243-.387A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              998 429 2748
            </a>
          </div>

          {/* Pago en línea */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#19D7D7",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10 }}>Pago en línea</div>
            <a
              href="https://link.mercadopago.com.mx/credeti"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:"inline-flex",alignItems:"center",gap:8,
                padding:"10px 16px",borderRadius:100,
                background:"#009EE3",color:"#fff",
                fontSize:13,fontWeight:700,textDecoration:"none",
                letterSpacing:"-0.01em",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Pagar con Mercado Pago
            </a>
          </div>

          <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
            <a href="/privacidad" style={{ fontSize:12,color:"rgba(255,255,255,0.45)",textDecoration:"none" }}>Aviso de privacidad</a>
            <a href="/terminos"   style={{ fontSize:12,color:"rgba(255,255,255,0.45)",textDecoration:"none" }}>Términos y condiciones</a>
            <a href="/faq"        style={{ fontSize:12,color:"rgba(255,255,255,0.45)",textDecoration:"none" }}>FAQ</a>
          </div>
          <div style={{ marginTop:24,fontSize:11,color:"rgba(255,255,255,0.18)" }}>
            © {new Date().getFullYear()} credeti. Todos los derechos reservados.
          </div>
        </footer>

      </div>
    </Layout>
  );
}
