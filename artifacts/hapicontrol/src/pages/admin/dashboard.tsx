import { Layout } from "@/components/layout/Layout";
import {
  getGetAdminDashboardQueryKey,
  useGetAdminDashboard
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  RiBriefcase4Line,
  RiFundsLine,
  RiPercentLine,
  RiLineChartLine,
  RiGroupLine,
  RiErrorWarningLine,
  RiArrowRightLine,
} from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1 }).format(n / 100);

export default function AdminDashboard() {
  const { data: d, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  if (isLoading || !d) {
    return (
      <Layout title="Panel Administrativo">
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-white rounded-2xl shadow-card" />
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl shadow-card" />)}
          </div>
        </div>
      </Layout>
    );
  }

  const pct = d.expectedToday > 0 ? Math.min(100, (d.collectionToday / d.expectedToday) * 100) : 0;

  const metrics = [
    { label: "Cobranza hoy", value: fmt(d.collectionToday), sub: `de ${fmt(d.expectedToday)}`, icon: RiFundsLine, color: "#15803d", bg: "#f0fdf4" },
    { label: "Índice de mora", value: fmtPct(d.delinquencyRate), sub: `${d.clientsDefaulted} vencidos`, icon: RiPercentLine, color: "#dc2626", bg: "#fef2f2" },
    { label: "Utilidad semanal", value: fmt(d.weeklyUtility), sub: "Generada esta semana", icon: RiLineChartLine, color: "#2454a3", bg: "#eef3fb" },
    { label: "Asesores activos", value: String(d.totalExecutives), sub: "En operación", icon: RiGroupLine, color: "#7c3aed", bg: "#f5f3ff" },
  ];

  return (
    <Layout title="Panel Administrativo">
      <div className="space-y-4">

        <div className="rounded-2xl p-5 shadow-card-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 60%, #2454a3 100%)" }}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-8" style={{ background: "rgba(255,255,255,0.25)" }} />

          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Cartera Total</p>
              <p className="text-[30px] font-bold text-white leading-tight">{fmt(d.totalPortfolio)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mt-1" style={{ background: "rgba(255,255,255,0.12)" }}>
              <RiBriefcase4Line className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{d.activeClients} al corriente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{d.clientsOverdue} en atraso</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span>Cobrado hoy</span>
              <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#34d399" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <p className="text-[18px] font-bold text-foreground leading-tight">{m.value}</p>
                <p className="text-[10px] font-semibold text-foreground/70 mt-0.5">{m.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { href: "/admin/clients", label: "Ver toda la cartera", sub: "Clientes y estatus por ejecutivo", icon: RiBriefcase4Line },
            { href: "/admin/executives", label: "Ranking de asesores", sub: "Colocación, cobranza y mora", icon: RiGroupLine },
            { href: "/admin/caja", label: "Control de caja", sub: "Flujo por asesor", icon: RiFundsLine },
            { href: "/admin/reports", label: "Reportes y análisis", sub: "Tendencias y proyecciones", icon: RiLineChartLine },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="bg-white rounded-2xl p-4 shadow-card flex items-center justify-between active:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                  <RiArrowRightLine className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
