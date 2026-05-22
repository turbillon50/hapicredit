import { Layout } from "@/components/layout/Layout";
import { useGetExecutiveDashboard } from "@workspace/api-client-react";
import { SkeletonList, SkeletonHero } from "@/components/hapi/Skeleton";
import { Badge } from "@/components/hapi/Badge";
import { EmptyState } from "@/components/hapi/EmptyState";
import { IconMoneda, IconCrecimiento, IconFlechaAbajo, IconCheck, IconReloj } from "@/components/hapi/HapiIcons";

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : "—";

const mesActual = () =>
  new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

const prevMes = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
};

export default function ExecutiveComisiones() {
  const { data, isLoading } = useGetExecutiveDashboard({ query: {} });
  const d = data as any;

  const credits: any[] = d?.creditBreakdown ?? [];
  const totalComision = d?.commissionThisMonth ?? 0;
  const totalAnterior = d?.commissionPrevMonth ?? 0;
  const diffPct = totalAnterior > 0
    ? ((totalComision - totalAnterior) / totalAnterior) * 100
    : null;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-6">

        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Mis comisiones</h1>
          <p className="text-sm text-gray-500 mt-0.5">5% sobre cada crédito colocado</p>
        </div>

        {isLoading ? (
          <div className="mx-4"><SkeletonHero /></div>
        ) : (
          <>
            <div className="mx-4">
              <div
                className="rounded-2xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #065f46, #10b981)" }}
              >
                <div className="text-xs uppercase font-semibold tracking-widest opacity-70 mb-1 capitalize">
                  {mesActual()}
                </div>
                <div className="text-4xl font-extrabold mb-1">{fmt(totalComision)}</div>
                <div className="text-sm opacity-70 mb-4">Comisión del mes actual</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/15 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-semibold opacity-70 mb-1">Acumulado total</div>
                    <div className="text-lg font-bold">{fmt(d?.commissionAllTime)}</div>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-semibold opacity-70 mb-1 capitalize">{prevMes()}</div>
                    <div className="text-lg font-bold">{fmt(totalAnterior)}</div>
                    {diffPct !== null && (
                      <div className={`flex items-center gap-0.5 text-xs font-semibold mt-0.5 ${diffPct >= 0 ? "text-green-200" : "text-red-200"}`}>
                        {diffPct >= 0 ? <IconCrecimiento size={14} /> : <IconFlechaAbajo size={14} />}
                        {Math.abs(diffPct).toFixed(0)}% vs mes anterior
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Cómo se calcula tu comisión
              </div>
              <div className="flex flex-col gap-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"><IconCheck size={16} color="#3b82f6" /></span>
                  <span><strong>5%</strong> del monto de cada crédito que colocas</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"><IconCheck size={16} color="#3b82f6" /></span>
                  <span>Se acredita <strong>al momento del desembolso</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"><IconCheck size={16} color="#3b82f6" /></span>
                  <span>La comisión se <strong>paga quincenalmente</strong> junto con nómina</span>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
                Créditos colocados este mes ({credits.length})
              </div>

              {credits.length === 0 ? (
                <EmptyState
                  icon={<IconMoneda />}
                  title="Sin créditos este mes"
                  description="Coloca créditos para generar comisiones."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {credits.map((c: any, i: number) => (
                    <div key={c.creditId ?? i} className="card flex items-center gap-3 py-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: c.status === "active" ? "#dcfce7" : "#dbeafe", color: c.status === "active" ? "#16a34a" : "#1e40af" }}
                      >
                        {c.status === "active" ? <IconCheck size={18} /> : <IconReloj size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          Crédito #{c.creditId} — Cliente #{c.clientId}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fmt(c.amount)} · {fmtDate(c.disbursementDate)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold" style={{ color: "#16a34a" }}>
                          +{fmt(c.commission)}
                        </div>
                        <Badge variant={c.status === "active" ? "success" : "warning"} size="sm">
                          {c.status === "active" ? "Activo" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <div
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: "#dcfce7" }}
                  >
                    <div className="text-sm font-bold text-green-800">Total del mes</div>
                    <div className="text-xl font-extrabold text-green-700">{fmt(totalComision)}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
