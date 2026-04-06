import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home             from "@/pages/home";
import Solicitar        from "@/pages/solicitar";
import MiCredito        from "@/pages/mi-credito";
import Perfil           from "@/pages/perfil";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Client */}
      <Route path="/"           component={Home} />
      <Route path="/solicitar"  component={Solicitar} />
      <Route path="/mi-credito" component={MiCredito} />
      <Route path="/perfil"     component={Perfil} />

      {/* Admin */}
      <Route path="/admin"                component={AdminDashboard} />
      <Route path="/admin/solicitudes"    component={AdminSolicitudes} />
      <Route path="/admin/cartera"        component={AdminCartera} />
      <Route path="/admin/morosos"        component={AdminMorosos} />
      <Route path="/admin/asesores"       component={AdminAsesores} />
      <Route path="/admin/financiero"       component={AdminFinanciero} />
      <Route path="/admin/validar-pagos"   component={AdminValidarPagos} />
      <Route path="/admin/caja"            component={AdminCaja} />
      <Route path="/admin/movimientos/:id" component={AdminMovimientos} />
      <Route path="/admin/arbol"           component={AdminArbol} />
      <Route path="/admin/expediente/:id"  component={AdminExpediente} />

      {/* Legacy redirects */}
      <Route path="/login"><Redirect to="/" /></Route>
      <Route path="/portal"><Redirect to="/mi-credito" /></Route>
      <Route path="/dashboard"><Redirect to="/admin" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}
