import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useListCredits, useListPayments } from "@workspace/api-client-react";
import { Badge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonHero, SkeletonCard, SkeletonList } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import { RiBankCardLine, RiCalendarLine, RiCheckLine, RiTimeLine } from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

const daysDiff = (d: string | null | undefined) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
  return diff;
};

export default function ClientPortal() {
  const { user } = useAuth();

  const { data: credits = [], isLoading: loadingCredits } = useListCredits({
    clientId: user?.clientId as any,
  }, { query: {} });

  const credit = (credits as any[])[0];

  const { data: payments = [], isLoading: loadingPayments } = useListPayments({
    creditId: credit?.id,
  }, { query: { enabled: !!credit?.id } });

  const paid   = (payments as any[]).filter(p => p.status === "completed").length;
  const total  = credit?.termWeeks ?? 0;
  const pct    = total > 0 ? (paid / total) * 100 : 0;
  const nextDays = daysDiff(credit?.nextPaymentDate);

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Hero */}
        {loadingCredits ? (
          <div className="mx-4 mt-2"><SkeletonHero /></div>
        ) : !credit ? (
          <div className="mx-4 mt-2">
            <EmptyState
              icon={<RiBankCardLine />}
              title="Sin crédito activo"
              description="No tienes un crédito activo en este momento."
            />
          </div>
        ) : (
          <div className="mx-4 mt-2">
            <div className="hero-gradient rounded-2xl p-5 text-white">
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">
                Mi crédito activo
              </div>
              <div className="text-4xl font-bold tracking-tight fade-up mb-1">
                {fmt(parseFloat(credit.amount ?? "0"))}
              </div>
              <div className="text-sm opacity-70 mb-4">Monto original del crédito</div>

              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex justify-between items-baseline mb-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Saldo pendiente</div>
                    <div className="text-xl font-bold">{fmt(parseFloat(credit.remainingBalance ?? "0"))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Pago semanal</div>
                    <div className="text-lg font-semibold opacity-90">{fmt(parseFloat(credit.weeklyPayment ?? "0"))}</div>
                  </div>
                </div>
                <ProgressBar value={pct} animate height={8} />
                <div className="text-xs opacity-60 mt-1.5">
                  {paid} de {total} pagos realizados
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next payment */}
        {credit && (
          <div className="px-4">
            <div
              className="card border-l-4"
              style={{
                borderLeftColor: nextDays !== null && nextDays <= 0 ? "var(--danger)"
                  : nextDays !== null && nextDays <= 3 ? "var(--warning)"
                  : "var(--success)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <RiCalendarLine className="text-gray-500 text-base" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Próximo pago</span>
              </div>
              <div className="text-[15px] font-bold text-gray-900 capitalize">
                {fmtDate(credit.nextPaymentDate)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {fmt(parseFloat(credit.weeklyPayment ?? "0"))}
                </div>
                {nextDays !== null && (
                  <Badge
                    variant={nextDays <= 0 ? "danger" : nextDays <= 3 ? "warning" : "success"}
                    size="md"
                  >
                    {nextDays <= 0 ? "Vencido" : nextDays === 1 ? "Mañana" : `En ${nextDays} días`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Historial de pagos
          </div>
          {loadingPayments ? (
            <SkeletonList count={3} />
          ) : (payments as any[]).length === 0 ? (
            <EmptyState
              icon={<RiTimeLine />}
              title="Sin pagos registrados"
              description="Aquí aparecerán tus pagos una vez que se registren."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {(payments as any[]).slice().reverse().map((pay: any) => {
                const done = pay.status === "completed";
                return (
                  <div key={pay.id} className="card flex items-center gap-3 py-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{
                        background: done ? "#d1fae5" : "#fef3c7",
                        color: done ? "#065f46" : "#92400e",
                      }}
                    >
                      {done ? <RiCheckLine /> : <RiTimeLine />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{fmt(parseFloat(pay.amountPaid ?? "0"))}</div>
                      <div className="text-xs text-gray-500">
                        {pay.paymentDate
                          ? new Date(pay.paymentDate + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </div>
                    </div>
                    <Badge variant={done ? "success" : "warning"} size="sm">
                      {done ? "Pagado" : "Pendiente"}
                    </Badge>
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
