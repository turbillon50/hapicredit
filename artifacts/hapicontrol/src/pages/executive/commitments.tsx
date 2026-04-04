import { Layout } from "@/components/layout/Layout";
import { getListCommitmentsQueryKey, useListCommitments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { RiCalendarCheckLine, RiErrorWarningLine, RiCheckDoubleLine, RiUserLine } from "react-icons/ri";

export default function ExecutiveCommitments() {
  const { user } = useAuth();
  
  const { data: commitments, isLoading } = useListCommitments(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListCommitmentsQueryKey({ executiveId: user?.id }) } }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'text-success bg-success/10';
      case 'broken': return 'text-destructive bg-destructive/10';
      default: return 'text-warning bg-warning/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <RiCheckDoubleLine className="w-5 h-5" />;
      case 'broken': return <RiErrorWarningLine className="w-5 h-5" />;
      default: return <RiCalendarCheckLine className="w-5 h-5" />;
    }
  };

  return (
    <Layout title="Payment Promises">
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        ) : commitments?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RiCalendarCheckLine className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No commitments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commitments?.map(commitment => (
              <Card key={commitment.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(commitment.status)}`}>
                      {getStatusIcon(commitment.status)}
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1 text-foreground">
                        <RiUserLine /> {commitment.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Promised: ${commitment.promisedAmount} on {new Date(commitment.promisedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${getStatusColor(commitment.status)}`}>
                    {commitment.status}
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
