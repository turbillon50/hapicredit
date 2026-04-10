import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";

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

import ExecDashboard    from "@/pages/executive/dashboard";
import ExecCobrar       from "@/pages/executive/cobrar";
import ExecAltaCliente  from "@/pages/executive/alta-cliente";
import ExecClients      from "@/pages/executive/clients";
import ExecClientDetail from "@/pages/executive/client-detail";
import ExecPaymentsNew  from "@/pages/executive/payments-new";
import ExecComisiones   from "@/pages/executive/comisiones";
import ExecAlerts       from "@/pages/executive/alerts";
import ExecCommitments  from "@/pages/executive/commitments";

import Privacidad       from "@/pages/privacidad";
import Terminos         from "@/pages/terminos";
import NotFound         from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
      {/* Public */}
      <Route path="/"           component={Home} />
      <Route path="/registro"   component={Registro} />
      <Route path="/login"      component={Login} />
      <Route path="/privacidad" component={Privacidad} />
      <Route path="/terminos"   component={Terminos} />

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

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}
