import { Layout } from "@/components/layout/Layout";
import { getListClientsQueryKey, useListClients } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { RiUserLine, RiSearchLine } from "react-icons/ri";

export default function AdminClients() {
  const { data: clients, isLoading } = useListClients(
    {},
    { query: { queryKey: getListClientsQueryKey() } }
  );

  return (
    <Layout title="All Clients (Admin)">
      <div className="space-y-4">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search all clients..." 
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {clients?.map(client => (
              <Card key={client.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <RiUserLine className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{client.fullName}</p>
                      <p className="text-xs text-muted-foreground">Exec: {client.executiveName || 'Unassigned'}</p>
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
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
