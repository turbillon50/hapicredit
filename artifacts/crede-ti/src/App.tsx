import React from "react";
import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { esES } from "@clerk/localizations";
import { AuthProvider } from "@/hooks/use-auth";
import logoImg from "@assets/logo-credeti-square.jpeg";

import Home             from "@/pages/home";
import Solicitar        from "@/pages/solicitar";
import MiCredito        from "@/pages/mi-credito";
import Perfil           from "@/pages/perfil";
import Registro         from "@/pages/registro";
import Login            from "@/pages/login";
import AdminCodigos     from "@/pages/admin/codigos";
import Privacidad       from "@/pages/privacidad";
import Terminos         from "@/pages/terminos";
import Seguimiento      from "@/pages/seguimiento";

import AdminDashboard    from "@/pages/admin/dashboard";
import AdminCartera      from "@/pages/admin/cartera";
import AdminMorosos      from "@/pages/admin/morosos";
import AdminAsesores     from "@/pages/admin/executives";
import AdminFinanciero   from "@/pages/admin/financiero";
import AdminSolicitudes  from "@/pages/admin/solicitudes";
import AdminExpediente   from "@/pages/admin/expediente";
import AdminValidarPagos from "@/pages/admin/validar-pagos";
import AdminCaja         from "@/pages/admin/caja";
import AdminMovimientos  from "@/pages/admin/movimientos";
import AdminArbol        from "@/pages/admin/arbol";

import ExecDashboard    from "@/pages/executive/dashboard";
import ExecCobrar       from "@/pages/executive/cobrar";
import ExecAltaCliente  from "@/pages/executive/alta-cliente";
import ExecClients      from "@/pages/executive/clients";
import ExecClientDetail from "@/pages/executive/client-detail";
import ExecPaymentsNew  from "@/pages/executive/payments-new";
import ExecComisiones   from "@/pages/executive/comisiones";
import ExecAlerts       from "@/pages/executive/alerts";
import ExecCommitments  from "@/pages/executive/commitments";
import ExecAgenda       from "@/pages/executive/agenda";

import Calculadora     from "@/pages/calculadora";
import Faq             from "@/pages/faq";
import AdminFaq           from "@/pages/admin/faq";
import AdminConfiguracion  from "@/pages/admin/configuracion";
import Entrar         from "@/pages/entrar";
import Acceso          from "@/pages/acceso";
import Invitacion      from "@/pages/invitacion";
import AdminReportes   from "@/pages/admin/reportes";
import AdminCentro        from "@/pages/admin/centro";
import NotFound         from "@/pages/not-found";
import UpdatePrompt     from "@/components/UpdatePrompt";
import SmartInstallBanner from "@/components/SmartInstallBanner";
import { SplashScreen } from "@/components/SplashScreen";

const clerkPubKey  = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath     = import.meta.env.BASE_URL.replace(/\/$/, "");
const API          = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});


// ─── Clerk sign-in page (Google hidden via appearance API) ─────────────────
function SignInPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#06143B 0%,#215DFF 55%,#19D7D7 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="credeti" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>crede<span style={{ color: "#19D7D7" }}>ti</span></div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Crédito para ti</div>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/mi-credito`}
        appearance={{
          elements: {
            socialButtonsRoot:       { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            dividerRow:              { display: "none" },
            card:                    { boxShadow: "0 24px 80px rgba(0,0,0,0.4)", borderRadius: 20 },
            headerTitle:             { fontSize: 20 },
            headerSubtitle:          { fontSize: 13 },
          },
          variables: { colorPrimary: "#215DFF" },
        }}
      />
      <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>Términos y condiciones</a>
      </div>
    </div>
  );
}

// ─── Clerk sign-up page (Google hidden, after role/code validated in registro) ─
function SignUpPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#06143B 0%,#215DFF 55%,#19D7D7 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="credeti" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>crede<span style={{ color: "#19D7D7" }}>ti</span></div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Crea tu cuenta</div>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/mi-credito`}
        appearance={{
          elements: {
            socialButtonsRoot:       { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            dividerRow:              { display: "none" },
            card:                    { boxShadow: "0 24px 80px rgba(0,0,0,0.4)", borderRadius: 20 },
          },
          variables: { colorPrimary: "#215DFF" },
        }}
      />
    </div>
  );
}

