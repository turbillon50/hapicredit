import { Layout } from "@/components/layout/Layout";
import {
  getGetCollectionTrendQueryKey,
  useGetCollectionTrend,
  getGetExecutiveRankingQueryKey,
  useGetExecutiveRanking,
  getGetPortfolioAgingQueryKey,
  useGetPortfolioAging,
} from "@workspace/api-client-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function AdminReports() {
  const { data: trend, isLoading: trendLoading } = useGetCollectionTrend({
    query: { queryKey: getGetCollectionTrendQueryKey() }
  });
  const { data: ranking } = useGetExecutiveRanking({
    query: { queryKey: getGetExecutiveRankingQueryKey() }
  });
  const { data: aging } = useGetPortfolioAging({
    query: { queryKey: getGetPortfolioAgingQueryKey() }
  });

  return (
    <Layout title="Reportes">
      <div className="space-y-4">

        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[13px] font-semibold text-foreground mb-1">Tendencia de cobranza</p>
          <p className="text-[11px] text-muted-foreground mb-4">Cobrado vs esperado por semana</p>
          <div className="h-48">
            {trendLoading ? (
              <div className="w-full h-full bg-secondary rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => fmt(v)}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}
                  />
                  <Line type="monotone" dataKey="expected" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Esperado" />
                  <Line type="monotone" dataKey="collected" stroke="#1a3a6b" strokeWidth={2.5} activeDot={{ r: 5 }} name="Cobrado" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {aging && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-[13px] font-semibold text-foreground mb-1">Antigüedad de cartera</p>
            <p className="text-[11px] text-muted-foreground mb-4">Distribución por días de atraso</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aging} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" fill="#1a3a6b" radius={[4,4,0,0]} name="Clientes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {ranking && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-[13px] font-semibold text-foreground mb-4">Ranking de asesores</p>
            <div className="space-y-3">
              {ranking.map((exec: any, idx: number) => (
                <div key={exec.id} className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-muted-foreground w-5 text-center">#{idx+1}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-foreground">{exec.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((exec.totalCollected ?? 0) / Math.max(...ranking.map((e: any) => e.totalCollected ?? 1))) * 100)}%`,
                            background: "#1a3a6b"
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmt(exec.totalCollected ?? 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
