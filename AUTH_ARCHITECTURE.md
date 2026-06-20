# Arquitectura de Auth & Routing — Crede-Ti

> Documento crítico. Cualquiera que toque `src/components/layout/Layout.tsx`,
> `src/App.tsx` o el routing DEBE leer esto primero. Aquí están las reglas y,
> sobre todo, los ERRORES YA COMETIDOS para no repetirlos.

## Fuentes de verdad (en orden estricto)

1. **token**: `localStorage.credeti_token` (master-login demo) **O** sesión Clerk activa (`isSignedIn`).
2. **role**:
   - Si hay sesión Clerk → **SIEMPRE** `clerkUser.publicMetadata.role`. NO editable por el usuario.
   - Si NO hay Clerk (demo / master-login) → `localStorage.credeti_role`.
   - Fallback `"client"` solo para usuario Clerk recién creado sin metadata.
3. **authReady** = `!isSignedIn || clerkLoaded`. Es la señal de "ya puedo rutear sin trabarme".

## Reglas de oro (NO romper)

- **NUNCA `navigate()` en render.** Solo en un `useEffect`. Navegar en render causa
  el error "Cannot update Router while rendering Layout" y un BUCLE de re-render.
- **El routing vive en UN SOLO `useEffect`.** No duplicar lógica de navegación en
  render + effect (se pelean durante el boot de Clerk).
- **Loader controlado por `authReady`, NO por presencia de datos en localStorage.**
- **Seguridad real = backend.** Cada endpoint valida rol desde el token firmado
  (`requireRole`). El frontend (`checkAccess`) solo controla qué UI se muestra; NO
  es la barrera de seguridad. Los datos están blindados aunque alguien fuerce la UI.
- **El rol para decisiones de UI viene de Clerk**, no de localStorage (que el usuario
  puede editar). Así nadie se auto-promueve a admin tocando el navegador.

## Errores ya cometidos (historial para no repetir)

| # | Error | Síntoma | Causa raíz | Fix |
|---|-------|---------|-----------|-----|
| 1 | `navigate()` en render + lógica duplicada en effect | Bucle/rebote en el arranque | Navegar en fase de render dispara re-render infinito | Quitar navigate de render; routing solo en 1 effect |
| 2 | 4 imports/rutas duplicados de `AdminExpediente` | Build roto (deploy con build viejo) | `str.replace` aplicado varias veces | Dejar 1 import / 1 ruta |
| 3 | Emails `fire-and-forget` sin `await` | Correos no llegaban | En serverless la función se congela tras `res.json()` | `await` antes de responder |
| 4 | Rol desde localStorage (editable) | Usuario podía ver cascarón del panel | Fuente de verdad insegura | Rol desde Clerk publicMetadata |
| 5 | **Guard `roleResolving` miraba localStorage tras mover rol a Clerk** | **Pantalla TRABADA en "Cargando…"** | **Guard inconsistente con la nueva fuente del rol** | **`authReady = !isSignedIn \|\| clerkLoaded`** |
| 6 | `window.location.href` / `<a href>` para cambiar de vista | Switch lento, "desmadre", recarga toda la app | Full reload en vez de navegación SPA | Usar `<Link>` / `navigate()` |

### Lección transversal
El sistema de auth tenía DEMASIADAS fuentes de verdad compitiendo (localStorage,
Clerk, dos effects, dos loaders). Cada parche aislado introducía un edge case nuevo
porque no había una resolución única. La solución NO es otro parche: es **una sola
derivación síncrona de `{token, role, authReady}` y un solo punto de routing.**
Si vas a tocar auth, toca esa resolución única — no agregues un guard nuevo al lado.

## Roles válidos
`admin` (panel completo), `executive` (dashboard asesor), `client`/`customer` (vista acreditado).

## Cómo se entra como admin
1. Login en `/login` con cuenta Clerk cuyo `publicMetadata.role = "admin"`.
2. Aterriza en vista cliente (`/mi-credito`) — a propósito, admin también es acreditado.
3. Perfil → "Panel de administración" (navegación SPA) → `/admin`.
4. Volver: ícono 👤 en el header del panel.
> Si cambias el rol de alguien en Clerk, debe cerrar sesión y volver a entrar para
> que el JWT nuevo traiga el rol actualizado.
