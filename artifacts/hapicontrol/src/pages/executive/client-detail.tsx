import { Layout } from "@/components/layout/Layout";
import { useParams } from "wouter";
import { getGetClientQueryKey, useGetClient } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiUserLine, RiPhoneLine, RiMapPinLine } from "react-icons/ri";

export default function ExecutiveClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);
  
  const { data: client, isLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) }
  });

  if (isLoading || !client) {
    return (
      <Layout title="Client Details">
        <div className="space-y-4 animate-pulse p-4">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Client Profile">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <RiUserLine className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold">{client.fullName}</h2>
            <div className="inline-flex mt-2 px-2 py-1 rounded text-xs font-medium uppercase bg-success/10 text-success">
              {client.status.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <RiPhoneLine className="text-muted-foreground w-5 h-5" />
              <span>{client.phone}</span>
            </div>
            {client.address && (
              <div className="flex items-center space-x-3 text-sm">
                <RiMapPinLine className="text-muted-foreground w-5 h-5" />
                <span>{client.address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
