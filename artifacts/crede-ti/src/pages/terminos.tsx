import { useLocation } from "wouter";

function Header() {
  const [, navigate] = useLocation();
  return (
    <header style={{
      background: "#2A3CD6", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>
          Crede<span style={{ color: "#F0A93A" }}>-Ti</span>
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
  h2: { fontSize: 17, fontWeight: 800, color: "#2A3CD6", marginBottom: 10 },
  p:  { fontSize: 14, lineHeight: 1.75, color: "#4b5563", marginBottom: 10 },
  li: { fontSize: 14, lineHeight: 1.75, color: "#4b5563", marginBottom: 6, paddingLeft: 6 },
  ul: { paddingLeft: 20, marginBottom: 10 },
};

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca",
      borderRadius: 12, padding: "14px 18px", marginBottom: 14,
    }}>
      <p style={{ ...s.p, margin: 0, color: "#991b1b" }}>{children}</p>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#eff6ff", border: "1px solid #bfdbfe",
      borderRadius: 12, padding: "16px 20px", marginBottom: 14,
    }}>
      <p style={{ ...s.p, margin: 0 }}>{children}</p>
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
          background: "linear-gradient(135deg, #2A3CD6, #3F51E6)",
          borderRadius: 20, padding: "32px 28px", marginBottom: 36, color: "white",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Documento legal
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
            Terminos y Condiciones
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.65 }}>
            Ultima actualizacion: 17 de abril de 2026
          </p>
        </div>

        {/* 1. Aceptacion */}
        <div style={s.section}>
          <h2 style={s.h2}>1. Aceptacion de los terminos</h2>
          <p style={s.p}>
            Al solicitar un credito con <strong>Crede-Ti</strong>, el cliente acepta
            expresamente los presentes Terminos y Condiciones. Si no esta de acuerdo con
            alguno de ellos, debe abstenerse de utilizar el servicio.
          </p>
        </div>

        {/* 2. Descripcion */}
        <div style={s.section}>
          <h2 style={s.h2}>2. Descripcion del servicio</h2>
          <p style={s.p}>
            Crede-Ti es una plataforma de gestion de microcreditos personales que opera
            dentro del territorio mexicano. El credito es <strong>personal</strong> y debe
            ser pagado en los tiempos establecidos (semanal o quincenal segun contrato).
          </p>
        </div>

        {/* 3. Condiciones del credito */}
        <div style={s.section}>
          <h2 style={s.h2}>3. Condiciones del credito</h2>
          <p style={s.p}>Los creditos otorgados a traves de Crede-Ti se rigen bajo las siguientes reglas:</p>

          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 12, padding: "18px 20px", marginBottom: 16,
          }}>
            <p style={{ ...s.p, color: "#166534", fontWeight: 700, marginBottom: 8 }}>Cliente nuevo (primera apertura)</p>
            <ul style={s.ul}>
              <li style={{ ...s.li, color: "#166534" }}>Monto: <strong>$500 a $1,000 MXN</strong></li>
              <li style={{ ...s.li, color: "#166534" }}>Plazo: <strong>4 semanas (30 dias)</strong></li>
              <li style={{ ...s.li, color: "#166534" }}>Interes: <strong>30% fijo</strong> sobre el monto</li>
            </ul>
          </div>

          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 12, padding: "18px 20px", marginBottom: 16,
          }}>
            <p style={{ ...s.p, color: "#1e40af", fontWeight: 700, marginBottom: 8 }}>Cliente recurrente</p>
            <ul style={s.ul}>
              <li style={{ ...s.li, color: "#1e40af" }}>Monto: <strong>$1,000 a $30,000 MXN</strong></li>
              <li style={{ ...s.li, color: "#1e40af" }}>Plazo: <strong>4 a 48 semanas</strong></li>
              <li style={{ ...s.li, color: "#1e40af" }}>Interes: <strong>60% anual</strong> (calculado proporcional al plazo)</li>
              <li style={{ ...s.li, color: "#1e40af" }}>Frecuencia de pago: <strong>semanal o quincenal</strong>, con dia de pago a eleccion (lunes a domingo)</li>
            </ul>
          </div>

          <Nota>
            <strong>Cargo por pago tardio:</strong> Se aplicara una multa equivalente al <strong>10% del pago atrasado</strong>.
            Ejemplo: si el pago era de $300, la multa es de $30. El horario limite de pago es a las
            <strong> 5:00 PM del dia acordado</strong>. Crede-Ti <strong>no cobra comision por apertura</strong>.
          </Nota>

          <ul style={s.ul}>
            <li style={s.li}>El credito se otorga sujeto a evaluacion y aprobacion del Asesor y Administrador asignado.</li>
            <li style={s.li}>Los pagos deben realizarse en la fecha y forma acordadas con su Asesor.</li>
            <li style={s.li}>Crede-Ti podra realizar <strong>validaciones de informacion y visitas domiciliarias</strong>.</li>
            <li style={s.li}>En caso de incumplimiento, se podran tomar acciones de cobranza correspondientes.</li>
          </ul>
        </div>

        {/* 4. Informacion del cliente */}
        <div style={s.section}>
          <h2 style={s.h2}>4. Informacion requerida al cliente</h2>
          <p style={s.p}>
            El cliente se compromete a proporcionar informacion <strong>veridica y comprobable</strong>.
            Los datos solicitados incluyen:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>Nombre completo, INE, CURP</li>
            <li style={s.li}>Domicilio, telefono y referencias personales</li>
            <li style={s.li}>Documentos: INE (frente y reverso), selfie con INE, comprobante de domicilio</li>
          </ul>
          <p style={s.p}>
            El cliente autoriza el uso de su informacion para fines de validacion,
            seguimiento y cobranza. Al continuar con el proceso, el cliente confirma
            que ha leido y acepta estos terminos.
          </p>
        </div>

        {/* 5. Roles */}
        <div style={s.section}>
          <h2 style={s.h2}>5. Roles y responsabilidades</h2>

          <p style={s.p}><strong>Acreditado (cliente):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Proporcionar informacion veraz y actualizada.</li>
            <li style={s.li}>Cumplir con el calendario de pagos establecido.</li>
            <li style={s.li}>Notificar a su Asesor cualquier cambio que afecte su capacidad de pago.</li>
          </ul>

          <p style={s.p}><strong>Asesor (ejecutivo de credito):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Validar la identidad y solvencia del Acreditado.</li>
            <li style={s.li}>Gestionar la cobranza semanal de manera puntual y profesional.</li>
            <li style={s.li}>No compartir codigos de invitacion con personas no autorizadas.</li>
          </ul>

          <p style={s.p}><strong>Administrador:</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Supervisar la cartera, aprobar creditos y gestionar la plataforma.</li>
            <li style={s.li}>Garantizar el cumplimiento de las politicas internas de Crede-Ti.</li>
          </ul>
        </div>

        {/* 6. Uso permitido */}
        <div style={s.section}>
          <h2 style={s.h2}>6. Uso permitido de la plataforma</h2>
          <p style={s.p}>El usuario se compromete a:</p>
          <ul style={s.ul}>
            <li style={s.li}>No compartir sus credenciales de acceso con terceros.</li>
            <li style={s.li}>No intentar acceder a cuentas o informacion de otros usuarios.</li>
            <li style={s.li}>No utilizar la plataforma para actividades fraudulentas o ilegales.</li>
            <li style={s.li}>Mantener la confidencialidad de los codigos de invitacion.</li>
          </ul>
          <p style={s.p}>
            El incumplimiento puede resultar en la suspension inmediata de la cuenta
            y acciones legales correspondientes.
          </p>
        </div>

        {/* 7. Privacidad */}
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

        {/* 8. Modificaciones */}
        <div style={s.section}>
          <h2 style={s.h2}>8. Modificaciones a los terminos</h2>
          <p style={s.p}>
            Crede-Ti se reserva el derecho de modificar estos Terminos en cualquier
            momento. Los cambios se notificaran a traves de la plataforma.
          </p>
        </div>

        {/* 9. Jurisdiccion */}
        <div style={s.section}>
          <h2 style={s.h2}>9. Jurisdiccion y legislacion aplicable</h2>
          <p style={s.p}>
            Estos Terminos se rigen por las leyes de los Estados Unidos Mexicanos.
            Cualquier controversia sera resuelta ante los tribunales competentes de
            Toluca, Estado de Mexico.
          </p>
        </div>

        {/* 10. Contacto */}
        <div style={s.section}>
          <h2 style={s.h2}>10. Contacto</h2>
          <InfoBox>
            <strong>Crede-Ti</strong><br />
            Ignacio Lopez Rayon Sur 702, Despacho 104<br />
            Col. Cuauhtemoc, Toluca, Estado de Mexico<br />
            (A un costado de la Secretaria del Trabajo)<br /><br />
            Correo: <strong>hola@crede-ti.info</strong><br />
            Tel: <strong>55 7796 0663</strong> / <strong>56 5265 7122</strong>
          </InfoBox>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Crede-Ti — crede-ti.info
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Al utilizar Crede-Ti, usted confirma haber leido y aceptado estos Terminos y Condiciones.
          </p>
        </div>
      </div>
    </div>
  );
}
