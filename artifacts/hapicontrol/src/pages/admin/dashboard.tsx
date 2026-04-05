import { Layout } from "@/components/layout/Layout";
import {
  getGetAdminDashboardQueryKey,
  useGetAdminDashboard
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  RiBriefcase4Line, RiFundsLine, RiPercentLine,
  RiLineChartLine, RiGroupLine, RiAlarmWarningLine,
  RiArrowRightSLine, RiFileWarningLine, RiMoneyDollarCircleLine,
} from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { data: d, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  if (isLoading || !d) {
    return (
      <Layout title="HapiControl">
        <div className="space-y-4">
          <div className="h-[200px] rounded-2xl skeleton" />
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-[100px] rounded-2xl skeleton" />)}
          </div>
          <div className="space-y-3">
            {[0,1,2].map(i => <div key={i} className="h-[60px] rounded-2xl skeleton" />)}
          </div>
        </div>
      </Layout>
    );
  }

  const pct = d.expectedToday > 0 ? Math.min(100, (d.collectionToday / d.expectedToday) * 100) : 0;

  return (
    <Layout title="HapiControl">
      <div className="space-y-5">

        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(145deg, #0a1628 0%, #132f5e 55%, #1e4a87 100%)" }}>
          <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full" style={{ background: "radial-gradient(circle, rgba(36,84,163,0.35) 0%, transparent 70%)", transform: "translate(40%,-30%)" }} />
          <div className="p-5 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Cartera activa</p>
            <p className="text-[34px] font-extrabold text-white leading-none tracking-tight">{fmt(d.totalPortfolio)}</p>

            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#34d399" }} />
                <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{d.activeClients} activos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
                <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{d.clientsOverdue + d.clientsDefaulted} mora</span>
              </div>
            </div>

            <div className="mt-5 mb-1">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Cobranza del día</span>
                <span className="text-[11px] font-bold text-white">{fmt(d.collectionToday)} <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: "10px" }}>/ {fmt(d.expectedToday)}</span></span>
              </div>
              <div className="w-full h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #34d399, #10b981)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Mora", value: `${d.delinquencyRate}%`, sub: `${d.clientsDefaulted} vencidos`, icon: RiAlarmWarningLine, color: "#dc2626", bg: "#fef2f2" },
            { label: "Utilidad sem.", value: fmt(d.weeklyUtility), sub: "Esta semana", icon: RiFundsLine, color: "#059669", bg: "#ecfdf5" },
            { label: "Colocación", value: fmt(d.placementThisWeek), sub: "Esta semana", icon: RiMoneyDollarCircleLine, color: "#2454a3", bg: "#eef3fb" },
            { label: "Asesores", value: String(d.totalExecutives), sub: `${d.alertCount} alertas`, icon: RiGroupLine, color: "#7c3aed", bg: "#f5f3ff" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                </div>
                <p className="text-[20px] font-extrabold text-foreground leading-none tracking-tight">{m.value}</p>
                <p className="text-[11px] font-semibold text-foreground/80 mt-1">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Quick nav */}
        <div className="space-y-2">
          {[
            { href: "/admin/portfolio-detail", label: "Cartera detallada", sub: "Saldos, fechas, pagos por cliente", icon: RiBriefcase4Line, accent: "#1a3a6b" },
            { href: "/admin/morosos", label: "Morosos", sub: "Clientes en atraso y vencidos", icon: RiFileWarningLine, accent: "#dc2626" },
            { href: "/admin/financiero", label: "Análisis financiero", sub: "Tasas, utilidad, proyecciones", icon: RiLineChartLine, accent: "#059669" },
            { href: "/admin/executives", label: "Ranking de asesores", sub: "Desempeño y cobranza", icon: RiGroupLine, accent: "#7c3aed" },
            { href: "/admin/caja", label: "Control de caja", sub: "Flujo por asesor", icon: RiFundsLine, accent: "#b45309" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="bg-white rounded-2xl px-4 py-3.5 shadow-card flex items-center justify-between active:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.accent}10` }}>
                      <Icon className="w-[18px] h-[18px]" style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground leading-tight">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <RiArrowRightSLine className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
