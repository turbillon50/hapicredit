import { Resend } from "resend";

// Resend via plain RESEND_API_KEY env var. The "from" address can be overridden
// with RESEND_FROM (must be a verified sender in your Resend account).
let cachedClient: { client: Resend; from: string } | null = null;

async function getResendClient(): Promise<{ client: Resend; from: string } | null> {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM ?? "Crede-Ti <noreply@crede-ti.info>";
  cachedClient = { client: new Resend(apiKey), from };
  return cachedClient;
}

// Base HTML wrapper
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crede-Ti</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#0E68CC;border-radius:16px 16px 0 0;padding:28px 0;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:4px;">
              <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:50%;width:48px;height:48px;line-height:48px;text-align:center;font-size:22px;">♥</div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Crede-Ti</span>
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="color:rgba(255,255,255,0.55);font-size:12px;">Creemos en ti</span>
            </td>
          </tr>
        </table>
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:0 0 16px 16px;padding:32px;" cellpadding="0" cellspacing="0">
          <tr><td>${content}</td></tr>
        </table>
        <p style="color:#94a3b8;font-size:11px;margin-top:16px;text-align:center;">
          © ${new Date().getFullYear()} Crede-Ti &nbsp;·&nbsp; crede-ti.info
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email: Bienvenida tras registro ────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  to: string;
  fullName: string;
  username: string;
  role: string;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const roleLabel = opts.role === "admin" ? "Administrador" : opts.role === "executive" ? "Asesor" : "Acreditado";
  const dashboardUrl = "https://crede-ti.info/login";

  const content = `
    <h2 style="color:#0E68CC;font-size:22px;margin:0 0 8px;">Bienvenido, ${opts.fullName}</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">Tu cuenta Crede-Ti ha sido creada exitosamente. Ya puedes acceder a tu panel.</p>

    <table width="100%" style="background:#f8fafc;border-radius:12px;padding:20px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Usuario</span><br/>
          <span style="color:#0E68CC;font-size:16px;font-weight:700;">${opts.username}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Rol</span><br/>
          <span style="color:#0E68CC;font-size:16px;font-weight:700;">${roleLabel}</span>
        </td>
      </tr>
    </table>

    <div style="margin:28px 0;text-align:center;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#0E68CC;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">Iniciar sesion</a>
    </div>

    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">Si no creaste esta cuenta, puedes ignorar este mensaje. Para soporte contacta a tu asesor o escribe a soporte@crede-ti.info.</p>
  `;

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject: "Bienvenido a Crede-Ti",
    html: baseTemplate(content),
  });
}

// ── Email: Codigo de invitacion ────────────────────────────────────────────────
export async function sendInviteCodeEmail(opts: {
  to: string;
  inviteeName?: string;
  code: string;
  role: string;
  inviterName: string;
  expiresAt: Date;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const roleLabel = opts.role === "executive" ? "Asesor" : "Acreditado";
  const expires = opts.expiresAt.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  const registroUrl = `https://crede-ti.info/registro`;

  const content = `
    <h2 style="color:#0E68CC;font-size:22px;margin:0 0 8px;">Te invitaron a Crede-Ti</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;"><strong>${opts.inviterName}</strong> te envio un codigo para registrarte como <strong>${roleLabel}</strong> en la plataforma Crede-Ti.</p>

    <div style="background:#f0f4ff;border:2px dashed #6366f1;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;margin:0 0 8px;">Tu codigo de invitacion</p>
      <span style="font-size:32px;font-weight:900;letter-spacing:6px;color:#0E68CC;">${opts.code}</span>
      <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">Valido hasta el ${expires}</p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${registroUrl}" style="display:inline-block;background:#0E68CC;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">Registrarme ahora</a>
    </div>

    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">Ingresa a <a href="${registroUrl}" style="color:#6366f1;">${registroUrl}</a> y usa el codigo de arriba para crear tu cuenta. Caduca el ${expires}.</p>
  `;

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject: `${opts.inviterName} te invita a Crede-Ti`,
    html: baseTemplate(content),
  });
}