// ─── Syncs Clerk session → our DB token ──────────────────────────────────────
function ClerkCacheInvalidator() {
  const { addListener, session } = useClerk();
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Clear local auth when the user signs out of Clerk.
  useEffect(() => {
    const unsubscribe = addListener((resources) => {
      const user = resources.user ?? null;
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
        if (!userId) {
          localStorage.removeItem("credeti_token");
          localStorage.removeItem("credeti_role");
          localStorage.removeItem("credeti_user");
          localStorage.removeItem("credeti_admin_origin");
        }
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  // When the user is signed in via Clerk, mirror the Clerk session into the
  // localStorage shape the legacy app reads from. The backend (PR #11) accepts
  // Clerk JWTs in Authorization headers, so we just store the JWT as the token.
  // The role is read from publicMetadata.role (owner sets it in Clerk dashboard).
  // No more /auth/clerk-sync POST — the Clerk webhook syncs users into the DB.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser || !session) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await session.getToken();
        if (cancelled || !token) return;
        // Fetch the DB role — source of truth after elevation via master code.
        // Clerk publicMetadata may lag until the JWT is refreshed.
        let role = (clerkUser.publicMetadata?.role as string | undefined) ?? "client";
        // Auto-corrige rol admin para emails en SUPERADMIN_EMAILS (sin intervención manual).
        try {
          const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress ?? "";
          await fetch(`${API}/auth/sync-role`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "x-user-email": clerkEmail } });
        } catch { /* no crítico */ }
        try {
          const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) { const me = await meRes.json(); if (me?.role) role = me.role; }
        } catch { /* keep Clerk role as fallback */ }
        // Asesor desactivado: cualquier rol executive se trata como cliente en la app.
        if (role === "executive") role = "client";

        const fullName =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
          || clerkUser.username
          || clerkUser.primaryEmailAddress?.emailAddress
          || "Usuario";
        const userObj = {
          id: clerkUser.id,
          clerkId: clerkUser.id,
          username: clerkUser.username ?? clerkUser.primaryEmailAddress?.emailAddress ?? `clerk_${clerkUser.id.slice(-6)}`,
          fullName,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          role,
        };
        localStorage.setItem("credeti_token", token);
        localStorage.setItem("credeti_role", role);
        localStorage.setItem("credeti_user", JSON.stringify(userObj));
        qc.invalidateQueries(); // refetch tras mirror de sesión Clerk
      } catch {
        // Silent — backend still has the demo + DB fallbacks. The ErrorBoundary
        // upstairs will surface any actual crash.
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, clerkUser, session, qc]);

  // Keep the legacy credeti_token FRESH. Clerk session JWTs expire after ~60s,
  // and the whole app reads this token synchronously from localStorage as its
  // Bearer. Without refreshing, every client API call (mi-credito, solicitar,
  // perfil) starts returning 401 about a minute after sign-in — which made the
  // credit application silently fall back to the public-leads endpoint instead
  // of landing in the admin "solicitudes" queue. Refresh every 30s + on focus.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !session) return;
    let active = true;
    const refresh = async () => {
      try { const t = await session.getToken(); if (active && t) localStorage.setItem("credeti_token", t); } catch { /* keep last token */ }
    };
    refresh();
    const iv = setInterval(refresh, 30_000);
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active = false;
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [isLoaded, isSignedIn, session]);

  return null;
}

