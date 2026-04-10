import { useLocation } from "wouter";

function Header() {
  const [, navigate] = useLocation();
  return (
    <header style={{
      background: "#1e2d4f", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>
          Hapi<span style={{ color: "#f87171" }}>Credit</span>
        </span>
      </div>
      <button
        onClick={() => navigate("/login")}
        style={{
          background: "rgba(255,255,255,0.12)", color: "white",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
          padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        Iniciar sesion
      </button>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: { marginBottom: 36 },
  h2: { fontSize: 17, fontWeight: 800, color: "#1e2d4f", marginBottom: 10 },
  p:  { fontSize: 14, lineHeight: 1.75, color: "#4b5563", marginBottom: 10 },
  li: { fontSize: 14, lineHeight: 1.75, color: "#4b5563", marginBottom: 6, paddingLeft: 6 },
  ul: { paddingLeft: 20, marginBottom: 10 },
};

export default function Privacidad() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Header />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px" }}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #1e2d4f, #2d4080)",
          borderRadius: 20, padding: "32px 28px", marginBottom: 36, color: "white",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Documento legal
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
            Aviso de Privacidad
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.65 }}>
            Ultima actualizacion: 10 de abril de 2026
          </p>
        </div>

        {/* Responsable */}
        <div style={s.section}>
          <h2 style={s.h2}>1. Responsable del tratamiento de sus datos personales</h2>
          <p style={s.p}>
            <strong>Grupo CAFJA S.A. de C.V.</strong> (en adelante "HapiCredit"), con domicilio en
            Mexico, es responsable del tratamiento de sus datos personales, conforme a lo establecido
            en la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares
            (LFPDPPP) y su Reglamento.
          </p>
          <p style={s.p}>
            Contacto del responsable:{" "}
            <strong>privacidad@hapicredit.live</strong>
          </p>
        </div>

        {/* Datos recabados */}
        <div style={s.section}>
          <h2 style={s.h2}>2. Datos personales que recabamos</h2>
          <p style={s.p}>Para la prestacion de nuestros servicios recabamos los siguientes datos:</p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Identificacion:</strong> Nombre completo, CURP, RFC, fecha de nacimiento.</li>
            <li style={s.li}><strong>Contacto:</strong> Correo electronico, numero de telefono, domicilio.</li>
            <li style={s.li}><strong>Financieros:</strong> Historial crediticio, ingresos mensuales, datos bancarios.</li>
            <li style={s.li}><strong>Laborales:</strong> Ocupacion y lugar de trabajo (cuando aplique).</li>
            <li style={s.li}><strong>Tecnicos:</strong> Direccion IP, tipo de dispositivo, cookies de sesion.</li>
          </ul>
          <p style={s.p}>
            No recabamos datos sensibles salvo que sea estrictamente necesario y contemos con su
            consentimiento expreso.
          </p>
        </div>

        {/* Finalidades */}
        <div style={s.section}>
          <h2 style={s.h2}>3. Finalidades del tratamiento</h2>
          <p style={s.p}><strong>Finalidades primarias (necesarias para el servicio):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Evaluacion, otorgamiento y administracion de creditos.</li>
            <li style={s.li}>Gestion de pagos, cobranza y seguimiento de cartera.</li>
            <li style={s.li}>Identificacion y autenticacion de usuarios en la plataforma.</li>
            <li style={s.li}>Cumplimiento de obligaciones legales y regulatorias.</li>
          </ul>
          <p style={s.p}><strong>Finalidades secundarias (opcionales):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Envio de comunicaciones comerciales y promociones de HapiCredit.</li>
            <li style={s.li}>Estudios de mercado y mejora de productos financieros.</li>
          </ul>
          <p style={s.p}>
            Si no desea que sus datos sean tratados para finalidades secundarias, puede manifestarlo
            a <strong>privacidad@hapicredit.live</strong> en cualquier momento.
          </p>
        </div>

        {/* Transferencias */}
        <div style={s.section}>
          <h2 style={s.h2}>4. Transferencia de datos personales</h2>
          <p style={s.p}>
            Sus datos podran ser transferidos a terceros sin requerir su consentimiento en los
            siguientes casos, conforme al Articulo 37 de la LFPDPPP:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>Autoridades competentes en cumplimiento de obligaciones legales.</li>
            <li style={s.li}>Empresas del mismo grupo corporativo bajo los mismos terminos de este Aviso.</li>
            <li style={s.li}>Buro de Credito u otras sociedades de informacion crediticia.</li>
          </ul>
        </div>

        {/* Derechos ARCO */}
        <div style={s.section}>
          <h2 style={s.h2}>5. Derechos ARCO</h2>
          <p style={s.p}>
            Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse (ARCO)</strong> al
            tratamiento de sus datos personales. Para ejercer estos derechos, envie su solicitud a:
          </p>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
            padding: "16px 20px", marginBottom: 12,
          }}>
            <p style={{ ...s.p, margin: 0 }}>
              <strong>Correo:</strong> privacidad@hapicredit.live<br />
              <strong>Asunto:</strong> Ejercicio de Derechos ARCO<br />
              <strong>Tiempo de respuesta:</strong> 20 dias habiles a partir de la recepcion
            </p>
          </div>
          <p style={s.p}>
            Debera incluir: nombre completo, domicilio, copia de identificacion oficial y
            descripcion clara del derecho que desea ejercer.
          </p>
        </div>

        {/* Cookies */}
        <div style={s.section}>
          <h2 style={s.h2}>6. Uso de cookies y tecnologias de rastreo</h2>
          <p style={s.p}>
            HapiCredit utiliza cookies de sesion esenciales para el funcionamiento de la plataforma.
            No utilizamos cookies de rastreo publicitario de terceros. Puede configurar su navegador
            para rechazar cookies, pero esto puede afectar la funcionalidad del servicio.
          </p>
        </div>

        {/* Cambios */}
        <div style={s.section}>
          <h2 style={s.h2}>7. Cambios al aviso de privacidad</h2>
          <p style={s.p}>
            Cualquier modificacion a este Aviso de Privacidad sera notificada a traves de la
            plataforma <strong>hapicredit.live</strong>. Le recomendamos revisarlo periodicamente.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Grupo CAFJA S.A. de C.V. — HapiCredit — hapicredit.live
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Este aviso cumple con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares.
          </p>
        </div>
      </div>
    </div>
  );
}
