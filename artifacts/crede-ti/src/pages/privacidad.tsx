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

export default function Privacidad() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "Montserrat, Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
            Aviso de Privacidad
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.65 }}>
            Última actualización: 17 de abril de 2026
          </p>
        </div>

        {/* 1. Responsable */}
        <div style={s.section}>
          <h2 style={s.h2}>1. Responsable del tratamiento de sus datos personales</h2>
          <p style={s.p}>
            <strong>credeti</strong>, con domicilio en Ignacio López Rayón Sur 702,
            Despacho 104, Col. Cuauhtémoc, Toluca, Estado de México, es responsable
            del tratamiento de sus datos personales conforme a la Ley Federal de
            Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
          <div style={{
            background: "rgba(33,93,255,0.06)", border: "1px solid rgba(33,93,255,0.14)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 12,
          }}>
            <p style={{ ...s.p, margin: 0 }}>
              <strong>Correo:</strong> hola@crede-ti.info<br />
              <strong>Tel:</strong> 56 3190 8262
            </p>
          </div>
        </div>

        {/* 2. Datos recabados */}
        <div style={s.section}>
          <h2 style={s.h2}>2. Datos personales que recabamos</h2>
          <p style={s.p}>
            En credeti protegemos la información de nuestros clientes.
            Para la prestación del servicio de crédito recabamos los siguientes datos:
          </p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Identificación:</strong> Nombre completo, INE, CURP.</li>
            <li style={s.li}><strong>Contacto:</strong> Número de teléfono, domicilio.</li>
            <li style={s.li}><strong>Referencias:</strong> Datos de dos referencias personales.</li>
          </ul>
          <p style={s.p}>
            No compartimos información con terceros sin autorización, salvo requerimiento legal.
            Los datos son resguardados de forma segura y confidencial.
          </p>
        </div>

        {/* 3. Finalidades */}
        <div style={s.section}>
          <h2 style={s.h2}>3. Finalidades del tratamiento</h2>
          <p style={s.p}>Esta información se utiliza únicamente para:</p>
          <ul style={s.ul}>
            <li style={s.li}>Evaluación y otorgamiento de crédito.</li>
            <li style={s.li}>Validación de identidad del solicitante.</li>
            <li style={s.li}>Seguimiento y cobranza del crédito.</li>
            <li style={s.li}>Cumplimiento de obligaciones legales.</li>
          </ul>
        </div>

        {/* 4. Transferencias */}
        <div style={s.section}>
          <h2 style={s.h2}>4. Transferencia de datos personales</h2>
          <p style={s.p}>
            Sus datos podrán ser transferidos únicamente en los casos establecidos
            por el Artículo 37 de la LFPDPPP:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>Autoridades competentes en cumplimiento de obligaciones legales.</li>
            <li style={s.li}>Empresas del mismo grupo corporativo bajo los mismos términos.</li>
          </ul>
        </div>

        {/* 5. Derechos ARCO */}
        <div style={s.section}>
          <h2 style={s.h2}>5. Derechos ARCO</h2>
          <p style={s.p}>
            El cliente puede solicitar información sobre el uso de sus datos, así como
            ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación u Oposición (ARCO)</strong>.
            Para ello, envíe su solicitud a:
          </p>
          <div style={{
            background: "rgba(33,93,255,0.06)", border: "1px solid rgba(33,93,255,0.14)", borderRadius: 12,
            padding: "16px 20px", marginBottom: 12,
          }}>
            <p style={{ ...s.p, margin: 0 }}>
              <strong>Correo:</strong> hola@crede-ti.info<br />
              <strong>Asunto:</strong> Ejercicio de Derechos ARCO<br />
              <strong>Tiempo de respuesta:</strong> 20 días hábiles
            </p>
          </div>
        </div>

        {/* 6. Cambios */}
        <div style={s.section}>
          <h2 style={s.h2}>6. Cambios al aviso de privacidad</h2>
          <p style={s.p}>
            Cualquier modificación a este Aviso será notificada a través de la plataforma
            <strong> crede-ti.info</strong>.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            credeti — crede-ti.info
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Este aviso cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
          </p>
        </div>
      </div>
    </div>
  );
}
