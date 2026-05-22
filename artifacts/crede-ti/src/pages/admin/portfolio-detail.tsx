import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { IconFlecha, IconCalendario } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string | null) => s
  ? new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

const statusLabels: Record<string, string> = {
  current: "Al corriente", overdue: "En atraso", at_risk: "En riesgo",
  defaulted: "Vencido", inactive: "Inactivo",
};
const statusCls: Record<string, string> = {
  current: "status-current", overdue: "status-overdue", at_risk: "status-at_risk",
  defaulted: "status-defaulted", inactive: "status-inactive",
};

type Row = {
  clientId: number; clientName: string; clientStatus: string; clientPhone: string;
  executiveName: string; creditAmount: number; remainingBalance: number; weeklyPayment: number;
  termWeeks: number; currentPaymentNum: number; paymentsLeft: number; openingFee: number;
  expectedTotal: number; totalInterest: number; interestRate: number; weeklyInterest: number;
  totalPaid: number; totalLateFees: number; latePayments: number;
  nextPaymentDate: string | null; daysOverdue: number; disbursementDate: string | null;
  hasActiveCredit: boolean;
};

export default function AdminPortfolioDetail() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "at_risk" | "current" | "defaulted">("all");

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ["admin-portfolio-detail"],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/admin/portfolio-detail`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("credeti_token")}` }
      });
      if (!r.ok) throw new Error("No autorizado");
      return r.json();
    },
  });

  const filtered = rows.filter(r => {
    const matchSearch = r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.clientPhone?.includes(search);
    const matchFilter = filter === "all" || r.clientStatus === filter;
    return matchSearch && matchFilter;
  });

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "current", label: "Al corriente" },
    { key: "overdue", label: "En atraso" },
    { key: "at_risk", label: "En riesgo" },
    { key: "defaulted", label: "Vencidos" },
  ];

  return (
    <Layout title="Cartera Detallada" back="/admin/clients">
      <div className="space-y-4">

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2"/><path d="M16 16l5 5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg></span>
          <input
            type="search"
            placeholder="Buscar cliente..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-border rounded-xl text-[14px] shadow-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterBtns.map(b => (
            <button
              key={b.key}
              onClick={() => setFilter(b.key)}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold border transition-all ${
                filter === b.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">{filtered.length} clientes</p>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : (
          <div className="space-y-3">
            {filtered.map(row => (
              <Link key={row.clientId} href={`/clients/${row.clientId}`}>
                <div className="bg-white rounded-2xl shadow-card p-4 active:bg-secondary transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{row.clientName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{row.executiveName} · {row.clientPhone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${statusCls[row.clientStatus] ?? ""}`}>
                        {statusLabels[row.clientStatus] ?? row.clientStatus}
                      </span>
                      <IconFlecha size={14} color="#9ca3af" />
                    </div>
                  </div>

                  {row.hasActiveCredit ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-background rounded-xl p-2.5 text-center">
                          <p className="text-[13px] font-bold text-primary">{fmt(row.remainingBalance)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Saldo deudor</p>
                        </div>
                        <div className="bg-background rounded-xl p-2.5 text-center">
                          <p className="text-[13px] font-bold text-foreground">{fmt(row.weeklyPayment)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Pago semanal</p>
                        </div>
                        <div className={`rounded-xl p-2.5 text-center ${row.daysOverdue > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                          <p className={`text-[13px] font-bold ${row.daysOverdue > 0 ? "text-destructive" : "text-success"}`}>
                            {row.daysOverdue > 0 ? `${row.daysOverdue}d` : "OK"}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {row.daysOverdue > 0 ? "Días atraso" : "Al día"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconCalendario size={12} />
                          Próx. pago: {fmtDate(row.nextPaymentDate)}
                        </span>
                        <span>Pago {row.currentPaymentNum}/{row.termWeeks} · Tasa {row.interestRate}%</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">Sin crédito activo</p>
                  )}
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-2xl shadow-card p-10 text-center">
                <p className="text-[13px] text-muted-foreground">Sin resultados</p>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
