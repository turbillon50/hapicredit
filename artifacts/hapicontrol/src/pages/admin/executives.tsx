import { Layout } from "@/components/layout/Layout";
import { getListUsersQueryKey, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { RiUserStarLine, RiMailLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";

export default function AdminExecutives() {
  const { data: users, isLoading } = useListUsers(
    { query: { queryKey: getListUsersQueryKey() } }
  );

  const executives = users?.filter(u => u.role === 'executive') || [];

  return (
    <Layout title="Executive Staff">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="default">Add Executive</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {executives.map(exec => (
              <Card key={exec.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <RiUserStarLine className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{exec.fullName}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <RiMailLine className="mr-1" /> {exec.email || exec.username}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${exec.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {exec.isActive ? 'Active' : 'Inactive'}
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
