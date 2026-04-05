import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Login from "@/pages/auth/login";
import NotFound from "@/pages/not-found";

import AdminDashboard    from "@/pages/admin/dashboard";
import AdminCartera      from "@/pages/admin/cartera";
import AdminMorosos      from "@/pages/admin/morosos";
import AdminAsesores     from "@/pages/admin/executives";
import AdminFinanciero   from "@/pages/admin/financiero";
import AdminSolicitudes  from "@/pages/admin/solicitudes";
import AdminExpediente   from "@/pages/admin/expediente";

import ExecutiveDashboard  from "@/pages/executive/dashboard";
import ExecutiveClients    from "@/pages/executive/clients";
import ExecutiveCobrar     from "@/pages/executive/cobrar";
import AltaCliente         from "@/pages/executive/alta-cliente";
import ExecutiveComisiones from "@/pages/executive/comisiones";

import ClientPortal      from "@/pages/portal/index";
import ClientSolicitar   from "@/pages/portal/solicitar";

import Registro from "@/pages/public/registro";

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
      <Route path="/">
        <Redirect to="/admin" />
      </Route>
      <Route path="/login" component={Login} />

      {/* ─── Public ─── */}
      <Route path="/registro" component={Registro} />

      {/* ─── Admin ─── */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/cartera">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminCartera />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/solicitudes">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminSolicitudes />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/expediente/:id">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminExpediente />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/morosos">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminMorosos />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/asesores">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminAsesores />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financiero">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminFinanciero />
        </ProtectedRoute>
      </Route>

      {/* ─── Executive ─── */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/clientes">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveClients />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cobrar">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveCobrar />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/expediente/:id">
        <ProtectedRoute allowedRoles={["executive", "admin"]}>
          <AdminExpediente />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/alta-cliente">
        <ProtectedRoute allowedRoles={["executive", "admin"]}>
          <AltaCliente />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/comisiones">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveComisiones />
        </ProtectedRoute>
      </Route>

      {/* ─── Client ─── */}
      <Route path="/portal">
        <ProtectedRoute allowedRoles={["client"]}>
          <ClientPortal />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/solicitar">
        <ProtectedRoute allowedRoles={["client"]}>
          <ClientSolicitar />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/expediente">
        <ProtectedRoute allowedRoles={["client"]}>
          <ClientPortal />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}
