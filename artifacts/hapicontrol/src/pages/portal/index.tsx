import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonHero } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  IconTarjeta, IconCalendario, IconCheck, IconReloj,
  IconDocumento, IconAlerta,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

const daysDiff = (d: string | null | undefined) => {
  if (!d) return null;
  return Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
};

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  active:   { label: "Activo",    variant: "success" },
  pending:  { label: "Pendiente", variant: "warning" },
  rejected: { label: "Rechazado", variant: "danger"  },
  closed:   { label: "Pagado",    variant: "info"     },
};

export default function ClientPortal() {
  const { user } = useAuth();

  const { data: client, isLoading: loadingClient } = useQuery<any>({
    queryKey: ["me-client"],
    queryFn: () => fetch(`${API}/me/client`, { headers: auth() }).then(r => r.json()),
  });

  const { data: credits = [], isLoading: loadingCredits } = useQuery<any[]>({
    queryKey: ["client-credits", client?.id],
    queryFn: () => fetch(`${API}/credits?clientId=${client!.id}`, { headers: auth() }).then(r => r.json()),
    enabled: !!client?.id,
  });

  const activeCredit = (credits as any[]).find(c => c.status === "active");
  const pendingCredits = (credits as any[]).filter(c => c.status === "pending");
  const allCredits = credits as any[];

  const { data: payments = [], isLoading: loadingPayments } = useQuery<any[]>({
    queryKey: ["client-payments", activeCredit?.id],
    queryFn: () => fetch(`${API}/payments?creditId=${activeCredit!.id}`, { headers: auth() }).then(r => r.json()),
    enabled: !!activeCredit?.id,
  });

  const paid   = (payments as any[]).filter(p => p.paymentStatus === "completed" || p.status === "completed").length;
  const total  = activeCredit?.termWeeks ?? 0;
  const pct    = total > 0 ? (paid / total) * 100 : 0;
  const nextDays = daysDiff(activeCredit?.nextPaymentDate);

  const isLoading = loadingClient || loadingCredits;

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-6">

        {/* Hero */}
        {isLoading ? (
          <SkeletonHero />
        ) : (
          <div
            className="mx-4 mt-4 md:mt-0 rounded-3xl p-5 text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-900) 0%, #1e40af 100%)" }}
          >
            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Hola,</div>
            <div className="text-xl font-extrabold leading-tight mb-1">
              {user?.fullName?.split(" ")[0] ?? "Cliente"}
            </div>
            <div className="text-xs opacity-50 mb-4">
              Asesor: {client?.executiveName ?? "—"}  ·  Miembro desde {client?.registeredAt
                ? new Date(client.registeredAt).toLocaleDateString("es-MX", { month: "short", year: "numeric" })
                : "—"}
            </div>

            {activeCredit ? (
              <>
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <div className="text-xs opacity-60">Saldo pendiente</div>
                    <div className="text-3xl font-extrabold">{fmt(activeCredit.remainingBalance)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-60">Pago semanal</div>
                    <div className="text-xl font-bold">{fmt(activeCredit.weeklyPayment)}</div>
                  </div>
                </div>
                <ProgressBar value={pct} size="sm" className="mt-3 mb-2" />
                <div className="flex justify-between text-xs opacity-60">
                  <span>{paid} de {total} pagos completados</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 opacity-60">
                <span className="mx-auto mb-2"><IconTarjeta size={36} color="rgba(255,255,255,0.6)" /></span>
                <div className="text-sm">Sin crédito activo</div>
              </div>
            )}
          </div>
        )}

        {/* Próximo pago */}
        {activeCredit && nextDays !== null && (
          <div className="mx-4">
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: nextDays <= 1 ? "#fff0f0" : nextDays <= 3 ? "#fffbeb" : "#f0fdf4" }}
            >
              {nextDays <= 1
                ? <span className="shrink-0"><IconAlerta size={24} color="#ef4444" /></span>
                : nextDays <= 3
                  ? <span className="shrink-0"><IconReloj size={24} color="#eab308" /></span>
                  : <span className="shrink-0"><IconCalendario size={24} color="#22c55e" /></span>
              }
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {nextDays < 0
                    ? `Pago vencido hace ${Math.abs(nextDays)} día(s)`
                    : nextDays === 0
                      ? "Pago vence hoy"
                      : `Próximo pago en ${nextDays} día(s)`
                  }
                </div>
                <div className="text-xs text-gray-500">{fmtDate(activeCredit.nextPaymentDate)} · {fmt(activeCredit.weeklyPayment)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Créditos pendientes de aprobación */}
        {pendingCredits.length > 0 && (
          <div className="mx-4 flex flex-col gap-2">
            <div className="text-sm font-bold text-gray-700">Solicitudes en revisión</div>
            {pendingCredits.map(c => (
              <div key={c.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 text-xl shrink-0">
                  <IconReloj size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{fmt(c.amount)}</div>
                  <div className="text-xs text-gray-500">{c.termWeeks} semanas · {c.notes ?? "Sin notas"}</div>
                </div>
                <Badge variant="warning" size="sm">En revisión</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Historial de todos los créditos */}
        {allCredits.length > 0 && (
          <div className="mx-4 flex flex-col gap-3">
            <div className="text-sm font-bold text-gray-700">Historial de créditos</div>
            {allCredits.map(c => {
              const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "info" as const };
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
                  {c.notes && (
                    <div className="mt-2 text-xs text-gray-500 italic">"{c.notes}"</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && allCredits.length === 0 && (
          <div className="mx-4">
            <EmptyState
              icon={<IconTarjeta size={24} />}
              title="Sin créditos"
              description="No tienes ningún crédito registrado. Puedes solicitar uno desde el menú."
            />
          </div>
        )}

        {/* Pagos recientes */}
        {payments.length > 0 && (
          <div className="mx-4 flex flex-col gap-3">
            <div className="text-sm font-bold text-gray-700">Últimos pagos</div>
            {(payments as any[]).slice(-5).reverse().map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 card">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${p.paymentStatus === "completed" || p.status === "completed" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {p.paymentStatus === "completed" || p.status === "completed" ? <IconCheck size={16} /> : <IconReloj size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {fmt(parseFloat(p.amountPaid ?? p.amount ?? 0))}
                  </div>
                  <div className="text-xs text-gray-400">
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
                      : "—"
                    }
                  </div>
                </div>
                <Badge
                  variant={p.paymentStatus === "completed" || p.status === "completed" ? "success" : "warning"}
                  size="sm"
                >
                  {p.paymentStatus === "completed" || p.status === "completed" ? "Pagado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
