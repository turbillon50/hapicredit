import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import PublicLanding from "@/pages/index";

import ClientPortal from "@/pages/portal/index";

import ExecutiveDashboard from "@/pages/executive/dashboard";
import ExecutiveClients from "@/pages/executive/clients";
import ExecutiveClientNew from "@/pages/executive/client-new";
import ExecutiveClientDetail from "@/pages/executive/client-detail";
import ExecutivePaymentsNew from "@/pages/executive/payments-new";
import ExecutiveCommitments from "@/pages/executive/commitments";
import ExecutiveAlerts from "@/pages/executive/alerts";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminClients from "@/pages/admin/clients";
import AdminExecutives from "@/pages/admin/executives";
import AdminCaja from "@/pages/admin/caja";
import AdminReports from "@/pages/admin/reports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicLanding} />
      <Route path="/login" component={Login} />

      {/* Client Portal */}
      <Route path="/portal">
        <ProtectedRoute allowedRoles={["client"]}>
          <ClientPortal />
        </ProtectedRoute>
      </Route>

      {/* Executive Routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveClients />
        </ProtectedRoute>
      </Route>
      <Route path="/clients/new">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveClientNew />
        </ProtectedRoute>
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveClientDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/payments/new">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutivePaymentsNew />
        </ProtectedRoute>
      </Route>
      <Route path="/commitments">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveCommitments />
        </ProtectedRoute>
      </Route>
      <Route path="/alerts">
        <ProtectedRoute allowedRoles={["executive"]}>
          <ExecutiveAlerts />
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminClients />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/executives">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminExecutives />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/caja">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminCaja />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminReports />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
