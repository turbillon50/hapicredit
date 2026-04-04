import { Layout } from "@/components/layout/Layout";
import { getListCommitmentsQueryKey, useListCommitments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { RiCalendarCheckLine, RiErrorWarningLine, RiCheckDoubleLine } from "react-icons/ri";

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: "Pendiente",  cls: "commitment-pending",   icon: RiCalendarCheckLine },
  fulfilled: { label: "Cumplido",   cls: "commitment-fulfilled", icon: RiCheckDoubleLine   },
  broken:    { label: "Incumplido", cls: "commitment-broken",    icon: RiErrorWarningLine  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function ExecutiveCommitments() {
  const { user } = useAuth();
  const { data: commitments, isLoading } = useListCommitments(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListCommitmentsQueryKey({ executiveId: user?.id }) } }
  );

  return (
    <Layout title="Compromisos de Pago">
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[76px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : commitments?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <RiCalendarCheckLine className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">Sin compromisos registrados</p>
          </div>
        ) : (
          commitments?.map((c: any) => {
            const cfg = statusConfig[c.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            const date = new Date(c.promisedDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.clientName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fmt(c.promisedAmount)} — {date}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
