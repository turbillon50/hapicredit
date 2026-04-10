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

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fefce8", border: "1px solid #fde68a",
      borderRadius: 12, padding: "14px 18px", marginBottom: 14,
    }}>
      <p style={{ ...s.p, margin: 0, color: "#92400e" }}>{children}</p>
    </div>
  );
}

export default function Terminos() {
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
            Terminos y Condiciones
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.65 }}>
            Ultima actualizacion: 10 de abril de 2026
          </p>
        </div>

        {/* Intro */}
        <div style={s.section}>
          <h2 style={s.h2}>1. Aceptacion de los terminos</h2>
          <p style={s.p}>
            Al registrarse y utilizar la plataforma <strong>HapiCredit</strong> (operada por
            <strong> Grupo CAFJA S.A. de C.V.</strong>), usted acepta expresamente los presentes
            Terminos y Condiciones. Si no esta de acuerdo con alguno de ellos, debe abstenerse
            de utilizar el servicio.
          </p>
        </div>

        {/* Descripcion del servicio */}
        <div style={s.section}>
          <h2 style={s.h2}>2. Descripcion del servicio</h2>
          <p style={s.p}>
            HapiCredit es una plataforma de gestion de creditos personales y cartera que opera
            exclusivamente dentro del territorio mexicano. El acceso a la plataforma es por
            invitacion mediante codigo unico proporcionado por un Asesor autorizado.
          </p>
        </div>

        {/* Condiciones del credito */}
        <div style={s.section}>
          <h2 style={s.h2}>3. Condiciones del credito</h2>
          <p style={s.p}>Los creditos otorgados a traves de HapiCredit se rigen bajo las siguientes reglas:</p>

          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 12, padding: "18px 20px", marginBottom: 16,
          }}>
            <p style={{ ...s.p, color: "#166534", fontWeight: 700, marginBottom: 8 }}>Plazos disponibles</p>
            <ul style={s.ul}>
              <li style={{ ...s.li, color: "#166534" }}>
                <strong>8 semanas:</strong> pago semanal de $175 MXN — comision del Asesor: 10%
              </li>
              <li style={{ ...s.li, color: "#166534" }}>
                <strong>13 semanas:</strong> pago semanal de $120 MXN — comision del Asesor: 10%
              </li>
            </ul>
          </div>

          <Nota>
            <strong>Cargo por pago tardio:</strong> Se aplicara un cargo de $200 MXN por cada dia
            de retraso en el pago semanal correspondiente.
          </Nota>

          <ul style={s.ul}>
            <li style={s.li}>Todo credito requiere un <strong>Aval obligatorio</strong> al momento de la solicitud.</li>
            <li style={s.li}>El credito se otorga sujeto a evaluacion y aprobacion del Asesor y Administrador asignado.</li>
            <li style={s.li}>Los pagos deben realizarse en la fecha y forma acordadas con su Asesor.</li>
          </ul>
        </div>

        {/* Roles y responsabilidades */}
        <div style={s.section}>
          <h2 style={s.h2}>4. Roles y responsabilidades</h2>

          <p style={s.p}><strong>Acreditado (cliente):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Proporcionar informacion veraz y actualizada al momento del registro.</li>
            <li style={s.li}>Cumplir con el calendario de pagos establecido.</li>
            <li style={s.li}>Notificar a su Asesor cualquier cambio en su situacion que afecte su capacidad de pago.</li>
          </ul>

          <p style={s.p}><strong>Asesor (ejecutivo de credito):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Validar la identidad y solvencia del Acreditado antes de tramitar el credito.</li>
            <li style={s.li}>Gestionar la cobranza semanal de manera puntual y profesional.</li>
            <li style={s.li}>No compartir codigos de invitacion con personas no autorizadas.</li>
          </ul>

          <p style={s.p}><strong>Administrador:</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Supervisar la cartera, aprobar creditos y gestionar la plataforma.</li>
            <li style={s.li}>Garantizar el cumplimiento de las politicas internas de HapiCredit.</li>
          </ul>
        </div>

        {/* Uso de la plataforma */}
        <div style={s.section}>
          <h2 style={s.h2}>5. Uso permitido de la plataforma</h2>
          <p style={s.p}>El usuario se compromete a:</p>
          <ul style={s.ul}>
            <li style={s.li}>No compartir sus credenciales de acceso con terceros.</li>
            <li style={s.li}>No intentar acceder a cuentas o informacion de otros usuarios.</li>
            <li style={s.li}>No utilizar la plataforma para actividades fraudulentas o ilegales.</li>
            <li style={s.li}>Mantener la confidencialidad de los codigos de invitacion.</li>
          </ul>
          <p style={s.p}>
            El incumplimiento de estas condiciones puede resultar en la suspension inmediata
            de la cuenta y acciones legales correspondientes.
          </p>
        </div>

        {/* Comisiones */}
        <div style={s.section}>
          <h2 style={s.h2}>6. Comisiones de Asesores</h2>
          <p style={s.p}>
            Los Asesores tienen derecho a una comision del <strong>10%</strong> sobre el monto
            total de cada credito activo en su cartera. Las comisiones son calculadas y registradas
            automaticamente por la plataforma al momento del cobro semanal.
          </p>
          <p style={s.p}>
            HapiCredit se reserva el derecho de auditar las comisiones y retener pagos en caso
            de irregularidades detectadas.
          </p>
        </div>

        {/* Privacidad */}
        <div style={s.section}>
          <h2 style={s.h2}>7. Privacidad y proteccion de datos</h2>
          <p style={s.p}>
            El tratamiento de sus datos personales se rige por nuestro{" "}
            <a href="/privacidad" style={{ color: "#1d4ed8", fontWeight: 600 }}>
              Aviso de Privacidad
            </a>
            , el cual forma parte integral de estos Terminos y Condiciones.
          </p>
        </div>

        {/* Modificaciones */}
        <div style={s.section}>
          <h2 style={s.h2}>8. Modificaciones a los terminos</h2>
          <p style={s.p}>
            HapiCredit se reserva el derecho de modificar estos Terminos y Condiciones en cualquier
            momento. Los cambios se notificaran a traves de la plataforma. El uso continuo del
            servicio constituye la aceptacion de los nuevos terminos.
          </p>
        </div>

        {/* Jurisdiccion */}
        <div style={s.section}>
          <h2 style={s.h2}>9. Jurisdiccion y legislacion aplicable</h2>
          <p style={s.p}>
            Estos Terminos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
            controversia derivada de su interpretacion o ejecucion sera resuelta ante los
            tribunales competentes de la Republica Mexicana, renunciando expresamente a cualquier
            otro fuero que pudiera corresponder.
          </p>
        </div>

        {/* Contacto */}
        <div style={s.section}>
          <h2 style={s.h2}>10. Contacto</h2>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <p style={{ ...s.p, margin: 0 }}>
              <strong>Grupo CAFJA S.A. de C.V. — HapiCredit</strong><br />
              Correo: <strong>legal@hapicredit.live</strong><br />
              Sitio: <strong>hapicredit.live</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Grupo CAFJA S.A. de C.V. — HapiCredit — hapicredit.live
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Al utilizar HapiCredit, usted confirma haber leido y aceptado los presentes Terminos y Condiciones.
          </p>
        </div>
      </div>
    </div>
  );
}
