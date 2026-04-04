import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { getListAlertsQueryKey, useListAlerts, useResolveAlert } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RiAlarmWarningLine, 
  RiCheckDoubleLine, 
  RiTimeLine,
  RiUserLine,
  RiMoneyDollarCircleLine,
  RiErrorWarningLine
} from "react-icons/ri";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ExecutiveAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useListAlerts(
    { executiveId: user?.id, resolved: "false" },
    { query: { enabled: !!user?.id, queryKey: getListAlertsQueryKey({ executiveId: user?.id, resolved: "false" }) } }
  );

  const resolveAlert = useResolveAlert();

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ executiveId: user?.id, resolved: "false" }) });
      toast({ title: "Alert resolved" });
    } catch (error) {
      toast({ title: "Failed to resolve alert", variant: "destructive" });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'due_today': return <RiTimeLine className="w-5 h-5" />;
      case 'overdue': return <RiAlarmWarningLine className="w-5 h-5" />;
      case 'broken_promise': return <RiErrorWarningLine className="w-5 h-5" />;
      default: return <RiAlarmWarningLine className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <Layout title="Smart Alerts">
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
        ) : alerts?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RiCheckDoubleLine className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
            <p>All caught up! No pending alerts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts?.map(alert => (
              <Card key={alert.id} className={`border ${getSeverityColor(alert.severity).split(' ')[2]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getSeverityColor(alert.severity).split(' ').slice(0,2).join(' ')}`}>
                      {getAlertIcon(alert.alertType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{alert.message}</p>
                      {alert.clientName && (
                        <p className="text-xs flex items-center text-muted-foreground mt-1">
                          <RiUserLine className="mr-1" /> {alert.clientName}
                        </p>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
