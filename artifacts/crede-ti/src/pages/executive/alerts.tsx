import { Layout } from "@/components/layout/Layout";
import { useListAlerts } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { IconAlerta, IconInfo } from "@/components/hapi/HapiIcons";

const typeConfig: Record<string, { label: string; iconKey: string; cls: string }> = {
  overdue:    { label: "En atraso",   iconKey: "alerta",  cls: "bg-red-50 text-red-600 border-l-red-400" },
  at_risk:    { label: "En riesgo",   iconKey: "alerta",  cls: "bg-amber-50 text-amber-600 border-l-amber-400" },
  renewal:    { label: "Renovación",  iconKey: "info",    cls: "bg-blue-50 text-blue-600 border-l-blue-400" },
  no_payment: { label: "Sin pago",    iconKey: "alerta",  cls: "bg-red-50 text-red-600 border-l-red-400" },
};

function AlertIcon({ iconKey, size = 18 }: { iconKey: string; size?: number }) {
  if (iconKey === "info") return <IconInfo size={size} />;
  return <IconAlerta size={size} />;
}

export default function ExecutiveAlerts() {
  const { user } = useAuth();
  const { data: alerts, isLoading } = useListAlerts(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id } as any }
  );

  return (
    <Layout title="Alertas">
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : alerts?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <div className="flex justify-center mb-3 opacity-30"><IconAlerta size={40} color="var(--text-muted)" /></div>
            <p className="text-[13px] text-muted-foreground">Sin alertas activas</p>
          </div>
        ) : (
          alerts?.map((alert: any) => {
            const cfg = typeConfig[alert.type] ?? typeConfig.overdue;
            const date = new Date(alert.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
            return (
              <div key={alert.id} className={`bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 border-l-4 ${cfg.cls}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                  <AlertIcon iconKey={cfg.iconKey} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{alert.clientName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{date}</span>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