function RootRedirect() {
  const role  = localStorage.getItem("credeti_role");
  const token = localStorage.getItem("credeti_token");
  // Los admins NO aterrizan en /admin (ruta no obvia). Entran a la vista de
  // cliente como cualquier usuario — pueden solicitar crédito y vivir el flujo.
  // El panel admin se alcanza con el switch discreto desde el perfil.
  // El admin aterriza DIRECTO en el panel de administracion (sin botones que buscar).
  if (token && role === "admin") return <Redirect to="/admin" />;
  // Asesor desactivado: el resto (cliente/executive) entra a la vista de cliente.
  if (token && (role === "client" || role === "executive")) return <Redirect to="/mi-credito" />;
  return <Home />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/"           component={RootRedirect} />
      <Route path="/inicio"     component={Home} />
      <Route path="/entrar/:key" component={Entrar} />
      <Route path="/acceso/:token" component={Acceso} />
      <Route path="/registro"   component={Registro} />
      <Route path="/login"      component={Login} />
      <Route path="/privacidad" component={Privacidad} />
      <Route path="/terminos"   component={Terminos} />
      <Route path="/faq"          component={Faq} />
      <Route path="/calculadora"  component={Calculadora} />
      <Route path="/seguimiento"  component={Seguimiento} />
      <Route path="/invitacion/:code" component={Invitacion} />

      {/* Clerk auth routes */}
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-in/factor-one" component={SignInPage} />
      <Route path="/sign-in/factor-two" component={SignInPage} />
      <Route path="/sign-in/sso-callback" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-up/verify-email-address" component={SignUpPage} />
      <Route path="/sign-up/continue" component={SignUpPage} />

      {/* Client */}
      <Route path="/solicitar"  component={Solicitar} />
      <Route path="/mi-credito" component={MiCredito} />
      <Route path="/perfil"     component={Perfil} />

      {/* Admin */}
      <Route path="/admin"                  component={AdminDashboard} />
      <Route path="/admin/solicitudes"      component={AdminSolicitudes} />
      <Route path="/admin/expediente/:userId" component={AdminExpediente} />
      <Route path="/admin/cartera"          component={AdminCartera} />
      <Route path="/admin/morosos"          component={AdminMorosos} />
      <Route path="/admin/asesores"         component={AdminAsesores} />
      <Route path="/admin/financiero"       component={AdminFinanciero} />
      <Route path="/admin/validar-pagos"    component={AdminValidarPagos} />
      <Route path="/admin/caja"             component={AdminCaja} />
      <Route path="/admin/movimientos/:id"  component={AdminMovimientos} />
      <Route path="/admin/arbol"            component={AdminArbol} />
      <Route path="/admin/codigos"          component={AdminCodigos} />
      <Route path="/admin/faq"              component={AdminFaq} />
      <Route path="/admin/configuracion"   component={AdminConfiguracion} />
      <Route path="/admin/reportes"        component={AdminReportes} />
      <Route path="/admin/centro"          component={AdminCentro} />

      {/* Executive / Asesor — DESACTIVADO: redirige a vista de cliente.
          Para reactivar, restaurar los componentes Exec* en cada ruta. */}
      <Route path="/executive"              component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard"              component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/cobrar"       component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/alta-cliente" component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/clientes"     component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/expediente/:id" component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/pagos/nuevo"  component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/comisiones"   component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/alertas"      component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/compromisos"  component={() => <Redirect to="/mi-credito" />} />
      <Route path="/dashboard/agenda"       component={ExecAgenda} />
      <Route path="/dashboard/codigos"      component={AdminCodigos} />

      {/* Legacy */}
      <Route path="/portal"><Redirect to="/mi-credito" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkApp() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      localization={esES}
      // Force Clerk to use THIS app's own sign-in/sign-up pages instead of the
      // hosted Account Portal (accounts.crede-ti.info), which is not configured
      // and was sending users to a blank page / bouncing them back. These props
      // override the instance display_config for redirectToSignIn, the in-widget
      // "sign in / sign up" links, and post-auth/sign-out redirects.
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/mi-credito`}
      signUpFallbackRedirectUrl={`${basePath}/mi-credito`}
      afterSignOutUrl={`${basePath}/`}
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClerkCacheInvalidator />
          <Router />
          <UpdatePrompt />
          <SmartInstallBanner />
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function NoClerkApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <UpdatePrompt />
        <SmartInstallBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Wraps ClerkApp — if Clerk JS CDN fails (network error, ad-block, etc.)
// fall back to NoClerkApp so the DB-auth flow still works and the page renders.
class ClerkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* silent — we degrade gracefully */ }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default function App() {
  const [splash, setSplash] = useState(() => !sessionStorage.getItem("credeti_splashed"));

  return (
    <WouterRouter base={basePath}>
      {splash && <SplashScreen onDone={() => { sessionStorage.setItem("credeti_splashed", "1"); setSplash(false); }} />}
      {clerkPubKey
          ? <ClerkErrorBoundary fallback={<NoClerkApp />}><ClerkApp /></ClerkErrorBoundary>
          : <NoClerkApp />
        }
    </WouterRouter>
  );
}
