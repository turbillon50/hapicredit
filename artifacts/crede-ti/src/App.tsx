import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
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

import Faq             from "@/pages/faq";
import AdminFaq        from "@/pages/admin/faq";
import NotFound         from "@/pages/not-found";
import UpdatePrompt     from "@/components/UpdatePrompt";
import SmartInstallBanner from "@/components/SmartInstallBanner";

const clerkPubKey  = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath     = import.meta.env.BASE_URL.replace(/\/$/, "");
const API          = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

// ─── Admin master-login modal ───────────────────────────────────────────────
function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [pwd, setPwd]   = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  async function submit() {
    if (!pwd) return;
    setBusy(true); setErr("");
    try {
      const res  = await fetch(`${API}/auth/master-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_admin") {
          window.location.href = `${basePath}/registro`;
        } else {
          setErr(data.error ?? "Clave incorrecta");
        }
        return;
      }
      localStorage.setItem("credeti_token", data.token);
      localStorage.setItem("credeti_role",  data.user.role);
      localStorage.setItem("credeti_user",  JSON.stringify(data.user));
      window.location.href = `${basePath}/admin`;
    } catch {
      setErr("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px max(20px, env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Acceso administrador</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Ingresa la clave maestra para continuar</div>
          </div>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
          Clave maestra
        </label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && pwd && submit()}
            autoFocus
            placeholder="••••••••"
            style={{
              width: "100%", padding: "13px 44px 13px 14px", borderRadius: 12,
              border: `1.5px solid ${err ? "#f87171" : "#e2e8f0"}`,
              fontSize: 15, outline: "none", boxSizing: "border-box",
              background: err ? "#fff5f5" : "#f9fafb",
            }}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
          >
            {show
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>

        {err && <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, padding: "8px 12px", background: "#fff5f5", borderRadius: 8, border: "1px solid #fca5a5" }}>{err}</div>}

        <button
          onClick={submit}
          disabled={busy || !pwd}
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none", cursor: busy || !pwd ? "not-allowed" : "pointer",
            background: busy || !pwd ? "#e2e8f0" : "#7c3aed",
            color: busy || !pwd ? "#9ca3af" : "#fff",
            fontWeight: 700, fontSize: 15, transition: "background 0.2s",
          }}
        >
          {busy ? "Verificando..." : "Entrar como admin"}
        </button>
      </div>
    </div>
  );
}

// ─── Clerk sign-in page (Google hidden via appearance API) ─────────────────
function SignInPage() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#15206E 0%,#2A3CD6 55%,#3F51E6 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="Crede-Ti" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>Crede<span style={{ color: "#F0A93A" }}>-Ti</span></div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>Creemos en ti</div>
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
          variables: { colorPrimary: "#2A3CD6" },
        }}
      />
      <button
        onClick={() => setAdminOpen(true)}
        style={{
          marginTop: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12, padding: "10px 20px", color: "rgba(255,255,255,0.5)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Acceso administrador
      </button>
      <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>Términos y condiciones</a>
      </div>
      {adminOpen && <AdminLoginModal onClose={() => setAdminOpen(false)} />}
    </div>
  );
}

// ─── Clerk sign-up page (Google hidden, after role/code validated in registro) ─
function SignUpPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#15206E 0%,#2A3CD6 55%,#3F51E6 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", background: "#fff" }}>
          <img src={logoImg} alt="Crede-Ti" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>Crede<span style={{ color: "#F0A93A" }}>-Ti</span></div>
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
          variables: { colorPrimary: "#2A3CD6" },
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
        try {
          const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) { const me = await meRes.json(); if (me?.role) role = me.role; }
        } catch { /* keep Clerk role as fallback */ }

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
        qc.invalidateQueries();
      } catch {
        // Silent — backend still has the demo + DB fallbacks. The ErrorBoundary
        // upstairs will surface any actual crash.
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, clerkUser, session, qc]);

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
      <Route path="/faq"        component={Faq} />

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
      <Route path="/admin/faq"              component={AdminFaq} />

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

export default function App() {
  return (
    <WouterRouter base={basePath}>
      {clerkPubKey ? <ClerkApp /> : <NoClerkApp />}
    </WouterRouter>
  );
}
