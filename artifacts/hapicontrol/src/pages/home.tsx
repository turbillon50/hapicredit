import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  RiArrowRightLine, RiShieldCheckLine, RiTimeLine,
  RiMoneyDollarCircleLine, RiCheckboxCircleLine,
  RiUserLine, RiBriefcaseLine, RiSettings3Line,
  RiQuestionLine, RiFileTextLine, RiSmartphoneLine,
  RiArrowDownSLine, RiTeamLine, RiHandHeartLine,
  RiLineChartLine, RiPhoneLine, RiMailLine,
  RiMapPinLine, RiStarLine,
} from "react-icons/ri";

const PROCESS_STEPS = [
  { icon: <RiCheckboxCircleLine />, title: "1. Solicita", desc: "Llena tu solicitud en linea con tus datos y documentos" },
  { icon: <RiTimeLine />, title: "2. Revision", desc: "Un asesor revisa tu expediente en menos de 24 horas" },
  { icon: <RiMoneyDollarCircleLine />, title: "3. Aprobacion", desc: "Te notificamos y se desembolsa tu credito" },
  { icon: <RiHandHeartLine />, title: "4. Pagos semanales", desc: "Realiza tus pagos semanales con tu asesor asignado" },
];

const ROLES = [
  {
    key: "cliente",
    label: "Cliente",
    desc: "Solicita tu credito, sube documentos y consulta tu estado de cuenta",
    icon: <RiUserLine />,
    gradient: "linear-gradient(135deg,#2563eb,#60a5fa)",
    href: "/solicitar",
    screens: ["Solicitar credito", "Mi credito", "Perfil"],
  },
  {
    key: "ejecutivo",
    label: "Ejecutivo",
    desc: "Gestiona tu cartera, registra cobros y da seguimiento a clientes",
    icon: <RiBriefcaseLine />,
    gradient: "linear-gradient(135deg,#059669,#34d399)",
    href: "/admin/cartera",
    screens: ["Cartera", "Registrar pagos", "Expedientes"],
  },
  {
    key: "administrador",
    label: "Administrador",
    desc: "Panel completo: valida pagos, aprueba creditos, controla caja y analiza KPIs",
    icon: <RiSettings3Line />,
    gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    href: "/admin",
    screens: ["Dashboard", "Validar pagos", "Solicitudes", "Morosos", "Caja"],
  },
];

