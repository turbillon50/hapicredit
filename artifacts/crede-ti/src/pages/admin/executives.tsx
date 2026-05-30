import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useGetExecutiveRanking } from "@workspace/api-client-react";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { IconGrupo, IconMedalla, IconMoneda, IconCrecimiento, IconFlechaAbajo } from "@/components/hapi/HapiIcons";

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

type Period = "week" | "month";
const MEDAL = ["#f59e0b", "#9ca3af", "#b45309"];

export default function AdminAsesores() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading } = useGetExecutiveRanking();
  const ranking = (data as any[]) ?? [];

  const totalCommission = ranking.reduce((s: number, r: any) => s + (r.commissionThisMonth ?? 0), 0);
  const totalPlacement  = ranking.reduce((s: number, r: any) => s + (r.placementThisMonth ?? 0), 0);

  const moraBadge = (pct: number) =>
    pct > 30 ? { variant: "danger" as const, label: `${pct.toFixed(1)}%` }
    : pct > 10 ? { variant: "warning" as const, label: `${pct.toFixed(1)}%` }
    : { variant: "success" as const, label: `${pct.toFixed(1)}%` };

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Header */}
        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Asesores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ranking.length} ejecutivos · Comisiones del mes: {fmt(totalCommission)}
          </p>
        </div>

        {/* Resumen ejecutivo del mes */}
        {!isLoading && ranking.length > 0 && (
          <div className="px-4 grid grid-cols-2 gap-3">
            <div className="card text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Colocación total</div>
              <div className="text-lg font-extrabold text-gray-900">{fmt(totalPlacement)}</div>
              <div className="text-xs text-gray-400">Este mes</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Comisiones totales</div>
              <div className="text-lg font-extrabold" style={{ color: "#16a34a" }}>{fmt(totalCommission)}</div>
              <div className="text-xs text-gray-400">A pagar en nómina</div>
            </div>
          </div>
        )}

        {/* Period selector */}
        <div className="px-4 flex gap-2">
          {(["week", "month"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all pressable ${period === p ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={period === p ? { background: "var(--accent)" } : {}}
            >
              {p === "week" ? "Esta semana" : "Este mes"}
            </button>
          ))}
        </div>

        {/* Ranking */}
        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={3} />
          ) : !ranking.length ? (
            <EmptyState icon={<IconGrupo />} title="Sin asesores" description="No hay ejecutivos registrados." />
          ) : (
            <div className="flex flex-col gap-3">
              {ranking.map((exec: any, idx: number) => {
                const mb = moraBadge(exec.delinquencyRate ?? 0);
                const collected = period === "week" ? (exec.collectedThisWeek ?? 0) : (exec.collectedThisMonth ?? 0);
                const target    = period === "week" ? (exec.targetWeek ?? 0)  : (exec.targetMonth ?? 0);
                const placement = period === "week" ? (exec.placementThisWeek ?? 0) : (exec.placementThisMonth ?? 0);
                const commission = period === "week" ? (exec.commissionThisWeek ?? 0) : (exec.commissionThisMonth ?? 0);
                const pct = target > 0 ? Math.min(100, (collected / target) * 100) : 0;
                const pctVariant = pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger";

                return (
                  <div key={exec.executiveId} className="card">
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative shrink-0">
                        <Avatar name={exec.executiveName} size="lg" />
                        {idx < 3 && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: MEDAL[idx] }}
                          >
                            <IconMedalla size={10} color="#fff" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{exec.executiveName}</span>
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">{exec.totalClients ?? 0} clientes</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{exec.activeCredits ?? 0} créditos activos</span>
                          <span className="text-gray-300">·</span>
                          <Badge variant={mb.variant} size="sm">Mora {mb.label}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Barra de cobro */}
                    <div className="mb-4">
                      <ProgressBar
                        value={pct}
                        variant={pctVariant}
                        label={`Cobrado: ${fmt(collected)}`}
                        showPercent
                        height={10}
                      />
                      <div className="text-xs text-gray-400 mt-1">Meta: {fmt(target)}</div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">Colocación</div>
                        <div className="text-sm font-bold text-gray-800">{fmt(placement)}</div>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">Comisión</div>
                        <div className="text-sm font-bold" style={{ color: "#16a34a" }}>{fmt(commission)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">Cumplimiento</div>
                        <div className="text-sm font-bold" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626" }}>
                          {pct.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