// ── Email: Pago registrado / confirmado ────────────────────────────────────────
export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  clientName: string;
  amount: number;
  weekNumber: number;
  totalWeeks: number;
  remainingBalance: number;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const content = `
    <h2 style="color:#0E68CC;font-size:22px;margin:0 0 8px;">Pago confirmado</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">Hola <strong>${opts.clientName}</strong>, tu pago ha sido registrado y validado en Crede-Ti.</p>

    <table width="100%" style="background:#f8fafc;border-radius:12px;padding:20px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">Monto pagado</span>
          <span style="float:right;color:#16a34a;font-weight:700;font-size:16px;">${fmt(opts.amount)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">Semana</span>
          <span style="float:right;color:#0E68CC;font-weight:700;font-size:14px;">${opts.weekNumber} de ${opts.totalWeeks}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#64748b;font-size:13px;">Saldo restante</span>
          <span style="float:right;color:#0E68CC;font-weight:700;font-size:16px;">${fmt(opts.remainingBalance)}</span>
        </td>
      </tr>
    </table>

    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.6;">Este es un comprobante automatico. Guarda este correo como respaldo de tu pago. Para cualquier duda contacta a tu asesor.</p>
  `;

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject: "Comprobante de pago — Crede-Ti",
    html: baseTemplate(content),
  });
}

// ── Email: Reasignacion de cliente ─────────────────────────────────────────────
export async function sendClientReassignmentEmail(opts: {
  to: string;
  executiveName: string;
  clientName: string;
  clientPhone: string;
  clientAltPhone?: string | null;
  clientAddress?: string | null;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const content = `
    <h2 style="color:#0E68CC;font-size:22px;margin:0 0 8px;">Nuevo cliente asignado</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">Hola <strong>${opts.executiveName}</strong>, se te ha asignado un nuevo cliente. Aqui estan sus datos de contacto:</p>

    <table width="100%" style="background:#f8fafc;border-radius:12px;padding:20px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Nombre</span><br/>
          <span style="color:#0E68CC;font-size:16px;font-weight:700;">${opts.clientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Telefono</span><br/>
          <span style="color:#0E68CC;font-size:15px;font-weight:600;">${opts.clientPhone}</span>
        </td>
      </tr>
      ${opts.clientAltPhone ? `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Telefono alternativo</span><br/>
          <span style="color:#0E68CC;font-size:15px;font-weight:600;">${opts.clientAltPhone}</span>
        </td>
      </tr>` : ""}
      ${opts.clientAddress ? `
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Direccion</span><br/>
          <span style="color:#0E68CC;font-size:15px;">${opts.clientAddress}</span>
        </td>
      </tr>` : ""}
    </table>

    <div style="margin:28px 0;text-align:center;">
      <a href="https://crede-ti.info" style="display:inline-block;background:#0E68CC;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">Ver en Crede-Ti</a>
    </div>

    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">Comunicate con el cliente a la brevedad para iniciar el seguimiento. Para cualquier duda contacta a tu administrador.</p>
  `;

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject: `Nuevo cliente asignado — ${opts.clientName}`,
    html: baseTemplate(content),
  });
}

