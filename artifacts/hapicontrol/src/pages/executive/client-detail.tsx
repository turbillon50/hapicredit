import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "wouter";
import {
  getGetClientQueryKey,
  useGetClient,
  getListCreditsQueryKey,
  useListCredits,
} from "@workspace/api-client-react";
import {
  IconTelefono,
  IconUbicacion,
  IconMoneda,
  IconCalendario,
} from "@/components/hapi/HapiIcons";

const statusLabels: Record<string, string> = {
  current: "Al corriente",
  overdue: "En atraso",
  at_risk: "En riesgo",
  defaulted: "Vencido",
  inactive: "Inactivo",
};

const statusClass: Record<string, string> = {
  current: "status-current",
  overdue: "status-overdue",
  at_risk: "status-at_risk",
  defaulted: "status-defaulted",
  inactive: "status-inactive",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const text = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return <span className="text-[26px] font-bold text-white uppercase">{text}</span>;
}

export default function ExecutiveClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);

  const { data: client, isLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) }
  });

  const { data: credits } = useListCredits(
    { clientId },
    { query: { enabled: !!clientId, queryKey: getListCreditsQueryKey({ clientId }) } }
  );

  const activeCredit = credits?.find((c: any) => c.status === "active");

  if (isLoading || !client) {
    return (
      <Layout title="Perfil del Cliente" back="/clients">
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-white rounded-2xl shadow-card" />
          <div className="h-28 bg-white rounded-2xl shadow-card" />
          <div className="h-20 bg-white rounded-2xl shadow-card" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Perfil del Cliente" back="/clients">
      <div className="space-y-4">

        <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #1a3a6b, #2454a3)" }}>
            <Initials name={client.fullName} />
          </div>
          <h2 className="text-[18px] font-bold text-foreground">{client.fullName}</h2>
          {client.riskScore !== null && client.riskScore !== undefined && (
            <p className="text-[11px] text-muted-foreground mt-1">Score de riesgo: <span className="font-bold text-primary">{client.riskScore}</span>/100</p>
          )}
          <span className={`mt-2 text-[11px] font-semibold px-3 py-1 rounded-full ${statusClass[client.status] ?? ""}`}>
            {statusLabels[client.status] ?? client.status}
          </span>
        </div>

        {activeCredit && (
          <div className="rounded-2xl p-5 shadow-card-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1f3d, #1a3a6b)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Crédito activo</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[26px] font-bold text-white leading-none">{fmt(activeCredit.remainingBalance ?? 0)}</p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Saldo pendiente</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-white">{fmt(activeCredit.weeklyPayment ?? 0)}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Pago semanal</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex gap-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Monto otorgado</p>
                <p className="text-[13px] font-semibold text-white">{fmt(activeCredit.amount)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Semanas</p>
                <p className="text-[13px] font-semibold text-white">{activeCredit.termWeeks}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datos de contacto</p>
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <IconTelefono size={18} color="var(--accent)" />
              </div>
              <span className="text-[14px] text-foreground">{client.phone}</span>
            </a>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <IconUbicacion size={18} color="var(--accent)" />
              </div>
              <span className="text-[13px] text-muted-foreground leading-relaxed">{client.address}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href={`/payments/new?clientId=${client.id}`}>
            <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2 text-center active:bg-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconMoneda size={20} color="var(--accent)" />
              </div>
              <span className="text-[12px] font-semibold text-foreground">Registrar pago</span>
            </div>
          </Link>
          <Link href="/commitments">
            <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2 text-center active:bg-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <IconCalendario size={20} color="#f59e0b" />
              </div>
              <span className="text-[12px] font-semibold text-foreground">Compromiso</span>
            </div>
          </Link>
        </div>

      </div>
    </Layout>
  );
}
