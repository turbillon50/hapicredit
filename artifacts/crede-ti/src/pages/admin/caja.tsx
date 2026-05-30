import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { IconCaja, IconFlechaDerecha } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

type ExecSummary = {
  executiveId: number;
  executiveName: string;
  collectedToday: number;
  cashOnHand: number;
  lastMovementAt: string | null;
};

export default function AdminCaja() {
  const [, navigate] = useLocation();
  const { data: executives, isLoading } = useQuery<ExecSummary[]>({
    queryKey: ["caja-summary"],
    queryFn: async () => {
      const r = await fetch(`${API}/caja/summary`, { headers: auth() });
      if (!r.ok) throw new Error("Failed to fetch");
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const totalCash = (executives ?? []).reduce((s, e) => s + e.cashOnHand, 0);
  const totalCollectedToday = (executives ?? []).reduce((s, e) => s + e.collectedToday, 0);

  return (
    <Layout title="Control de Caja">
      <div className="space-y-4">

        {executives && (
          <div className="rounded-2xl p-5 shadow-card-md" style={{ background: "linear-gradient(135deg, #15206E, #2A3CD6)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Total en caja</p>
            <p className="text-[32px] font-bold text-white">{fmt(totalCash)}</p>
            <div className="mt-3 flex gap-5">
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Cobrado hoy</p>
                <p className="text-[14px] font-semibold text-white">{fmt(totalCollectedToday)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Ejecutivos</p>
                <p className="text-[14px] font-semibold text-white">{executives.length}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : (
          executives?.map((exec) => (
            <div
              key={exec.executiveId}
              className="bg-white rounded-2xl shadow-card p-4 active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => navigate(`/admin/movimientos/${exec.executiveId}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <IconCaja size={18} color="var(--accent)" />
                </div>
                <p className="text-[13px] font-semibold text-foreground flex-1">{exec.executiveName}</p>
                <IconFlechaDerecha size={14} color="var(--muted-foreground)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-[13px] font-bold text-success">{fmt(exec.cashOnHand)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">En caja</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-[13px] font-bold text-foreground">{fmt(exec.collectedToday)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Cobrado hoy</p>
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </Layout>
  );
}
