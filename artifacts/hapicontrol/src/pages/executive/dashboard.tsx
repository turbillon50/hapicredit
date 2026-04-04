import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { 
  getGetExecutiveDashboardQueryKey, 
  useGetExecutiveDashboard 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RiTeamLine, 
  RiAlarmWarningLine, 
  RiMoneyDollarCircleLine, 
  RiWallet3Line, 
  RiCalendarCheckLine
} from "react-icons/ri";

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading } = useGetExecutiveDashboard(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getGetExecutiveDashboardQueryKey({ executiveId: user?.id }) } }
  );

  if (isLoading || !dashboard) {
    return (
      <Layout title="Dashboard">
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

  return (
    <Layout title={`Hello, ${user?.fullName.split(' ')[0]}`}>
      <div className="space-y-6">
        {/* Main Status Card */}
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RiWallet3Line className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Today's Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatCurrency(dashboard.totalCollectedToday)}
            </div>
            <p className="text-sm mt-1 text-primary-foreground/80">
              of {formatCurrency(dashboard.totalExpectedToday)} expected
            </p>
            <div className="mt-4 w-full bg-primary-foreground/20 rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full" 
                style={{ width: `${Math.min(100, (dashboard.totalCollectedToday / Math.max(1, dashboard.totalExpectedToday)) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                <RiTeamLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard.clientsDueToday}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2 bg-red-50 text-red-600 rounded-full">
                <RiAlarmWarningLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard.clientsOverdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-full">
                <RiCalendarCheckLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard.pendingPromises}</p>
                <p className="text-xs text-muted-foreground">Promises</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                <RiMoneyDollarCircleLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(dashboard.cashOnHand)}</p>
                <p className="text-xs text-muted-foreground">Cash on Hand</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Summary if any */}
        {dashboard.alertCount > 0 && (
          <Card className="border-warning/50 bg-warning/5 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-warning/20 text-warning rounded-full">
                  <RiAlarmWarningLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Action Required</p>
                  <p className="text-sm text-muted-foreground">You have {dashboard.alertCount} pending alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
