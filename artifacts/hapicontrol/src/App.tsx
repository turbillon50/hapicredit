import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";

import Home             from "@/pages/home";
import Solicitar        from "@/pages/solicitar";
import MiCredito        from "@/pages/mi-credito";
import Perfil           from "@/pages/perfil";
import Registro         from "@/pages/registro";
import Login            from "@/pages/login";
import AdminCodigos     from "@/pages/admin/codigos";

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

import NotFound         from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function SignInPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

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
          // Clerk user signed out — clear our token too
          localStorage.removeItem("hapi_token");
          localStorage.removeItem("hapi_role");
          localStorage.removeItem("hapi_user");
        }
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  // Sync Clerk user with our DB after Google/Clerk sign-in
  useEffect(() => {
    if (!isSignedIn || !clerkUser || syncedRef.current) return;
    const existing = localStorage.getItem("hapi_token");
    if (existing) { syncedRef.current = true; return; }

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "";
    if (!email) return;

    syncedRef.current = true;
    fetch(`${API}/auth/clerk-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId: clerkUser.id, email, fullName }),
    }).then(r => r.json()).then(data => {
      if (data.token) {
        localStorage.setItem("hapi_token", data.token);
        localStorage.setItem("hapi_role", data.user.role);
        localStorage.setItem("hapi_user", JSON.stringify(data.user));
        qc.invalidateQueries();
        const role = data.user.role;
        window.location.href = (role === "admin" || role === "executive") ? `${basePath}/admin` : `${basePath}/mi-credito`;
      } else if (data.needsCode) {
        window.location.href = `${basePath}/registro`;
      }
    }).catch(() => { syncedRef.current = false; });
  }, [isSignedIn, clerkUser]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/"           component={Home} />
      <Route path="/registro"   component={Registro} />
      <Route path="/login"      component={Login} />

      {/* Clerk auth routes */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* Client (protected) */}
      <Route path="/solicitar"  component={Solicitar} />
      <Route path="/mi-credito" component={MiCredito} />
      <Route path="/perfil"     component={Perfil} />

      {/* Admin */}
      <Route path="/admin"                component={AdminDashboard} />
      <Route path="/admin/solicitudes"    component={AdminSolicitudes} />
      <Route path="/admin/cartera"        component={AdminCartera} />
      <Route path="/admin/morosos"        component={AdminMorosos} />
      <Route path="/admin/asesores"       component={AdminAsesores} />
      <Route path="/admin/financiero"     component={AdminFinanciero} />
      <Route path="/admin/validar-pagos"  component={AdminValidarPagos} />
      <Route path="/admin/caja"           component={AdminCaja} />
      <Route path="/admin/movimientos/:id" component={AdminMovimientos} />
      <Route path="/admin/arbol"          component={AdminArbol} />
      <Route path="/admin/codigos"        component={AdminCodigos} />
      <Route path="/admin/expediente/:id" component={AdminExpediente} />

      {/* Legacy redirects */}
      <Route path="/portal"><Redirect to="/mi-credito" /></Route>
      <Route path="/dashboard"><Redirect to="/admin" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

const clerkJSUrl = `${basePath || ""}/clerk-js/clerk.browser.js`;

function ClerkApp() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      clerkJSUrl={clerkJSUrl}
      routerPush={(to: string) => setLocation(stripBase(to))}
      routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkCacheInvalidator />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function NoClerkApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
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
