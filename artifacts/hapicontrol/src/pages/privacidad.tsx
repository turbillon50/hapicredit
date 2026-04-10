export default function Privacidad() {
  const fecha = "10 de abril de 2025";

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ background: "#1e2d4f", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 180 180" fill="none">
            <circle cx="90" cy="52" r="16" fill="white"/>
            <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
          </svg>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>HapiCredit</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Tu crédito, Tu impulso</div>
          </div>
        </div>
        <a href="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none" }}>Iniciar sesión</a>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e2d4f", marginBottom: 6 }}>Aviso de Privacidad</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 40 }}>Última actualización: {fecha}</p>

        <Sec title="1. Identidad y domicilio del Responsable">
          <p>Grupo CAFJA S.A. de C.V. (en adelante "HapiCredit" o "el Responsable"), con domicilio en México, es responsable del tratamiento de sus datos personales de conformidad con lo establecido en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.</p>
          <p>Contacto del responsable: <a href="mailto:soporte@hapicredit.live" style={linkStyle}>soporte@hapicredit.live</a></p>
        </Sec>

        <Sec title="2. Datos personales que recabamos">
          <p>Para llevar a cabo las finalidades descritas en este aviso, recabamos las siguientes categorías de datos:</p>
          <ul style={ulStyle}>
            <li><strong>Datos de identificación:</strong> nombre completo, CURP, fecha de nacimiento, fotografía de identificación oficial (INE/IFE frente y reverso).</li>
            <li><strong>Datos de contacto:</strong> correo electrónico, número de teléfono, domicilio.</li>
            <li><strong>Datos laborales y económicos:</strong> comprobante de ingresos, actividad económica, declaración de finalidad del crédito.</li>
            <li><strong>Datos de cuenta:</strong> nombre de usuario, contraseña en formato encriptado.</li>
            <li><strong>Datos de autenticación Google:</strong> nombre, correo electrónico y foto de perfil obtenidos mediante Google Sign-In, únicamente con su consentimiento expreso.</li>
            <li><strong>Datos financieros:</strong> historial de pagos, saldos, comisiones.</li>
          </ul>
          <p>No recabamos datos personales sensibles (datos de salud, orientación sexual, religión, opinión política) salvo que la ley lo requiera expresamente.</p>
        </Sec>

        <Sec title="3. Finalidades del tratamiento">
          <p><strong>Finalidades primarias (necesarias para la relación jurídica):</strong></p>
          <ul style={ulStyle}>
            <li>Análisis y otorgamiento de créditos personales.</li>
            <li>Administración y seguimiento del portafolio de crédito.</li>
            <li>Cobro y recuperación de cartera.</li>
            <li>Generación de estados de cuenta y comprobantes de pago.</li>
            <li>Cumplimiento de obligaciones legales y regulatorias.</li>
            <li>Comunicación relacionada con su crédito activo.</li>
          </ul>
          <p><strong>Finalidades secundarias (puede oponerse):</strong></p>
          <ul style={ulStyle}>
            <li>Envío de promociones y ofertas de nuevos productos financieros.</li>
            <li>Encuestas de satisfacción y mejora de servicio.</li>
          </ul>
        </Sec>

        <Sec title="4. Transferencia de datos">
          <p>Sus datos podrán ser compartidos con:</p>
          <ul style={ulStyle}>
            <li>Autoridades gubernamentales cuando lo exija la ley (SAT, CNBV, UIF).</li>
            <li>Proveedores de servicios tecnológicos que actúen como encargados del tratamiento bajo acuerdos de confidencialidad (Replit Inc., Resend Inc., Google LLC).</li>
          </ul>
          <p>No vendemos ni cedemos sus datos personales a terceros con fines comerciales propios.</p>
        </Sec>

        <Sec title="5. Derechos ARCO">
          <p>Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> al tratamiento de sus datos (derechos ARCO). Para ejercerlos envíe una solicitud a <a href="mailto:soporte@hapicredit.live" style={linkStyle}>soporte@hapicredit.live</a> indicando:</p>
          <ul style={ulStyle}>
            <li>Nombre completo y usuario registrado.</li>
            <li>Descripción clara del derecho que desea ejercer.</li>
            <li>Copia de identificación oficial.</li>
          </ul>
          <p>Daremos respuesta en un plazo máximo de <strong>20 días hábiles</strong>.</p>
        </Sec>

        <Sec title="6. Uso de Google Sign-In">
          <p>HapiCredit utiliza el servicio de autenticación de Google (Google Sign-In) para facilitar el acceso a la plataforma. Al usar esta opción usted autoriza a Google a compartir con nosotros su nombre, correo electrónico y foto de perfil públicos. Esta información se utiliza exclusivamente para identificarle dentro de la plataforma y vincularla con su expediente de crédito.</p>
          <p>Nuestra aplicación cumple con la <a href="https://policies.google.com/terms" target="_blank" rel="noopener" style={linkStyle}>Política de Servicios de Google</a> y los requisitos de la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener" style={linkStyle}>Política de Datos de Usuario de la API de Google</a>.</p>
        </Sec>

        <Sec title="7. Cookies y tecnologías de rastreo">
          <p>La plataforma utiliza almacenamiento local del navegador (localStorage) para mantener su sesión activa y preferencias de usuario. No utilizamos cookies de rastreo de terceros con fines publicitarios.</p>
        </Sec>

        <Sec title="8. Medidas de seguridad">
          <p>Implementamos medidas técnicas y organizativas para proteger sus datos: cifrado de contraseñas (SHA-256 con salt), tokens de sesión aleatorios, comunicaciones cifradas (HTTPS/TLS), y acceso restringido por roles de usuario.</p>
        </Sec>

        <Sec title="9. Cambios al aviso de privacidad">
          <p>Cualquier modificación a este aviso será notificada mediante la publicación de la versión actualizada en <strong>https://hapicredit.live/privacidad</strong>. El uso continuo de la plataforma constituye aceptación de los cambios.</p>
        </Sec>

        <Sec title="10. Autoridad supervisora">
          <p>Si considera que su derecho a la protección de datos ha sido vulnerado, puede acudir al <strong>Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong> en <a href="https://www.inai.org.mx" target="_blank" rel="noopener" style={linkStyle}>www.inai.org.mx</a>.</p>
        </Sec>

        <div style={{ marginTop: 48, padding: "20px 24px", background: "#f0f4ff", borderRadius: 14, borderLeft: "4px solid #6366f1" }}>
          <p style={{ fontSize: 13, color: "#4338ca", margin: 0 }}>
            <strong>Contacto:</strong> Para cualquier consulta relacionada con este aviso, escríbenos a{" "}
            <a href="mailto:soporte@hapicredit.live" style={{ color: "#4338ca" }}>soporte@hapicredit.live</a>
          </p>
        </div>
      </main>

      <footer style={{ background: "#1e2d4f", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} Grupo CAFJA S.A. de C.V. / HapiCredit &nbsp;·&nbsp;{" "}
          <a href="/terminos" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Términos y Condiciones</a>
        </p>
      </footer>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e2d4f", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #e2e8f0" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

const linkStyle: React.CSSProperties = { color: "#4f46e5", textDecoration: "underline" };
const ulStyle: React.CSSProperties = { paddingLeft: 20, margin: "4px 0", display: "flex", flexDirection: "column", gap: 6 };
