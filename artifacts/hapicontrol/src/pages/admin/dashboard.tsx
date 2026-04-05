import { Layout } from "@/components/layout/Layout";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { StatCard } from "@/components/hapi/StatCard";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonCard, SkeletonHero } from "@/components/hapi/Skeleton";
import {
  RiPercentLine, RiMoneyDollarCircleLine, RiAddCircleLine,
  RiGroupLine, RiArrowRightSLine, RiFileListLine,
  RiAlarmWarningLine, RiLineChartLine,
} from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const ACCESOS = [
  { path: "/admin/cartera",    icon: <RiFileListLine />,     label: "Cartera detallada",     sub: "Saldos, fechas, pagos por cliente",      color: "#dbeafe", ic: "#1e40af" },
  { path: "/admin/morosos",    icon: <RiAlarmWarningLine />, label: "Morosos",                sub: "Clientes en atraso y vencidos",           color: "#fee2e2", ic: "#991b1b" },
  { path: "/admin/financiero", icon: <RiLineChartLine />,    label: "Análisis financiero",    sub: "Tasas, utilidad, proyecciones",           color: "#d1fae5", ic: "#065f46" },
  { path: "/admin/asesores",   icon: <RiGroupLine />,        label: "Ranking de asesores",    sub: "Desempeño y cobranza por ejecutivo",      color: "#f3e8ff", ic: "#6d28d9" },
];

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard({ query: {} });
  const d = data as any;

  const collectPct = d ? Math.min(100, (d.collectionToday / Math.max(1, d.expectedToday)) * 100) : 0;
  const moraPct    = d ? d.delinquencyRate ?? (d.clientsOverdue / Math.max(1, d.activeClients)) * 100 : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Hero */}
        {isLoading ? (
          <div className="mx-4 mt-2"><SkeletonHero /></div>
        ) : (
          <div className="mx-4 mt-2">
            <div className="hero-gradient rounded-2xl p-5 text-white">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-60">
                Cartera activa
              </div>
              <div className="text-4xl font-bold tracking-tight leading-none mb-1 fade-up">
                {fmt(d?.totalPortfolio ?? 0)}
              </div>
              <div className="flex items-center gap-3 mt-3 mb-4">
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                  {d?.activeClients ?? 0} activos
                </span>
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />
                  {d?.clientsOverdue ?? 0} mora
                </span>
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
                  {d?.clientsDefaulted ?? 0} vencidos
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs opacity-70 mb-1.5">
                  <span>Cobranza del día</span>
                  <span>{fmt(d?.collectionToday ?? 0)} / {fmt(d?.expectedToday ?? 0)}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${collectPct}%`, background: collectPct >= 80 ? "#10b981" : collectPct >= 50 ? "#f59e0b" : "#ef4444" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            <StatCard
              icon={<RiPercentLine />}
              iconBg="rgba(239,68,68,0.1)"
              iconColor="var(--danger)"
              label="Índice de mora"
              value={`${moraPct.toFixed(1)}%`}
              subLabel={`${d?.clientsOverdue ?? 0} clientes`}
            />
            <StatCard
              icon={<RiMoneyDollarCircleLine />}
              iconBg="rgba(16,185,129,0.1)"
              iconColor="var(--success)"
              label="Utilidad semanal"
              value={fmt(d?.profitThisWeek ?? 0)}
              subLabel="Esta semana"
            />
            <StatCard
              icon={<RiAddCircleLine />}
              iconBg="rgba(37,99,235,0.1)"
              iconColor="var(--accent)"
              label="Colocación semanal"
              value={fmt(d?.placementThisWeek ?? 0)}
              subLabel="Esta semana"
            />
            <StatCard
              icon={<RiGroupLine />}
              iconBg="rgba(109,40,217,0.1)"
              iconColor="#7c3aed"
              label="Asesores activos"
              value={d?.totalActiveExecutives ?? 0}
              subLabel={`${d?.executivesWithAlerts ?? 0} con alertas`}
            />
          </div>
        )}

        {/* Quick access */}
        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Accesos rápidos
          </div>
          <div className="flex flex-col gap-2">
            {ACCESOS.map(a => (
              <Link key={a.path} href={a.path} className="card flex items-center gap-4 py-4 px-4 pressable">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: a.color, color: a.ic }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-gray-900">{a.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.sub}</div>
                </div>
                <RiArrowRightSLine className="text-gray-400 text-xl shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
