import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RiAlarmWarningLine, RiPhoneLine, RiCalendarLine, RiArrowRightLine } from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string | null) => s
  ? new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
  : "—";

type Row = {
  clientId: number; clientName: string; clientStatus: string; clientPhone: string;
  executiveName: string; remainingBalance: number; weeklyPayment: number;
  nextPaymentDate: string | null; daysOverdue: number; totalLateFees: number;
  latePayments: number; currentPaymentNum: number; termWeeks: number;
};

export default function AdminMorosos() {
  const { data: allRows = [], isLoading } = useQuery<Row[]>({
    queryKey: ["admin-portfolio-detail"],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/admin/portfolio-detail`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hapi_token")}` }
      });
      if (!r.ok) throw new Error("No autorizado");
      return r.json();
    },
  });

  const rows = allRows
    .filter(r => r.clientStatus === "overdue" || r.clientStatus === "at_risk" || r.clientStatus === "defaulted")
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const totalOverdue = rows.reduce((s, r) => s + r.remainingBalance, 0);
  const overdueCount = rows.length;

  const urgencyColor = (days: number) => {
    if (days > 30) return { bg: "#fef2f2", border: "#dc2626", text: "#dc2626" };
    if (days > 14) return { bg: "#fff7ed", border: "#ea580c", text: "#ea580c" };
    if (days > 0)  return { bg: "#fef3c7", border: "#d97706", text: "#d97706" };
    return { bg: "#f0fdf4", border: "#16a34a", text: "#16a34a" };
  };

  return (
    <Layout title="Morosos" back="/admin">
      <div className="space-y-4">

        {/* Summary */}
        <div className="rounded-2xl p-5 shadow-card-md" style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Cartera vencida total
          </p>
          <p className="text-[30px] font-bold text-white">{fmt(totalOverdue)}</p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            {overdueCount} clientes en atraso o riesgo
          </p>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <RiAlarmWarningLine className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">Sin clientes en atraso</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => {
              const clr = urgencyColor(row.daysOverdue);
              const lateMultiplier = Math.ceil(row.daysOverdue / 7);
              const totalDue = row.weeklyPayment * Math.max(1, lateMultiplier) + row.totalLateFees;

              return (
                <Link key={row.clientId} href={`/clients/${row.clientId}`}>
                  <div
                    className="bg-white rounded-2xl shadow-card p-4 border-l-4 active:bg-secondary transition-colors"
                    style={{ borderLeftColor: clr.border }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{row.clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{row.executiveName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.daysOverdue > 0 && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: clr.bg, color: clr.text }}>
                            {row.daysOverdue} días
                          </span>
                        )}
                        <RiArrowRightLine className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-background rounded-xl p-2.5 text-center">
                        <p className="text-[12px] font-bold text-destructive">{fmt(row.remainingBalance)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wide mt-0.5">Saldo deudor</p>
                      </div>
                      <div className="bg-background rounded-xl p-2.5 text-center">
                        <p className="text-[12px] font-bold text-warning">{fmt(totalDue)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wide mt-0.5">Monto a pagar</p>
                      </div>
                      <div className="bg-background rounded-xl p-2.5 text-center">
                        <p className="text-[12px] font-bold text-foreground">{row.latePayments}</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wide mt-0.5">Atrasos previos</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <RiCalendarLine className="w-3 h-3" />
                        Vencía: {fmtDate(row.nextPaymentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiPhoneLine className="w-3 h-3" />
                        {row.clientPhone}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}