// ── Email: Decisión de crédito (aprobado / rechazado) ─────────────────────────
export async function sendCreditDecisionEmail(opts: {
  to: string;
  clientName: string;
  action: "approve" | "reject" | "needs_info";
  amount: number;
  notes?: string;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const supportWa = "https://wa.me/529984292748";

  let content: string;
  let subject: string;

  if (opts.action === "approve") {
    subject = "¡Tu crédito fue aprobado! — Crede-Ti";
    content = `
    <h2 style="color:#16a34a;font-size:22px;margin:0 0 8px;">¡Tu crédito fue aprobado!</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Hola <strong>${opts.clientName}</strong>, nos complace informarte que tu solicitud de crédito por
      <strong style="color:#16a34a;">${fmt(opts.amount)}</strong> ha sido <strong>aprobada</strong>.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#15803d;font-size:14px;margin:0;">
        Tu asesor se pondrá en contacto contigo para coordinar el desembolso.
        Recuerda llevar tu identificación oficial.
      </p>
    </div>
    ${opts.notes ? `<p style="color:#64748b;font-size:14px;margin:0 0 24px;">Notas: <em>${opts.notes}</em></p>` : ""}
    <div style="margin:28px 0;text-align:center;">
      <a href="https://crede-ti.info/mi-credito" style="display:inline-block;background:#0E68CC;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">Ver mi crédito</a>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">¿Tienes dudas? Contáctanos por WhatsApp al <a href="${supportWa}" style="color:#25d366;font-weight:700;">998 429 2748</a>.</p>
  `;
  } else if (opts.action === "needs_info") {
    subject = "Información adicional requerida — Crede-Ti";
    content = `
    <h2 style="color:#d97706;font-size:22px;margin:0 0 8px;">Necesitamos más información</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Hola <strong>${opts.clientName}</strong>, estamos revisando tu solicitud de crédito por
      <strong>${fmt(opts.amount)}</strong> y necesitamos información adicional para continuar.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;">Información requerida</p>
      <p style="color:#b45309;font-size:14px;margin:0;">${opts.notes}</p>
    </div>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6;">
      Por favor comunícate con tu asesor o responde a este correo con la información solicitada.
    </p>
    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">¿Tienes dudas? Contáctanos por WhatsApp al <a href="${supportWa}" style="color:#25d366;font-weight:700;">998 429 2748</a>.</p>
  `;
  } else {
    subject = "Actualización de tu solicitud — Crede-Ti";
    content = `
    <h2 style="color:#dc2626;font-size:22px;margin:0 0 8px;">Solicitud no aprobada</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Hola <strong>${opts.clientName}</strong>, lamentamos informarte que tu solicitud de crédito por
      <strong>${fmt(opts.amount)}</strong> no pudo ser aprobada en este momento.
    </p>
    ${opts.notes ? `
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#9f1239;font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;">Motivo</p>
      <p style="color:#be123c;font-size:14px;margin:0;">${opts.notes}</p>
    </div>` : ""}
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6;">
      Puedes volver a solicitar cuando hayas regularizado tu situación.
      Para más información contacta a tu asesor.
    </p>
    <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">¿Tienes dudas? Contáctanos por WhatsApp al <a href="${supportWa}" style="color:#25d366;font-weight:700;">998 429 2748</a>.</p>
  `;
  }

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject,
    html: baseTemplate(content),
  });
}

// ── Email: Recordatorio de pago ────────────────────────────────────────────────
export async function sendPaymentReminderEmail(opts: {
  to: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  weekNumber: number;
  totalWeeks: number;
}) {
  const ctx = await getResendClient();
  if (!ctx) return;

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const due = opts.dueDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  const content = `
    <h2 style="color:#0E68CC;font-size:22px;margin:0 0 8px;">Recordatorio de pago</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px;line-height:1.6;">Hola <strong>${opts.clientName}</strong>, te recordamos que tienes un pago pendiente este ${due}.</p>

    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;">Pago de esta semana</p>
      <p style="margin:0;color:#0E68CC;font-size:28px;font-weight:900;">${fmt(opts.amount)}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Semana ${opts.weekNumber} de ${opts.totalWeeks}</p>
    </div>

    <p style="color:#64748b;font-size:14px;margin:0 0 8px;"><strong>Importante:</strong> El recargo por mora es de <strong>$500 por dia</strong> de atraso. Realiza tu pago a tiempo para evitarlo.</p>

    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.6;">Comunicate con tu asesor para confirmar la entrega de tu pago o si tienes algun inconveniente.</p>
  `;

  await ctx.client.emails.send({
    from: ctx.from,
    to: opts.to,
    subject: `Recordatorio — Pago semana ${opts.weekNumber} por ${opts.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`,
    html: baseTemplate(content),
  });
}
