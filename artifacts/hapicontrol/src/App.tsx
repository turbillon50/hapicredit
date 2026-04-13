import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { AuthProvider } from "@/hooks/use-auth";
import logoImg from "@assets/IMG_0626_1775411853416.jpeg";

import Home             from "@/pages/home";
import Solicitar        from "@/pages/solicitar";
import MiCredito        from "@/pages/mi-credito";
import Perfil           from "@/pages/perfil";
import Registro         from "@/pages/registro";
import Login            from "@/pages/login";
import AdminCodigos     from "@/pages/admin/codigos";
import Privacidad       from "@/pages/privacidad";
import Terminos         from "@/pages/terminos";

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

import NotFound         from "@/pages/not-found";

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
      background: "linear-gradient(150deg,#0c1428 0%,#142246 55%,#1a3468 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="HapiCredit" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>Hapi<span style={{ color: "#e84545" }}>Credit</span></div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Tu crédito, Tu impulso</div>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/registro`}
        afterSignInUrl={`${basePath}/`}
        appearance={{
          elements: {
            socialButtonsRoot:       { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            dividerRow:              { display: "none" },
            card:                    { boxShadow: "0 24px 80px rgba(0,0,0,0.4)", borderRadius: 20 },
            headerTitle:             { fontSize: 20 },
            headerSubtitle:          { fontSize: 13 },
          },
          variables: { colorPrimary: "#e84545" },
        }}
      />
      <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
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
      background: "linear-gradient(150deg,#0c1428 0%,#142246 55%,#1a3468 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="HapiCredit" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>Hapi<span style={{ color: "#e84545" }}>Credit</span></div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Crea tu cuenta</div>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        afterSignUpUrl={`${basePath}/`}
        appearance={{
          elements: {
            socialButtonsRoot:       { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            dividerRow:              { display: "none" },
            card:                    { boxShadow: "0 24px 80px rgba(0,0,0,0.4)", borderRadius: 20 },
          },
          variables: { colorPrimary: "#e84545" },
        }}
      />
    </div>
  );
}

// ─── Syncs Clerk session → our DB token (no Google, just email/passkey) ─────
function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const { user: clerkUser, isSignedIn } = useUser();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const syncedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = addListener(({ user }: { user: { id: string } | null }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
        if (!userId) {
          localStorage.removeItem("hapi_token");
          localStorage.removeItem("hapi_role");
          localStorage.removeItem("hapi_user");
        }
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  useEffect(() => {
    if (!isSignedIn || !clerkUser || syncedRef.current) return;
    const existing = localStorage.getItem("hapi_token");
    if (existing) { syncedRef.current = true; return; }

    const email    = clerkUser.primaryEmailAddress?.emailAddress;
    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "";
    if (!email) return;

    // Pending registration context saved by registro.tsx
    const pendingRole      = sessionStorage.getItem("hapi_pending_role");
    const pendingCode      = sessionStorage.getItem("hapi_pending_code");
    const pendingStaffPass = sessionStorage.getItem("hapi_pending_staff_pass");

    syncedRef.current = true;
    fetch(`${API}/auth/clerk-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkId: clerkUser.id,
        email,
        fullName,
        role: pendingRole,
        inviteCode: pendingCode,
        staffPassword: pendingStaffPass,
      }),
    }).then(r => r.json()).then(data => {
      // Clear all pending session storage
      sessionStorage.removeItem("hapi_pending_role");
      sessionStorage.removeItem("hapi_pending_code");
      sessionStorage.removeItem("hapi_pending_staff_pass");

      if (data.token) {
        localStorage.setItem("hapi_token", data.token);
        localStorage.setItem("hapi_role", data.user.role);
        localStorage.setItem("hapi_user", JSON.stringify(data.user));
        qc.invalidateQueries();
        const role = data.user.role;
        window.location.href = role === "admin" ? `${basePath}/admin` : role === "executive" ? `${basePath}/dashboard` : `${basePath}/mi-credito`;
      } else if (data.needsCode) {
        sessionStorage.removeItem("hapi_pending_role");
        sessionStorage.removeItem("hapi_pending_code");
        sessionStorage.removeItem("hapi_pending_staff_pass");
        window.location.href = `${basePath}/registro`;
      }
    }).catch(() => { syncedRef.current = false; });
  }, [isSignedIn, clerkUser, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/"           component={Home} />
      <Route path="/registro"   component={Registro} />
      <Route path="/login"      component={Login} />
      <Route path="/privacidad" component={Privacidad} />
      <Route path="/terminos"   component={Terminos} />

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
      <Route path="/admin/cartera"          component={AdminCartera} />
      <Route path="/admin/morosos"          component={AdminMorosos} />
      <Route path="/admin/asesores"         component={AdminAsesores} />
      <Route path="/admin/financiero"       component={AdminFinanciero} />
      <Route path="/admin/validar-pagos"    component={AdminValidarPagos} />
      <Route path="/admin/caja"             component={AdminCaja} />
      <Route path="/admin/movimientos/:id"  component={AdminMovimientos} />
      <Route path="/admin/arbol"            component={AdminArbol} />
      <Route path="/admin/codigos"          component={AdminCodigos} />
      <Route path="/admin/expediente/:id"   component={AdminExpediente} />

      {/* Executive */}
      <Route path="/executive"              component={ExecDashboard} />
      <Route path="/dashboard"              component={ExecDashboard} />
      <Route path="/dashboard/cobrar"       component={ExecCobrar} />
      <Route path="/dashboard/alta-cliente" component={ExecAltaCliente} />
      <Route path="/dashboard/clientes"     component={ExecClients} />
      <Route path="/dashboard/expediente/:id" component={ExecClientDetail} />
      <Route path="/dashboard/pagos/nuevo"  component={ExecPaymentsNew} />
      <Route path="/dashboard/comisiones"   component={ExecComisiones} />
      <Route path="/dashboard/alertas"      component={ExecAlerts} />
      <Route path="/dashboard/compromisos"  component={ExecCommitments} />
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
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClerkCacheInvalidator />
          <Router />
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      {clerkPubKey ? <ClerkApp /> : <NoClerkApp />}
    </WouterRouter>
  );
}
