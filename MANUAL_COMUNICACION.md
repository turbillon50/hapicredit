# Crede-Ti — Manual de Comunicación con Clientes

> Centro de control: el panel admin (tiempo real, refetch ~8s) + correos Resend + push web.

## 1. Ciclo de vida de la solicitud y avisos

| Evento | Disparador | Canal al cliente | Canal a admin |
|---|---|---|---|
| Solicitud recibida | `POST /api/public/apply` o `POST /api/me/apply` | Email "Recibimos tu solicitud (HC-xxxxx)" | Email "Nueva solicitud" + push |
| En revisión | estado `pending` | visible en /mi-credito | cola /admin/solicitudes |
| Falta info | `PATCH /credits/:id/review {action:needs_info,notes}` | Email + push + nota en hilo | — |
| Cliente responde | `PATCH /credits/:id/client-response` | regresa a pending | push a admins |
| Aprobada | `review {action:approve}` o `PATCH /credits/:id {status:active}` | Email aprobación + push | — |
| Rechazada | `review {action:reject}` | Email + push | — |
| Pago confirmado | registro de pago | Email comprobante | — |
| Recordatorio de pago | job/manual | Email recordatorio | — |
| Mensajes admin<->cliente | `/notes` y `/notes/my-message` | push bidireccional | hilo en cartera |

## 2. Correos (Resend) — CRÍTICO

- **Dominio de envío:** `vcredit.club` (verificado). `crede-ti.info` NO está verificado en Resend → si se usa como `from` Resend devuelve **403** y el correo NO sale.
- **Env vars (Vercel, prod/preview/dev):**
  - `RESEND_FROM=Crede-Ti <noreply@vcredit.club>`
  - `ADMIN_NOTIFY_EMAIL=dluisdelatorre@gmail.com` (buzón entregable; `admin@crede-ti.mx` rebotaba)
  - `RESEND_API_KEY` (secreto)
- **Regla de oro serverless:** todos los envíos se hacen con `await Promise.allSettled([...])` ANTES de `res.json()`. Si se dejan como fire-and-forget (`.catch(()=>{})` sin await) la función serverless muere antes de completar el HTTP a Resend y el correo se pierde silenciosamente.
- **Para usar el dominio de marca crede-ti.info:** agregar y verificar el dominio en https://resend.com/domains (registros DNS), luego cambiar `RESEND_FROM`.

## 3. Soporte in-app (estándar nuevo)

- Botón flotante **Reportar** (`components/ReportButton.tsx`) visible para usuarios autenticados.
- `POST /api/support/tickets` {subject, message, category} → tabla Neon `support_tickets` + push a admins.
- `GET /api/support/tickets` (admin) lista en vivo · `GET /api/support/my-tickets` (cliente) · `PATCH /api/support/tickets/:id` (admin: status open/in_progress/resolved + adminResponse).
- Esto es ADICIONAL al canal de crédito (notes/mensajes).

## 4. Verificación rápida (QA)

\`\`\`bash
# Disparar solicitud de prueba (usar -L: apex redirige a www)
curl -L -X POST https://crede-ti.info/api/public/apply -H 'Content-Type: application/json' \\
  -d '{"fullName":"Test","phone":"9990000000","email":"tu@correo.com","creditRequest":{"requestedAmount":3000,"termWeeks":8}}'
# Revisar entrega en Resend
curl 'https://api.resend.com/emails?limit=5' -H "Authorization: Bearer \$RESEND_API_KEY"
\`\`\`
Estado esperado: `last_event: delivered` para aviso admin y confirmación al solicitante.

## 5. Notas de operación
- API: proyecto Vercel `hapicredit-api-server`. Auto-deploy desde `main` (GitHub turbillon50/hapicredit).
- El apex `crede-ti.info` hace 307 → `www.crede-ti.info`. Clientes y API funcionan en www.
- PWA: install banner, update prompt, splash y service worker ya presentes.
