import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { getListClientsQueryKey, useListClients } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { RiUserLine, RiSearchLine, RiFilter3Line } from "react-icons/ri";
import { Link } from "wouter";

export default function ExecutiveClients() {
  const { user } = useAuth();
  const { data: clients, isLoading } = useListClients(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListClientsQueryKey({ executiveId: user?.id }) } }
  );

  return (
    <Layout title="My Clients">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground">
            <RiFilter3Line className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {clients?.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <RiUserLine className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.fullName}</p>
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase
                      ${client.status === 'current' ? 'bg-success/10 text-success' : 
                        client.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 
                        client.status === 'at_risk' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {client.status.replace('_', ' ')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {clients?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <RiUserLine className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
