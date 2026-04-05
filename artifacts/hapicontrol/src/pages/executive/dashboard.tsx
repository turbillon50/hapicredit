import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetExecutiveDashboard } from "@workspace/api-client-react";
import { SkeletonHero, SkeletonCard } from "@/components/hapi/Skeleton";
import { Badge } from "@/components/hapi/Badge";
import { Link } from "wouter";
import {
  IconGrupo, IconAlerta, IconMoneda, IconCalendario,
  IconFlecha, IconPersona, IconMas, IconFinanzas, IconCheck,
} from "@/components/hapi/HapiIcons";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const today = () =>
  new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

const mesActual = () =>
  new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetExecutiveDashboard({ query: {} });
  const d = data as any;

  const collectPct = d
    ? Math.min(100, (d.totalCollectedToday / Math.max(1, d.totalExpectedToday)) * 100)
    : 0;

  const monthPct = d && d.targetMonth > 0
    ? Math.min(100, (d.collectionThisMonth / d.targetMonth) * 100)
    : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-6">

        {isLoading ? (
          <div className="mx-4 mt-2"><SkeletonHero /></div>
        ) : (
          <div className="mx-4 mt-2">
            <div className="hero-gradient rounded-2xl p-5 text-white">
              <div className="text-xs opacity-60 capitalize mb-0.5">{today()}</div>
              <div className="text-[22px] font-bold tracking-tight leading-tight">
                Hola, {user?.fullName?.split(" ")[0] ?? "Asesor"}
              </div>
              <div className="text-sm opacity-70 mb-4">Resumen del día</div>

              <div className="bg-white/10 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Cobrado hoy</div>
                    <div className="text-2xl font-extrabold">{fmt(d?.totalCollectedToday ?? 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Esperado</div>
                    <div className="text-lg font-semibold opacity-80">{fmt(d?.totalExpectedToday ?? 0)}</div>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${collectPct}%`, background: collectPct >= 80 ? "#10b981" : collectPct >= 50 ? "#f59e0b" : "#ef4444" }}
                  />
                </div>
                <div className="text-xs opacity-60 mt-1.5 text-right">{collectPct.toFixed(0)}% de la meta diaria</div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "rgba(16,185,129,0.18)" }}
              >
                <div className="w-10 h-10 rounded-xl bg-green-400/30 flex items-center justify-center shrink-0">
                  <IconMoneda size={20} color="#bbf7d0" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-green-200">
                    Tu comisión — {mesActual()}
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {fmt(d?.commissionThisMonth ?? 0)}
                  </div>
                  <div className="text-xs text-green-200 opacity-80">
                    Acumulado total: {fmt(d?.commissionAllTime ?? 0)}
                  </div>
                </div>
                <Link href="/dashboard/comisiones">
                  <div className="text-green-200 opacity-70 hover:opacity-100 pressable">
                    <IconFlecha size={20} color="#bbf7d0" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
              {mesActual()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <IconGrupo size={18} />, bg: "#dbeafe", color: "#1e40af",
                  label: "Clientes asignados", value: d?.totalAssignedClients ?? 0, sub: "Total en cartera",
                },
                {
                  icon: <IconAlerta size={18} />, bg: "#fee2e2", color: "#dc2626",
                  label: "En mora", value: d?.clientsOverdue ?? 0, sub: "Requieren visita",
                },
                {
                  icon: <IconFinanzas size={18} />, bg: "#dcfce7", color: "#16a34a",
                  label: "Colocación del mes", value: fmt(d?.placementThisMonth ?? 0), sub: "Monto colocado",
                },
                {
                  icon: <IconCalendario size={18} />, bg: "#fef3c7", color: "#d97706",
                  label: "Cobros pendientes", value: d?.clientsDueToday ?? 0, sub: "Clientes por cobrar",
                },
              ].map(s => (
                <div key={s.label} className="card">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div className="text-lg font-extrabold text-gray-900">{s.value}</div>
                  <div className="text-[11px] font-semibold text-gray-500 mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-gray-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && d?.targetMonth > 0 && (
          <div className="mx-4 card">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Meta de cobro mensual</div>
                <div className="text-lg font-extrabold text-gray-900">
                  {fmt(d.collectionThisMonth)} <span className="text-sm font-normal text-gray-400">/ {fmt(d.targetMonth)}</span>
                </div>
              </div>
              <Badge variant={monthPct >= 80 ? "success" : monthPct >= 50 ? "warning" : "danger"} size="md">
                {monthPct.toFixed(0)}%
              </Badge>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${monthPct}%`,
                  background: monthPct >= 80 ? "#10b981" : monthPct >= 50 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>
        )}

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Acciones rápidas
          </div>
          <div className="flex flex-col gap-2">
            {[
              {
                href: "/dashboard/clientes",
                icon: <IconPersona size={18} />, bg: "#dbeafe", color: "#1e40af",
                title: "Mis clientes",
                sub: `${d?.totalAssignedClients ?? 0} clientes en cartera`,
              },
              {
                href: "/dashboard/cobrar",
                icon: <IconMoneda size={18} />, bg: "#d1fae5", color: "#065f46",
                title: "Registrar cobro",
                sub: "Registrar pago de un cliente",
              },
              {
                href: "/dashboard/alta-cliente",
                icon: <IconMas size={18} />, bg: "#ede9fe", color: "#6d28d9",
                title: "Alta de cliente",
                sub: "Registrar nuevo cliente y crédito",
              },
              {
                href: "/dashboard/comisiones",
                icon: <IconMoneda size={18} />, bg: "#dcfce7", color: "#16a34a",
                title: "Mis comisiones",
                sub: `Este mes: ${fmt(d?.commissionThisMonth ?? 0)}`,
              },
            ].map(item => (
              <Link key={item.href} href={item.href} className="card flex items-center gap-4 py-4 pressable">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
                </div>
                <IconFlecha size={20} color="#9ca3af" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
