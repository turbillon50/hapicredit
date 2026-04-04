import { Layout } from "@/components/layout/Layout";
import { getGetCollectionTrendQueryKey, useGetCollectionTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminReports() {
  const { data: trendData, isLoading } = useGetCollectionTrend(
    { query: { queryKey: getGetCollectionTrendQueryKey() } }
  );

  return (
    <Layout title="Financial Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Collection Trend vs Expected</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center animate-pulse bg-muted rounded">
                <span className="text-muted-foreground">Loading chart...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData || []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="expected" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    strokeWidth={2} 
                    dot={false}
                    name="Expected"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="collected" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    activeDot={{ r: 6 }}
                    name="Collected"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Executive Ranking</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-center p-6 text-muted-foreground text-sm border-t border-border">
              Ranking table data mapping here
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
