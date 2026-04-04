import { Layout } from "@/components/layout/Layout";
import { useGetExecutiveRanking } from "@workspace/api-client-react";
import { RiMedalLine, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function AdminExecutives() {
  const { data: ranking, isLoading } = useGetExecutiveRanking({ query: {} });

  const medalColors = ["#f59e0b", "#94a3b8", "#b87333"];

  return (
    <Layout title="Asesores">
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : ranking?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <p className="text-[13px] text-muted-foreground">Sin datos de asesores</p>
          </div>
        ) : (
          ranking?.map((exec: any, idx: number) => (
            <div key={exec.id} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#eef3fb" }}>
                  {idx < 3 ? (
                    <RiMedalLine className="w-5 h-5" style={{ color: medalColors[idx] }} />
                  ) : (
                    <span className="text-[13px] font-bold text-muted-foreground">#{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-foreground">{exec.fullName}</p>
                    <span className="text-[11px] font-medium text-muted-foreground">#{idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-[12px] font-bold text-foreground">{exec.totalClients}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Clientes</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-[12px] font-bold text-success">{fmt(exec.totalCollected ?? 0)}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Cobrado</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-[12px] font-bold ${exec.overdueClients > 0 ? "text-destructive" : "text-foreground"}`}>
                        {exec.overdueClients}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">En atraso</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
