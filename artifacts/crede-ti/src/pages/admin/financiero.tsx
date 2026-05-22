import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/hapi/Card";
import { SkeletonCard } from "@/components/hapi/Skeleton";
import { Avatar } from "@/components/hapi/Avatar";
import { IconFinanzas, IconMoneda, IconAlerta, IconCrecimiento } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${n.toFixed(2)}%`;

function fetchFinanciero() {
  return fetch(`${API}/dashboard/admin/financial-summary`, { headers: auth() }).then(r => r.json());
}

type KPICardProps = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  week: number;
  month: number;
};

function KPICard({ icon, iconBg, iconColor, label, week, month }: KPICardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-gray-400 font-medium mb-0.5">Esta semana</div>
          <div className="text-lg font-bold text-gray-900">{fmt(week)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 font-medium mb-0.5">Este mes</div>
          <div className="text-lg font-bold text-gray-900">{fmt(month)}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanciero() {
  const { data, isLoading } = useQuery({ queryKey: ["financiero"], queryFn: fetchFinanciero });
  const d = data as any;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Header */}
        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Análisis Financiero</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ingresos, utilidad y proyecciones</p>
        </div>

        {/* KPI cards */}
        {isLoading ? (
          <div className="px-4 flex flex-col gap-3">
            {[1,2,3].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-3">
            <KPICard
              icon={<IconAlerta size={18} />}
              iconBg="rgba(37,99,235,0.1)"
              iconColor="var(--accent)"
              label="Ingresos por intereses"
              week={d?.interestEarnedWeek ?? 0}
              month={d?.interestEarnedMonth ?? 0}
            />
            <KPICard
              icon={<IconMoneda size={18} />}
              iconBg="rgba(16,185,129,0.1)"
              iconColor="var(--success)"
              label="Comisiones de apertura"
              week={d?.openingFeeWeek ?? 0}
              month={d?.openingFeeMonth ?? 0}
            />
            <KPICard
              icon={<IconFinanzas size={18} />}
              iconBg="rgba(109,40,217,0.1)"
              iconColor="#7c3aed"
              label="Utilidad total"
              week={d?.profitThisWeek ?? 0}
              month={d?.profitThisMonth ?? 0}
            />

            {/* Projection */}
            <div className="card" style={{ background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))", border: "none" }}>
              <div className="flex items-center gap-2 mb-2">
                <IconCrecimiento size={16} color="#34d399" />
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Proyección mensual</span>
              </div>
              <div className="text-3xl font-bold text-white fade-up">
                {fmt(d?.projectedMonthly ?? 0)}
              </div>
              <div className="text-xs text-white/50 mt-1">Basado en tasa semanal actual</div>
              <div className="mt-3 flex items-center gap-4">
                <div>
                  <div className="text-[10px] text-white/40">Tasa promedio cartera</div>
                  <div className="text-sm font-bold text-emerald-400">{fmtPct(d?.avgInterestRate ?? 0)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40">Cartera activa</div>
                  <div className="text-sm font-bold text-white">{fmt(d?.totalPortfolio ?? 0)}</div>
                </div>
              </div>
            </div>

            {/* Executive breakdown */}
            {d?.executiveBreakdown?.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
                  Por ejecutivo
                </div>
                <div className="flex flex-col gap-3">
                  {d.executiveBreakdown.map((exec: any) => (
                    <div key={exec.executiveId} className="card">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={exec.executiveName} size="sm" />
                        <div className="text-sm font-semibold text-gray-900 flex-1">{exec.executiveName}</div>
                        <span className="text-xs font-semibold text-gray-500">{exec.creditCount} créditos</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Capital", val: fmt(exec.totalCapital ?? 0) },
                          { label: "Interés", val: fmt(exec.interestEarned ?? 0) },
                          { label: "Mora", val: fmtPct(exec.delinquencyRate ?? 0) },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl p-2" style={{ background: "var(--surface-2)" }}>
                            <div className="text-[10px] text-gray-400 font-medium">{item.label}</div>
                            <div className="text-xs font-bold text-gray-800 mt-0.5">{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
