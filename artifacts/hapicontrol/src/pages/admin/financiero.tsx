import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import {
  RiLineChartLine, RiMoneyDollarCircleLine,
  RiPercentLine, RiTeamLine, RiArrowUpLine,
} from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

type FinancialSummary = {
  totalPrincipalPlaced: number;
  totalRecovered: number;
  totalLostToDefault: number;
  totalInterestExpected: number;
  totalInterestFromCompleted: number;
  totalOpeningFees: number;
  totalLateFees: number;
  avgInterestRate: number;
  weeklyInterestIncome: number;
  monthlyInterestIncome: number;
  annualProjection: number;
  activeCredits: number;
  completedCredits: number;
  defaultedCredits: number;
  execBreakdown: {
    executiveId: number; executiveName: string; totalClients: number;
    overdueClients: number; portfolio: number; placed: number;
    collected: number; interestGenerated: number; weeklyIncome: number;
    collectionRate: number;
  }[];
};

export default function AdminFinanciero() {
  const { data: d, isLoading } = useQuery<FinancialSummary>({
    queryKey: ["admin-financial-summary"],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/admin/financial-summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hapi_token")}` }
      });
      if (!r.ok) throw new Error("No autorizado");
      return r.json();
    },
  });

  if (isLoading || !d) {
    return (
      <Layout title="Análisis Financiero" back="/admin">
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl shadow-card" />)}
        </div>
      </Layout>
    );
  }

  const recoveryRate = d.totalPrincipalPlaced > 0
    ? Math.round((d.totalRecovered / d.totalPrincipalPlaced) * 100 * 10) / 10
    : 0;

  return (
    <Layout title="Análisis Financiero" back="/admin">
      <div className="space-y-4">

        {/* Income projection hero */}
        <div className="rounded-2xl p-5 shadow-card-md" style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            Ingreso semanal proyectado
          </p>
          <p className="text-[32px] font-bold text-white leading-none">{fmt(d.weeklyInterestIncome)}</p>
          <div className="mt-3 flex gap-5">
            <div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>Mensual</p>
              <p className="text-[15px] font-semibold text-white">{fmt(d.monthlyInterestIncome)}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>Anual proyectado</p>
              <p className="text-[15px] font-semibold text-white">{fmt(d.annualProjection)}</p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Tasa promedio", value: `${d.avgInterestRate}%`, icon: RiPercentLine, color: "#2454a3", bg: "#eef3fb", sub: "por crédito" },
            { label: "Tasa de recuperación", value: `${recoveryRate}%`, icon: RiLineChartLine, color: "#059669", bg: "#f0fdf4", sub: "principal" },
            { label: "Intereses esperados", value: fmt(d.totalInterestExpected), icon: RiMoneyDollarCircleLine, color: "#7c3aed", bg: "#f5f3ff", sub: "cartera activa" },
            { label: "Comisiones apertura", value: fmt(d.totalOpeningFees), icon: RiArrowUpLine, color: "#b45309", bg: "#fffbeb", sub: "acumuladas" },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-2xl shadow-card p-4">
                <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <p className="text-[16px] font-bold text-foreground leading-none">{m.value}</p>
                <p className="text-[10px] font-semibold text-foreground/70 mt-1">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Portfolio summary */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Resumen de cartera</p>
          <div className="space-y-3">
            {[
              { label: "Capital colocado total", value: fmt(d.totalPrincipalPlaced), color: "#1a3a6b" },
              { label: "Capital recuperado", value: fmt(d.totalRecovered), color: "#059669" },
              { label: "Multas/recargos cobrados", value: fmt(d.totalLateFees), color: "#b45309" },
              { label: "Pérdidas por incumplimiento", value: fmt(d.totalLostToDefault), color: "#dc2626" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-[13px] text-foreground">{item.label}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex gap-4 text-center">
            {[
              { label: "Créditos activos", value: d.activeCredits },
              { label: "Completados", value: d.completedCredits },
              { label: "En mora", value: d.defaultedCredits },
            ].map(s => (
              <div key={s.label} className="flex-1">
                <p className="text-[18px] font-bold text-foreground">{s.value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-executive breakdown */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Utilidad por asesor</p>
          <div className="space-y-4">
            {d.execBreakdown.map((exec, idx) => (
              <div key={exec.executiveId}>
                {idx > 0 && <div className="border-t border-border mb-4" />}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{exec.executiveName}</p>
                    <p className="text-[10px] text-muted-foreground">{exec.totalClients} clientes · {exec.overdueClients} en atraso</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-success">{fmt(exec.weeklyIncome)}/sem</p>
                    <p className="text-[10px] text-muted-foreground">ingreso estimado</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded-xl p-2">
                    <p className="text-[11px] font-bold text-primary">{fmt(exec.portfolio)}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Cartera</p>
                  </div>
                  <div className="bg-background rounded-xl p-2">
                    <p className="text-[11px] font-bold text-success">{fmt(exec.collected)}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Cobrado</p>
                  </div>
                  <div className="bg-background rounded-xl p-2">
                    <p className="text-[11px] font-bold text-foreground">{exec.collectionRate}%</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Recuperación</p>
                  </div>
                </div>
                {/* Collection rate bar */}
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, exec.collectionRate)}%`, background: exec.collectionRate >= 80 ? "#059669" : exec.collectionRate >= 60 ? "#f59e0b" : "#dc2626" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
