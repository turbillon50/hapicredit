import { Layout } from "@/components/layout/Layout";
import { useGetCajaSummary } from "@workspace/api-client-react";
import { IconCaja, IconCrecimiento, IconFlechaAbajo } from "@/components/hapi/HapiIcons";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function AdminCaja() {
  const { data: summary, isLoading } = useGetCajaSummary({ query: {} });

  return (
    <Layout title="Control de Caja">
      <div className="space-y-4">

        {summary && (
          <div className="rounded-2xl p-5 shadow-card-md" style={{ background: "linear-gradient(135deg, #0f1f3d, #1a3a6b)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Total en caja</p>
            <p className="text-[32px] font-bold text-white">{fmt(summary.totalCash ?? 0)}</p>
            <div className="mt-3 flex gap-5">
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Cobrado hoy</p>
                <p className="text-[14px] font-semibold text-white">{fmt(summary.collectedToday ?? 0)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Esta semana</p>
                <p className="text-[14px] font-semibold text-white">{fmt(summary.collectedWeek ?? 0)}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : (
          summary?.executives?.map((exec: any) => (
            <div key={exec.id} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <IconCaja size={18} color="var(--accent)" />
                </div>
                <p className="text-[13px] font-semibold text-foreground">{exec.fullName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[13px] font-bold text-success">{fmt(exec.cashOnHand ?? 0)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">En caja</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-[13px] font-bold text-foreground">{fmt(exec.totalDeposited ?? 0)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Cobrado</p>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-primary">{fmt(exec.totalDisbursed ?? 0)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Otorgado</p>
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </Layout>
  );
}
