import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import logoImg from "@assets/logo-credeti-square.svg";

function HapiIcon({ size = 24, color = "#1B5FBC" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <circle cx="90" cy="52" r="16" fill={color} />
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill={color} />
    </svg>
  );
}

const steps = [
  { n: "01", title: "Registrate en minutos", body: "Crea tu cuenta con tu informacion basica. Sin tramites complicados.", active: true },
  { n: "02", title: "Solicita tu credito",   body: "Elige el monto y el plazo que mejor se adapte a tu negocio.",         active: false },
  { n: "03", title: "Recibe tu dinero",       body: "Aprobacion en 24 horas y deposito directo a tu cuenta.",              active: false },
];

const faqs = [
  { q: "Cuanto puedo solicitar?",           a: "Desde $1,000 hasta $30,000 MXN, dependiendo de tu historial con nosotros." },
  { q: "Cuanto tiempo tarda la aprobacion?", a: "Revisamos tu solicitud en menos de 24 horas habiles." },
  { q: "Que necesito para solicitar?",      a: "Identificacion oficial, CURP y comprobante de actividad economica." },
  { q: "Hay penalizacion por pago anticipado?", a: "No. Puedes liquidar tu credito cuando quieras sin cargos adicionales." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const token = localStorage.getItem("credeti_token");
  const role  = localStorage.getItem("credeti_role");

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
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section style={{
          background: "linear-gradient(160deg,#0A1F4A 0%,#1B5FBC 55%,#2978D9 100%)",
          padding: "44px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow blobs */}
          <div style={{ position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(27,95,188,0.20) 0%,transparent 70%)",pointerEvents:"none" }} />
          <div style={{ position:"absolute",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(27,95,188,0.10) 0%,transparent 70%)",pointerEvents:"none" }} />

          {/* Logo */}
          <div className="anim-section anim-d1" style={{ width:84,height:84,borderRadius:22,overflow:"hidden",marginBottom:28,boxShadow:"0 8px 32px rgba(0,0,0,0.28)" }}>
            <img src={logoImg} alt="Crede-Ti" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>

          {/* Headline */}
          <h1 className="anim-section anim-d2" style={{
            fontSize:"clamp(38px,10vw,54px)",
            fontWeight:900,lineHeight:1.06,
            letterSpacing:"-0.045em",
            color:"#fff",
            margin:"0 0 16px",
            maxWidth:360,
          }}>
            Credito rapido<br />
            <span style={{ background:"linear-gradient(90deg,#E6A82E 0%,#F5C76E 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              para crecer.
            </span>
          </h1>

          <p className="anim-section anim-d3" style={{ fontSize:16,color:"rgba(255,255,255,0.58)",lineHeight:1.65,margin:"0 0 36px",maxWidth:340 }}>
            Hasta <strong style={{ color:"#fff",fontWeight:700 }}>$30,000 MXN</strong> con aprobacion en 24 horas. Sin tramites complicados.
          </p>

          {/* CTA buttons */}
          <div className="anim-section anim-d4" style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <button onClick={handleCTA} style={{
              padding:"15px 32px",
              background:"#1B5FBC",color:"#fff",
              border:"none",borderRadius:100,
              fontWeight:800,fontSize:15,
              cursor:"pointer",fontFamily:"inherit",
              boxShadow:"0 4px 24px rgba(27,95,188,0.42)",
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
                Iniciar sesion
              </button>
            )}
          </div>

          {/* Trust stats */}
          <div className="anim-section anim-d5" style={{ display:"flex",marginTop:44,borderTop:"1px solid rgba(255,255,255,0.09)",paddingTop:28 }}>
            {[
              { val:"$30K", label:"Monto maximo" },
              { val:"24h",  label:"Aprobacion"   },
              { val:"0%",   label:"Penalizacion"  },
            ].map((s,i) => (
              <div key={s.val} style={{
                flex:1,
                textAlign: i===0?"left": i===1?"center":"right",
                borderRight: i<2?"1px solid rgba(255,255,255,0.09)":"none",
                paddingRight: i<2?20:0,
                paddingLeft: i>0?20:0,
              }}>
                <div style={{ fontSize:30,fontWeight:900,color:"#fff",letterSpacing:"-0.05em",lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — white
        ═══════════════════════════════════════════ */}
        <section style={{ background:"#fff",padding:"60px 24px" }}>
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#E6A82E",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Como funciona</div>
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
                  background: s.active?"#1B5FBC":"var(--bg-warm)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow: s.active?"0 4px 16px rgba(27,95,188,0.35)":"none",
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
            <div style={{ fontSize:11,fontWeight:700,color:"#E6A82E",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Por que nosotros</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Financiamiento<br />hecho para ti.
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
                iconBg:"#fef3c7",iconColor:"#d97706",
                title:"Rapido",body:"Respuesta en menos de 24 horas, sin filas.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                iconBg:"#d1fae5",iconColor:"#059669",
                title:"Seguro",body:"Datos protegidos con cifrado de nivel bancario.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>,
                iconBg:"#dbeafe",iconColor:"#2563eb",
                title:"100% digital",body:"Solicita y gestiona desde tu telefono.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                iconBg:"#ede9fe",iconColor:"#7c3aed",
                title:"Sin sorpresas",body:"Tasas claras, sin cargos ocultos.",
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
            <div style={{ fontSize:11,fontWeight:700,color:"#E6A82E",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Condiciones</div>
            <h2 style={{ fontSize:30,fontWeight:900,color:"#111",letterSpacing:"-0.04em",margin:0,lineHeight:1.12 }}>
              Claro y<br />sin sorpresas.
            </h2>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { label:"Montos disponibles",       value:"$1,000 – $30,000 MXN" },
              { label:"Plazos",                   value:"4 – 52 semanas"        },
              { label:"Frecuencia de pago",       value:"Semanal"               },
              { label:"Penalizacion anticipada",  value:"Ninguna"               },
              { label:"Respuesta",                value:"Menos de 24 horas"     },
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
            <div style={{ fontSize:11,fontWeight:700,color:"#E6A82E",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>Preguntas frecuentes</div>
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
                    background: openFaq===i?"#1B5FBC":"var(--bg-warm)",
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
            FINAL CTA — royal blue + gold accent
        ═══════════════════════════════════════════ */}
        <section style={{
          background:"linear-gradient(135deg,#0A1F4A 0%,#1B5FBC 60%,#2978D9 100%)",
          padding:"60px 24px 68px",
          textAlign:"center",
          position:"relative",
          overflow:"hidden",
        }}>
          <div style={{ position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,168,46,0.18) 0%,transparent 70%)",pointerEvents:"none" }} />
          <div style={{
            width:64,height:64,borderRadius:20,position:"relative",
            background:"rgba(255,255,255,0.10)",
            border:"1.5px solid rgba(230,168,46,0.5)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 22px",
          }}>
            <HapiIcon size={30} color="#E6A82E" />
          </div>
          <div style={{ fontSize:11,fontWeight:700,color:"#E6A82E",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10 }}>
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
            background:"#E6A82E",color:"#0A1F4A",
            border:"none",borderRadius:100,
            fontWeight:800,fontSize:16,
            cursor:"pointer",fontFamily:"inherit",
            letterSpacing:"-0.01em",
            boxShadow:"0 6px 28px rgba(230,168,46,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}>
            {token?"Ir a mi cuenta":"Crear cuenta gratis"}
          </button>
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#0A1F4A",padding:"36px 24px 48px",color:"rgba(255,255,255,0.32)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
            <HapiIcon size={16} color="#1B5FBC" />
            <span style={{ fontWeight:800,fontSize:14,color:"rgba(255,255,255,0.65)",letterSpacing:"-0.03em" }}>
              Crede<span style={{ color:"#E6A82E" }}>-Ti</span>
            </span>
          </div>
          <div style={{ fontSize:12,lineHeight:1.7,marginBottom:20 }}>
            Microfinanzas responsables, hechas<br />para impulsar tu negocio.
          </div>
          <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
            {["Aviso de privacidad","Terminos y condiciones","Contacto"].map(t => (
              <a key={t} href="#" style={{ fontSize:12,color:"rgba(255,255,255,0.32)",textDecoration:"none" }}>{t}</a>
            ))}
          </div>
          <div style={{ marginTop:24,fontSize:11,color:"rgba(255,255,255,0.18)" }}>
            © 2025 Crede-Ti. Todos los derechos reservados.
          </div>
        </footer>

      </div>
    </Layout>
  );
}
