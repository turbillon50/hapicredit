import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import {
  getGetExecutiveDashboardQueryKey,
  useGetExecutiveDashboard
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  RiTeamLine,
  RiAlarmWarningLine,
  RiMoneyDollarCircleLine,
  RiWallet3Line,
  RiCalendarCheckLine,
  RiArrowRightLine,
  RiAddCircleLine,
} from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? user?.username ?? "";

  const { data: d, isLoading } = useGetExecutiveDashboard(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getGetExecutiveDashboardQueryKey({ executiveId: user?.id }) } }
  );

  if (isLoading || !d) {
    return (
      <Layout title={`Hola, ${firstName}`}>
        <div className="space-y-4 animate-pulse">
          <div className="h-40 bg-white rounded-2xl shadow-card" />
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl shadow-card" />)}
          </div>
        </div>
      </Layout>
    );
  }

  const pct = Math.min(100, d.totalExpectedToday > 0
    ? (d.totalCollectedToday / d.totalExpectedToday) * 100 : 0);

  const metrics = [
    { label: "Clientes hoy", value: d.clientsDueToday, icon: RiTeamLine, color: "#2454a3", bg: "#eef3fb" },
    { label: "En atraso", value: d.clientsOverdue, icon: RiAlarmWarningLine, color: "#dc2626", bg: "#fef2f2" },
    { label: "Compromisos", value: d.pendingPromises, icon: RiCalendarCheckLine, color: "#b45309", bg: "#fffbeb" },
    { label: "Caja", value: fmt(d.cashOnHand), icon: RiWallet3Line, color: "#15803d", bg: "#f0fdf4", small: true },
  ];

  return (
    <Layout title={`Hola, ${firstName}`}>
      <div className="space-y-4">

        <div className="rounded-2xl p-5 shadow-card-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 60%, #2454a3 100%)" }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.3)" }} />
          <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full opacity-8" style={{ background: "rgba(255,255,255,0.2)" }} />

          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            Cobranza del día
          </p>
          <p className="text-[32px] font-bold text-white leading-tight tracking-tight">
            {fmt(d.totalCollectedToday)}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            de {fmt(d.totalExpectedToday)} programados
          </p>

          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>Avance</span>
              <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171" }}
              />
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
                <p className={`font-bold leading-tight text-foreground ${m.small ? "text-[15px]" : "text-[26px]"}`}>
                  {m.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            );
          })}
        </div>

        {d.alertCount > 0 && (
          <Link href="/alerts">
            <div className="bg-white rounded-2xl p-4 shadow-card flex items-center justify-between border-l-4 border-warning">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <RiAlarmWarningLine className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{d.alertCount} alerta{d.alertCount !== 1 ? "s" : ""} pendiente{d.alertCount !== 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-muted-foreground">Requieren atención</p>
                </div>
              </div>
              <RiArrowRightLine className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/payments/new">
            <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3 active:bg-secondary transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eef3fb" }}>
                <RiMoneyDollarCircleLine className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[13px] font-semibold text-foreground">Registrar pago</span>
            </div>
          </Link>
          <Link href="/clients/new">
            <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3 active:bg-secondary transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <RiAddCircleLine className="w-5 h-5 text-success" />
              </div>
              <span className="text-[13px] font-semibold text-foreground">Nuevo cliente</span>
            </div>
          </Link>
        </div>

      </div>
    </Layout>
  );
}
