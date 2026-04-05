import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonHero } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  RiBankCardLine, RiCalendarLine, RiCheckLine, RiTimeLine,
  RiAlertLine, RiArrowRightLine,
} from "react-icons/ri";
import { Link } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "\u2014";
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

const daysDiff = (d: string | null | undefined) => {
  if (!d) return null;
  return Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
};

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  active:   { label: "Activo",    variant: "success" },
  pending:  { label: "En revisión", variant: "warning" },
  rejected: { label: "Rechazado", variant: "danger"  },
  closed:   { label: "Liquidado", variant: "info"    },
};

export default function MiCredito() {
  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ["all-clients"],
    queryFn: async () => { const r = await fetch(`${API}/clients`, { headers: auth() }); if (!r.ok) throw new Error("Error al cargar clientes"); return r.json(); },
  });

  const client = (clients as any[])[0];

  const { data: credits = [] } = useQuery<any[]>({
    queryKey: ["client-credits", client?.id],
    queryFn: async () => { const r = await fetch(`${API}/credits?clientId=${client!.id}`, { headers: auth() }); if (!r.ok) throw new Error("Error al cargar créditos"); return r.json(); },
    enabled: !!client?.id,
  });

  const activeCredit = (credits as any[]).find(c => c.status === "active");
  const pendingCredits = (credits as any[]).filter(c => c.status === "pending");
  const allCredits = credits as any[];

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ["client-payments", activeCredit?.id],
    queryFn: async () => { const r = await fetch(`${API}/payments?creditId=${activeCredit!.id}`, { headers: auth() }); if (!r.ok) throw new Error("Error al cargar pagos"); return r.json(); },
    enabled: !!activeCredit?.id,
  });

  const paid  = (payments as any[]).filter(p => p.paymentStatus === "on_time" || p.paymentStatus === "completed" || p.paymentStatus === "late" || p.paymentStatus === "partial").length;
  const total = activeCredit?.termWeeks ?? 0;
  const pct   = total > 0 ? (paid / total) * 100 : 0;
  const nextDays = daysDiff(activeCredit?.nextPaymentDate);

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-6">

        {isLoading ? (
          <div className="px-4 pt-4"><SkeletonHero /></div>
        ) : !activeCredit && pendingCredits.length === 0 && allCredits.length === 0 ? (
          <div className="px-4 pt-8">
            <EmptyState
              icon={<RiBankCardLine />}
              title="Sin créditos registrados"
              description="Aún no tienes un crédito con nosotros. Solicita uno para empezar."
            />
            <Link href="/solicitar">
              <button
                className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
                style={{ background: "var(--accent)" }}
              >
                Solicitar crédito <RiArrowRightLine />
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            {activeCredit && (
              <div
                className="mx-4 mt-4 rounded-3xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-900) 0%, #1e40af 100%)" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-1">Crédito activo</div>
                    <div className="text-xs opacity-40">#{activeCredit.id} · {client?.fullName ?? ""}</div>
                  </div>
                  <Badge variant="success" size="sm">Activo</Badge>
                </div>
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <div className="text-xs opacity-50">Saldo pendiente</div>
                    <div className="text-3xl font-extrabold">{fmt(activeCredit.remainingBalance)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-50">Pago semanal</div>
                    <div className="text-xl font-bold">{fmt(activeCredit.weeklyPayment)}</div>
                  </div>
                </div>
                <ProgressBar value={pct} size="sm" className="mt-3 mb-2" />
                <div className="flex justify-between text-xs opacity-50">
                  <span>{paid} de {total} pagos</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            )}

            {/* Next payment */}
            {activeCredit && nextDays !== null && (
              <div className="mx-4">
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: nextDays <= 1 ? "#fff0f0" : nextDays <= 3 ? "#fffbeb" : "#f0fdf4" }}
                >
                  {nextDays <= 1
                    ? <RiAlertLine className="text-red-500 text-2xl shrink-0" />
                    : nextDays <= 3
                      ? <RiTimeLine className="text-yellow-500 text-2xl shrink-0" />
                      : <RiCalendarLine className="text-green-500 text-2xl shrink-0" />
                  }
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {nextDays < 0 ? `Pago vencido hace ${Math.abs(nextDays)} día(s)` : nextDays === 0 ? "Pago vence hoy" : `Próximo pago en ${nextDays} día(s)`}
                    </div>
                    <div className="text-xs text-gray-500">{fmtDate(activeCredit.nextPaymentDate)} · {fmt(activeCredit.weeklyPayment)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending requests */}
            {pendingCredits.length > 0 && (
              <div className="mx-4 flex flex-col gap-2">
                <div className="text-sm font-bold text-gray-700">Solicitudes en revisión</div>
                {pendingCredits.map((c: any) => (
                  <div key={c.id} className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 text-xl shrink-0">
                      <RiTimeLine />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{fmt(c.amount)}</div>
                      <div className="text-xs text-gray-500">{c.termWeeks} semanas · {c.notes ?? ""}</div>
                    </div>
                    <Badge variant="warning" size="sm">En revisión</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Credit history */}
            {allCredits.length > 0 && (
              <div className="mx-4 flex flex-col gap-3">
                <div className="text-sm font-bold text-gray-700">Historial de créditos</div>
                {allCredits.map((c: any) => {
                  const st = STATUS_MAP[c.status] ?? { label: c.status, variant: "info" as const };
                  return (
                    <div key={c.id} className="card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-gray-900">Crédito #{c.id}</div>
                        <Badge variant={st.variant} size="sm">{st.label}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase">Monto</div>
                          <div className="text-xs font-bold">{fmt(c.amount)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase">Plazo</div>
                          <div className="text-xs font-bold">{c.termWeeks} sem</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase">Semanal</div>
                          <div className="text-xs font-bold">{fmt(c.weeklyPayment)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent payments */}
            {payments.length > 0 && (
              <div className="mx-4 flex flex-col gap-3">
                <div className="text-sm font-bold text-gray-700">Últimos pagos</div>
                {(payments as any[]).slice(-5).reverse().map((p: any) => {
                  const st = p.paymentStatus ?? p.status;
                  const isPaid = st === "on_time" || st === "completed" || st === "late" || st === "partial";
                  const isPending = st === "pending_validation";
                  return (
                    <div key={p.id} className="flex items-center gap-3 card">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${isPaid ? "bg-green-100 text-green-600" : isPending ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-400"}`}>
                        {isPaid ? <RiCheckLine /> : <RiTimeLine />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{fmt(parseFloat(p.amountPaid ?? p.amount ?? 0))}</div>
                        <div className="text-xs text-gray-400">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "\u2014"}</div>
                      </div>
                      <Badge variant={isPaid ? "success" : isPending ? "warning" : "info"} size="sm">
                        {isPaid ? "Pagado" : isPending ? "En validación" : "Pendiente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
