import { Layout } from "@/components/layout/Layout";
import { 
  getGetAdminDashboardQueryKey, 
  useGetAdminDashboard 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RiBriefcase4Line, 
  RiFundsLine, 
  RiPercentLine, 
  RiLineChartLine,
  RiGroupLine,
  RiErrorWarningLine
} from "react-icons/ri";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  if (isLoading || !dashboard) {
    return (
      <Layout title="Admin Overview">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded-xl"></div>
            <div className="h-24 bg-muted rounded-xl"></div>
            <div className="h-24 bg-muted rounded-xl"></div>
            <div className="h-24 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatPercent = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100);
  };

  return (
    <Layout title="Admin Overview">
      <div className="space-y-6">
        
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RiBriefcase4Line className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatCurrency(dashboard.totalPortfolio)}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-primary-foreground/80">
              <span>{dashboard.activeClients} Active Clients</span>
              <span className="flex items-center"><RiErrorWarningLine className="mr-1"/> {dashboard.clientsOverdue} Overdue</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                <RiFundsLine className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium uppercase tracking-wider">Collection Today</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(dashboard.collectionToday)}</p>
              <p className="text-xs text-muted-foreground">of {formatCurrency(dashboard.expectedToday)} expected</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                <RiPercentLine className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium uppercase tracking-wider">Delinquency</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatPercent(dashboard.delinquencyRate)}</p>
              <p className="text-xs text-muted-foreground">{dashboard.clientsDefaulted} defaulted</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                <RiLineChartLine className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium uppercase tracking-wider">Weekly Utility</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(dashboard.weeklyUtility)}</p>
              <p className="text-xs text-success flex items-center"><RiLineChartLine className="w-3 h-3 mr-1"/> Trending</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                <RiGroupLine className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium uppercase tracking-wider">Executives</span>
              </div>
              <p className="text-xl font-bold text-foreground">{dashboard.totalExecutives}</p>
              <p className="text-xs text-muted-foreground">Active Staff</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
