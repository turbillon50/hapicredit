import { useLocation } from "wouter";

function Header() {
  const [, navigate] = useLocation();
  return (
    <header style={{
      background: "#215DFF", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="52" r="16" fill="white"/>
          <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
        </svg>
        <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>
          crede<span style={{ color: "#19D7D7" }}>ti</span>
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
        Iniciar sesión
      </button>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: { marginBottom: 36 },
  h2: { fontSize: 17, fontWeight: 800, color: "#215DFF", marginBottom: 10 },
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
          background: "linear-gradient(135deg, #3A00C8, #215DFF)",
          borderRadius: 20, padding: "32px 28px", marginBottom: 36, color: "white",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Documento legal
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
            Términos y Condiciones
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.65 }}>
            Última actualización: 17 de abril de 2026
          </p>
        </div>

        {/* 1. Aceptación */}
        <div style={s.section}>
          <h2 style={s.h2}>1. Aceptación de los términos</h2>
          <p style={s.p}>
            Al solicitar un crédito con <strong>credeti</strong>, el cliente acepta
            expresamente los presentes Términos y Condiciones. Si no está de acuerdo con
            alguno de ellos, debe abstenerse de utilizar el servicio.
          </p>
        </div>

        {/* 2. Descripción */}
        <div style={s.section}>
          <h2 style={s.h2}>2. Descripción del servicio</h2>
          <p style={s.p}>
            credeti es una plataforma de gestión de microcréditos personales que opera
            dentro del territorio mexicano. El crédito es <strong>personal</strong> y debe
            ser pagado en los tiempos establecidos (semanal o quincenal según contrato).
          </p>
        </div>

        {/* 3. Condiciones del crédito */}
        <div style={s.section}>
          <h2 style={s.h2}>3. Condiciones del crédito</h2>
          <p style={s.p}>Los créditos otorgados a través de credeti se rigen bajo las siguientes reglas:</p>

          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 12, padding: "18px 20px", marginBottom: 16,
          }}>
            <p style={{ ...s.p, color: "#166534", fontWeight: 700, marginBottom: 8 }}>Cliente nuevo (primera apertura)</p>
            <ul style={s.ul}>
              <li style={{ ...s.li, color: "#166534" }}>Monto: <strong>$500 a $1,000 MXN</strong></li>
              <li style={{ ...s.li, color: "#166534" }}>Plazo: <strong>4 semanas (30 días)</strong></li>
              <li style={{ ...s.li, color: "#166534" }}>Interés: <strong>30% fijo</strong> sobre el monto</li>
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
              <li style={{ ...s.li, color: "#1e40af" }}>Interés: <strong>5% mensual</strong> (calculado proporcional al plazo)</li>
              <li style={{ ...s.li, color: "#1e40af" }}>Frecuencia de pago: <strong>semanal o quincenal</strong>, con día de pago a elección (lunes a domingo)</li>
            </ul>
          </div>

          <Nota>
            <strong>Cargo por pago tardío:</strong> Se aplicará una multa equivalente al <strong>10% del pago atrasado</strong>.
            Ejemplo: si el pago era de $300, la multa es de $30. El horario límite de pago es a las
            <strong> 5:00 PM del día acordado</strong>. credeti <strong>no cobra comisión por apertura</strong>.
          </Nota>

          <ul style={s.ul}>
            <li style={s.li}>El crédito se otorga sujeto a evaluación y aprobación del Asesor y Administrador asignado.</li>
            <li style={s.li}>Los pagos deben realizarse en la fecha y forma acordadas con su Asesor.</li>
            <li style={s.li}>credeti podrá realizar <strong>validaciones de información y visitas domiciliarias</strong>.</li>
            <li style={s.li}>En caso de incumplimiento, se podrán tomar acciones de cobranza correspondientes.</li>
          </ul>
        </div>

        {/* 4. Información del cliente */}
        <div style={s.section}>
          <h2 style={s.h2}>4. Información requerida al cliente</h2>
          <p style={s.p}>
            El cliente se compromete a proporcionar información <strong>verídica y comprobable</strong>.
            Los datos solicitados incluyen:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>Nombre completo, INE, CURP</li>
            <li style={s.li}>Domicilio, teléfono y referencias personales</li>
            <li style={s.li}>Documentos: INE (frente y reverso), selfie con INE, comprobante de domicilio</li>
          </ul>
          <p style={s.p}>
            El cliente autoriza el uso de su información para fines de validación,
            seguimiento y cobranza. Al continuar con el proceso, el cliente confirma
            que ha leído y acepta estos términos.
          </p>
        </div>

        {/* 5. Roles */}
        <div style={s.section}>
          <h2 style={s.h2}>5. Roles y responsabilidades</h2>

          <p style={s.p}><strong>Acreditado (cliente):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Proporcionar información veraz y actualizada.</li>
            <li style={s.li}>Cumplir con el calendario de pagos establecido.</li>
            <li style={s.li}>Notificar a su Asesor cualquier cambio que afecte su capacidad de pago.</li>
          </ul>

          <p style={s.p}><strong>Asesor (ejecutivo de crédito):</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Validar la identidad y solvencia del Acreditado.</li>
            <li style={s.li}>Gestionar la cobranza semanal de manera puntual y profesional.</li>
            <li style={s.li}>No compartir códigos de invitación con personas no autorizadas.</li>
          </ul>

          <p style={s.p}><strong>Administrador:</strong></p>
          <ul style={s.ul}>
            <li style={s.li}>Supervisar la cartera, aprobar créditos y gestionar la plataforma.</li>
            <li style={s.li}>Garantizar el cumplimiento de las políticas internas de credeti.</li>
          </ul>
        </div>

        {/* 6. Uso permitido */}
        <div style={s.section}>
          <h2 style={s.h2}>6. Uso permitido de la plataforma</h2>
          <p style={s.p}>El usuario se compromete a:</p>
          <ul style={s.ul}>
            <li style={s.li}>No compartir sus credenciales de acceso con terceros.</li>
            <li style={s.li}>No intentar acceder a cuentas o información de otros usuarios.</li>
            <li style={s.li}>No utilizar la plataforma para actividades fraudulentas o ilegales.</li>
            <li style={s.li}>Mantener la confidencialidad de los códigos de invitación.</li>
          </ul>
          <p style={s.p}>
            El incumplimiento puede resultar en la suspensión inmediata de la cuenta
            y acciones legales correspondientes.
          </p>
        </div>

        {/* 7. Privacidad */}
        <div style={s.section}>
          <h2 style={s.h2}>7. Privacidad y protección de datos</h2>
          <p style={s.p}>
            El tratamiento de sus datos personales se rige por nuestro{" "}
            <a href="/privacidad" style={{ color: "#1d4ed8", fontWeight: 600 }}>
              Aviso de Privacidad
            </a>
            , el cual forma parte integral de estos Términos y Condiciones.
          </p>
        </div>

        {/* 8. Modificaciones */}
        <div style={s.section}>
          <h2 style={s.h2}>8. Modificaciones a los términos</h2>
          <p style={s.p}>
            credeti se reserva el derecho de modificar estos Términos en cualquier
            momento. Los cambios se notificarán a través de la plataforma.
          </p>
        </div>

        {/* 9. Jurisdicción */}
        <div style={s.section}>
          <h2 style={s.h2}>9. Jurisdicción y legislación aplicable</h2>
          <p style={s.p}>
            Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos.
            Cualquier controversia será resuelta ante los tribunales competentes de
            Toluca, Estado de México.
          </p>
        </div>

        {/* 10. Contacto */}
        <div style={s.section}>
          <h2 style={s.h2}>10. Contacto</h2>
          <InfoBox>
            <strong>credeti</strong><br />
            Ignacio López Rayón Sur 702, Despacho 104<br />
            Col. Cuauhtémoc, Toluca, Estado de México<br />
            (A un costado de la Secretaría del Trabajo)<br /><br />
            Correo: <strong>hola@crede-ti.info</strong><br />
            Tel: <strong>56 3190 8262</strong><br /><br />
            <strong>Sucursal CDMX:</strong><br />
            Av. Yucatan Sur #23, Milpa Alta, CDMX<br />
            WhatsApp cobranza: <strong>56 3190 8262</strong><br />
            Correo: <strong>financiamiento@crede-ti.com</strong>
          </InfoBox>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            credeti — crede-ti.info
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Al utilizar credeti, usted confirma haber leído y aceptado estos Términos y Condiciones.
          </p>
        </div>
      </div>
    </div>
  );
}
