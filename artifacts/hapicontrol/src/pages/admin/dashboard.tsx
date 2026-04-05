import { Layout } from "@/components/layout/Layout";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatCard } from "@/components/hapi/StatCard";
import { SkeletonCard, SkeletonHero } from "@/components/hapi/Skeleton";
import {
  IconAlerta, IconMoneda, IconDesembolso, IconGrupo, IconFlecha,
  IconValidar, IconBandeja, IconCartera, IconFinanzas, IconCaja,
  IconMedalla, IconArbol,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const ACCESOS = [
  { path: "/admin/validar-pagos", icon: <IconValidar size={20} />,  label: "Validar pagos",         sub: "Pagos pendientes de aprobacion",          color: "#fef3c7", ic: "#92400e" },
  { path: "/admin/solicitudes",   icon: <IconBandeja size={20} />,  label: "Solicitudes",            sub: "Afiliaciones y creditos pendientes",      color: "#dbeafe", ic: "#1e40af" },
  { path: "/admin/cartera",       icon: <IconCartera size={20} />,  label: "Cartera detallada",      sub: "Saldos, fechas, pagos por cliente",       color: "#e0e7ff", ic: "#3730a3" },
  { path: "/admin/morosos",       icon: <IconAlerta size={20} />,   label: "Morosos y multas",       sub: "Clientes en atraso, $200/dia multa",      color: "#fee2e2", ic: "#991b1b" },
  { path: "/admin/financiero",    icon: <IconFinanzas size={20} />, label: "Analisis financiero",    sub: "Utilidad, flujo de caja, proyecciones",   color: "#d1fae5", ic: "#065f46" },
  { path: "/admin/asesores",      icon: <IconMedalla size={20} />,  label: "Ranking de asesores",    sub: "Colocacion, cobranza, desempeno",         color: "#f3e8ff", ic: "#6d28d9" },
  { path: "/admin/caja",          icon: <IconCaja size={20} />,     label: "Control de caja",        sub: "Cobros, desembolsos y diferencias",       color: "#fef9c3", ic: "#854d0e" },
  { path: "/admin/arbol",         icon: <IconArbol size={20} />,    label: "Mi Red de Asesores",     sub: "Mapa de arbol interactivo",               color: "#e0f2fe", ic: "#0369a1" },
];

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard({ query: {} });
  const d = data as any;

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["pending-validation"],
    queryFn: () => fetch(`${API}/payments/pending-validation`, { headers: auth() }).then(r => r.json()),
  });

  const collectPct = d ? Math.min(100, (d.collectionToday / Math.max(1, d.expectedToday)) * 100) : 0;
  const moraPct    = d ? d.delinquencyRate ?? 0 : 0;
  const pendingCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

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
              <div className="flex items-center gap-3 mt-3 mb-1 flex-wrap">
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                  {d?.clientsCurrent ?? d?.activeClients ?? 0} al corriente
                </span>
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />
                  {d?.clientsAtRisk ?? 0} riesgo
                </span>
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />
                  {d?.clientsOverdue ?? 0} mora
                </span>
                <span className="text-xs opacity-70">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
                  {d?.clientsDefaulted ?? 0} vencidos
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs opacity-70 mb-1.5">
                  <span>Cobranza del dia</span>
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

        {pendingCount > 0 && (
          <Link href="/admin/validar-pagos" className="mx-4">
            <div className="rounded-2xl p-4 flex items-center gap-4 pressable" style={{ background: "#fef3c7", border: "2px solid #fbbf24" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b" }}>
                <IconValidar size={22} color="#fff" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-yellow-900">{pendingCount} pago{pendingCount !== 1 ? "s" : ""} por validar</div>
                <div className="text-xs text-yellow-700">Requieren tu aprobacion antes de aplicarse</div>
              </div>
              <IconFlecha size={18} color="#ca8a04" />
            </div>
          </Link>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 px-4">
              <StatCard
                icon={<IconAlerta size={18} />}
                iconBg="rgba(239,68,68,0.1)"
                iconColor="var(--danger)"
                label="Indice de mora"
                value={`${moraPct.toFixed(1)}%`}
                subLabel={`${(d?.clientsOverdue ?? 0) + (d?.clientsDefaulted ?? 0)} clientes`}
              />
              <StatCard
                icon={<IconMoneda size={18} />}
                iconBg="rgba(16,185,129,0.1)"
                iconColor="var(--success)"
                label="Utilidad semanal"
                value={fmt(d?.profitThisWeek ?? 0)}
                subLabel="Esta semana"
              />
              <StatCard
                icon={<IconDesembolso size={18} />}
                iconBg="rgba(37,99,235,0.1)"
                iconColor="var(--accent)"
                label="Colocacion mes"
                value={fmt(d?.placementThisMonth ?? 0)}
                subLabel={`Semana: ${fmt(d?.placementThisWeek ?? 0)}`}
              />
              <StatCard
                icon={<IconGrupo size={18} />}
                iconBg="rgba(109,40,217,0.1)"
                iconColor="#7c3aed"
                label="Asesores activos"
                value={d?.totalActiveExecutives ?? 0}
                subLabel={`${d?.executivesWithAlerts ?? 0} con alertas`}
              />
            </div>

            <div className="mx-4 rounded-2xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <div className="px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ background: "#f9fafb" }}>
                Flujo de efectivo
              </div>
              <div className="p-4 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cobranza semana</span>
                  <span className="font-bold text-green-600">+{fmt(d?.collectionWeek ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Desembolsos semana</span>
                  <span className="font-bold text-red-500">-{fmt(d?.disbursementsWeek ?? 0)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 my-0.5" />
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">Flujo neto semana</span>
                  <span className={`font-extrabold ${(d?.netFlowWeek ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fmt(d?.netFlowWeek ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Multas acumuladas</span>
                  <span className="font-bold text-orange-600">{fmt(d?.totalLateFees ?? 0)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Control y gestion
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
                <IconFlecha size={16} color="#9ca3af" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