const FAQS = [
  {
    q: "Que requisitos necesito para solicitar un credito?",
    a: "Necesitas tu INE vigente (frente y reverso), selfie sosteniendo tu INE, comprobante de domicilio reciente, y contar con un aval (obligado solidario). Tambien se solicita informacion de tu negocio y referencias personales.",
  },
  {
    q: "Cuanto tiempo tarda la aprobacion?",
    a: "Tu solicitud es revisada en menos de 24 horas habiles. Una vez aprobada, el desembolso se realiza de manera inmediata.",
  },
  {
    q: "Cuales son las tasas y comisiones?",
    a: "Se cobra una comision por apertura del 10% sobre el monto solicitado, la cual se descuenta al momento del desembolso. Las tasas son: $175 por semana por cada $1,000 en plazo de 8 semanas, o $120 por semana por cada $1,000 en plazo de 13 semanas.",
  },
  {
    q: "Que pasa si me atraso en un pago?",
    a: "Se genera una multa de $200 por cada dia de atraso. Es importante mantener tus pagos al corriente para evitar recargos y conservar un buen historial crediticio.",
  },
  {
    q: "Puedo liquidar mi credito antes de tiempo?",
    a: "Si, puedes liquidar anticipadamente sin penalizacion. Contacta a tu asesor para calcular el monto de liquidacion.",
  },
  {
    q: "Que es el aval (obligado solidario)?",
    a: "Es una persona que se compromete a responder por el credito en caso de incumplimiento. Es requisito obligatorio para todos los creditos. El aval debe proporcionar su INE y datos de contacto.",
  },
  {
    q: "Cuanto puedo solicitar?",
    a: "Los montos van desde $1,000 hasta $30,000 pesos. El monto aprobado depende de tu capacidad de pago y evaluacion crediticia.",
  },
];

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 400);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center splash-bg ${exiting ? "splash-out" : ""}`}
      style={{ background: "linear-gradient(160deg,#040e21 0%,#0f1f3d 40%,#1e3a7b 80%,#2563eb 100%)" }}
    >
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl text-white splash-logo"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
      >
        <RiShieldCheckLine />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mt-5 splash-title">
        HapiCredit
      </h1>
      <p className="text-white/40 text-sm mt-2 splash-sub">Grupo CAFJA</p>
      <p className="text-white/30 text-xs mt-1 splash-sub">Creditos rapidos y transparentes</p>
      <div className="mt-8 flex gap-1.5 splash-loader">
        <div className="w-2 h-2 rounded-full bg-white/60" style={{ animationDelay: "0s" }} />
        <div className="w-2 h-2 rounded-full bg-white/60" style={{ animationDelay: "0.15s" }} />
        <div className="w-2 h-2 rounded-full bg-white/60" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left pressable"
      >
        <span className="text-sm font-semibold text-gray-800 pr-4">{q}</span>
        <RiArrowDownSLine
          className="text-lg text-gray-400 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [splashSeen] = useState(() => sessionStorage.getItem("hapi_splash") === "1");

  useEffect(() => {
    if (splashSeen) {
      setShowSplash(false);
    }
  }, [splashSeen]);

  function handleSplashDone() {
    setShowSplash(false);
    sessionStorage.setItem("hapi_splash", "1");
  }

  return (
    <>
      {showSplash && !splashSeen && <SplashScreen onDone={handleSplashDone} />}
      <Layout>
        <div className="flex flex-col gap-0">

          {/* Hero */}
          <div
            className="px-6 pt-8 pb-10 text-center anim-section anim-d1"
            style={{ background: "linear-gradient(160deg,#0f1e3d 0%,#1e3a7b 60%,#2563eb 100%)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl text-white"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <RiShieldCheckLine />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">HapiCredit</h1>
            <p className="text-white/40 text-xs font-medium tracking-wide">GRUPO CAFJA</p>
            <p className="text-white/70 text-sm max-w-xs mx-auto leading-relaxed mt-3">
              Creditos rapidos y transparentes para hacer crecer tu negocio
            </p>
            <Link href="/solicitar">
              <button
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold pressable mt-5 float-cta"
                style={{ background: "#fff", color: "var(--navy-900)" }}
              >
                Solicitar credito <RiArrowRightLine />
              </button>
            </Link>
          </div>

          {/* Demo Role Selector */}
          <div className="px-4 -mt-4 relative z-10 anim-section anim-d2">
            <div
              className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg,#f0f4ff,#e8f0fe)", border: "1px solid rgba(37,99,235,0.12)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white">
                  Demo
                </div>
                <span className="text-xs font-semibold text-gray-700">Explora cada rol</span>
              </div>
              <div className="flex flex-col gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.key}
                    onClick={() => navigate(role.href)}
                    className="flex items-center gap-3 bg-white rounded-xl px-3 py-3 text-left pressable"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white shrink-0"
                      style={{ background: role.gradient }}
                    >
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">{role.label}</div>
                      <div className="text-[11px] text-gray-500 leading-tight">{role.desc}</div>
                    </div>
                    <RiArrowRightLine className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quienes somos */}
          <div className="px-4 pt-8 pb-2 anim-section anim-d3">
            <div className="text-center mb-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Quienes somos</div>
              <h2 className="text-xl font-extrabold text-gray-900">HapiCredit por Grupo CAFJA</h2>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Somos una empresa financiera especializada en <strong>microcreditos</strong> para emprendedores y comerciantes. Nuestra mision es impulsar el crecimiento de negocios locales a traves de creditos accesibles, transparentes y con atencion personalizada.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ background: "#f0f7ff" }}>
                  <RiTeamLine className="text-2xl mx-auto mb-1" style={{ color: "var(--accent)" }} />
                  <div className="text-xs font-bold text-gray-800">Atencion personal</div>
                  <div className="text-[10px] text-gray-500">Asesor asignado</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
                  <RiShieldCheckLine className="text-2xl mx-auto mb-1 text-green-600" />
                  <div className="text-xs font-bold text-gray-800">Transparencia</div>
                  <div className="text-[10px] text-gray-500">Sin letras chicas</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: "#fefce8" }}>
                  <RiTimeLine className="text-2xl mx-auto mb-1 text-yellow-600" />
                  <div className="text-xs font-bold text-gray-800">Rapido</div>
                  <div className="text-[10px] text-gray-500">Aprobacion en 24h</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: "#faf5ff" }}>
                  <RiLineChartLine className="text-2xl mx-auto mb-1 text-purple-600" />
                  <div className="text-xs font-bold text-gray-800">Crecimiento</div>
                  <div className="text-[10px] text-gray-500">Impulsa tu negocio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Proceso de credito */}
          <div className="px-4 pt-6 pb-2 anim-section anim-d4">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Proceso</div>
              <h2 className="text-lg font-extrabold text-gray-900">Como funciona</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {PROCESS_STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-gray-100"
                  style={{ boxShadow: "0 1px 6px rgba(15,31,61,0.04)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg text-white font-bold shrink-0"
                    style={{ background: "var(--accent)" }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Condiciones */}
          <div className="px-4 pt-6 pb-2 anim-section anim-d5">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Condiciones</div>
              <h2 className="text-lg font-extrabold text-gray-900">Nuestros creditos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>$1,000</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Monto minimo</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>$30,000</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Monto maximo</div>
              </div>
            </div>
            <div className="mt-3 card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Opciones de plazo</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f0f7ff" }}>
                  <div>
                    <div className="text-sm font-bold text-gray-900">8 semanas</div>
                    <div className="text-xs text-gray-500">Plazo corto</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>$175</div>
                    <div className="text-[10px] text-gray-400">por semana / $1,000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
                  <div>
                    <div className="text-sm font-bold text-gray-900">13 semanas</div>
                    <div className="text-xs text-gray-500">Plazo extendido</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-green-600">$120</div>
                    <div className="text-[10px] text-gray-400">por semana / $1,000</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-gray-50 text-xs text-gray-500 leading-relaxed">
                <strong>Comision por apertura:</strong> 10% sobre el monto solicitado, descontada al momento del desembolso. Ejemplo: solicitas $5,000, recibes $4,500.
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="px-4 pt-6 pb-2 anim-section anim-d6">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Ayuda</div>
              <h2 className="text-lg font-extrabold text-gray-900">Preguntas frecuentes</h2>
            </div>
            <div className="flex flex-col gap-2">
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>

          {/* Instalar PWA */}
          <div className="px-4 pt-6 pb-2 anim-section anim-d7">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Instalar</div>
              <h2 className="text-lg font-extrabold text-gray-900">Usa HapiCredit como app</h2>
            </div>
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white shrink-0" style={{ background: "var(--accent)" }}>
                  <RiSmartphoneLine />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Instala la app en tu celular</div>
                  <div className="text-xs text-gray-500 mt-0.5">Sin descargar desde la tienda. Directo desde tu navegador.</div>
                </div>
              </div>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">iPhone (Safari)</div>
              <ol className="text-xs text-gray-600 leading-relaxed mb-4 list-decimal pl-4 flex flex-col gap-1">
                <li>Abre esta pagina en <strong>Safari</strong></li>
                <li>Toca el boton de <strong>Compartir</strong> (cuadro con flecha hacia arriba)</li>
                <li>Desliza hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
                <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha</li>
              </ol>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Android (Chrome)</div>
              <ol className="text-xs text-gray-600 leading-relaxed list-decimal pl-4 flex flex-col gap-1">
                <li>Abre esta pagina en <strong>Chrome</strong></li>
                <li>Toca el menu de <strong>tres puntos</strong> (esquina superior derecha)</li>
                <li>Selecciona <strong>"Instalar aplicacion"</strong> o <strong>"Agregar a pantalla de inicio"</strong></li>
                <li>Confirma tocando <strong>"Instalar"</strong></li>
              </ol>
            </div>
          </div>

          {/* Terminos */}
          <div className="px-4 pt-6 pb-2 anim-section anim-d8">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Legal</div>
              <h2 className="text-lg font-extrabold text-gray-900">Terminos y condiciones</h2>
            </div>
            <div className="card text-xs text-gray-600 leading-relaxed flex flex-col gap-3">
              <p>
                <strong>1. Naturaleza del servicio.</strong> HapiCredit, operado por Grupo CAFJA, ofrece servicios de microcredito con pagos semanales. Los creditos estan sujetos a aprobacion basada en la evaluacion de capacidad de pago del solicitante.
              </p>
              <p>
                <strong>2. Requisitos.</strong> El solicitante debe ser mayor de edad, presentar identificacion oficial vigente (INE), comprobante de domicilio, y contar con un aval (obligado solidario) que acepte las condiciones del credito.
              </p>
              <p>
                <strong>3. Tasas y comisiones.</strong> Se aplica una comision por apertura del 10% sobre el monto solicitado. Las tasas de interes varian segun el plazo elegido: $175/semana por cada $1,000 a 8 semanas, o $120/semana por cada $1,000 a 13 semanas.
              </p>
              <p>
                <strong>4. Pagos y mora.</strong> Los pagos son semanales en el dia acordado. El atraso en un pago genera una multa de $200 pesos por cada dia de retraso. El incumplimiento reiterado puede derivar en la clasificacion del credito como "cartera vencida".
              </p>
              <p>
                <strong>5. Obligado solidario (aval).</strong> El aval acepta responder solidariamente por el credito en caso de incumplimiento del titular. Podra ser contactado para gestiones de cobranza.
              </p>
              <p>
                <strong>6. Liquidacion anticipada.</strong> El cliente puede liquidar su credito antes del vencimiento sin penalizacion adicional, cubriendo unicamente el saldo pendiente.
              </p>
              <p>
                <strong>7. Privacidad.</strong> Los datos personales proporcionados seran tratados conforme a la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares y seran utilizados exclusivamente para la evaluacion y administracion del credito.
              </p>
              <p>
                <strong>8. Modificaciones.</strong> Grupo CAFJA se reserva el derecho de modificar las presentes condiciones previo aviso al cliente.
              </p>
            </div>
          </div>

          {/* Contacto */}
          <div className="px-4 pt-6 pb-4">
            <div className="card text-center">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contacto</div>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex items-center justify-center gap-2">
                  <RiPhoneLine className="text-blue-500" />
                  <span>Contacta a tu asesor asignado</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <RiMapPinLine className="text-blue-500" />
                  <span>Cobertura en tu localidad</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-6">
            <Link href="/solicitar">
              <button
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}
              >
                Solicitar mi credito ahora <RiArrowRightLine />
              </button>
            </Link>
          </div>

          {/* Footer */}
          <div className="text-center pb-8 flex flex-col gap-1">
            <div className="text-xs text-gray-400 font-semibold">Grupo CAFJA</div>
            <div className="text-[10px] text-gray-300">HapiCredit v1.0</div>
            <div className="flex justify-center gap-4 mt-2">
              <Link href="/terminos" className="text-[10px] text-blue-500 font-medium">Terminos</Link>
              <Link href="/faq" className="text-[10px] text-blue-500 font-medium">FAQ</Link>
              <Link href="/instalar" className="text-[10px] text-blue-500 font-medium">Instalar app</Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
