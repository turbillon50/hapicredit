import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Badge, statusBadge } from "@/components/hapi/Badge";
import { Avatar } from "@/components/hapi/Avatar";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { RiSearchLine, RiFileListLine, RiCalendarLine } from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

type CarteraItem = {
  clientId: number;
  clientName: string;
  executiveName: string;
  creditId: number;
  originalAmount: number;
  remainingBalance: number;
  nextPaymentDate: string | null;
  daysOverdue: number;
  overdueAmount: number;
  status: string;
};

function fetchPortfolio(): Promise<CarteraItem[]> {
  return fetch(`${API}/dashboard/admin/portfolio-detail`, { headers: auth() }).then(r => r.json());
}

function overdueVariant(days: number) {
  if (days > 30) return "danger";
  if (days > 7)  return "orange";
  if (days > 0)  return "warning";
  return "success";
}

export default function AdminCartera() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [execFilter, setExecFilter] = useState("todos");

  const { data = [], isLoading } = useQuery({
    queryKey: ["portfolio-detail"],
    queryFn: fetchPortfolio,
  });

  const executives = [...new Set(data.map(d => d.executiveName))];

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    const matchName = item.clientName.toLowerCase().includes(q);
    const matchExec = execFilter === "todos" || item.executiveName === execFilter;
    return matchName && matchExec;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Header */}
        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Cartera Detallada</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.length} crédito{data.length !== 1 ? "s" : ""} activo{data.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="px-4 flex flex-col gap-2.5">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="search"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base search"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setExecFilter("todos")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable ${execFilter === "todos" ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={execFilter === "todos" ? { background: "var(--accent)" } : {}}
            >
              Todos
            </button>
            {executives.map(ex => (
              <button
                key={ex}
                onClick={() => setExecFilter(ex)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable ${execFilter === ex ? "text-white" : "bg-gray-100 text-gray-600"}`}
                style={execFilter === ex ? { background: "var(--accent)" } : {}}
              >
                {ex.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<RiFileListLine />}
              title="Sin resultados"
              description="No se encontraron créditos con ese filtro."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(item => {
                const sb = statusBadge(item.status);
                const dvv = overdueVariant(item.daysOverdue);
                const isPastDue = item.nextPaymentDate && new Date(item.nextPaymentDate) < new Date();
                return (
                  <div key={item.creditId} className="card pressable" onClick={() => navigate(`/admin/expediente/${item.clientId}`)}>
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={item.clientName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{item.clientName}</div>
                        <div className="text-xs text-gray-500">{item.executiveName}</div>
                      </div>
                      <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Monto original</div>
                        <div className="text-sm font-bold text-gray-800">{fmt(item.originalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Saldo pendiente</div>
                        <div className="text-sm font-bold text-gray-800">{fmt(item.remainingBalance)}</div>
                      </div>
                    </div>

                    {/* Dates row */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: isPastDue ? "var(--danger)" : "var(--text-secondary)" }}>
                        <RiCalendarLine className="text-sm" />
                        <span>Próx. pago: <strong>{fmtDate(item.nextPaymentDate)}</strong></span>
                        {isPastDue && <span className="text-[10px] font-bold text-red-500">VENCIDO</span>}
                      </div>
                      {item.daysOverdue > 0 && (
                        <Badge variant={dvv as any} size="sm">{item.daysOverdue}d mora</Badge>
                      )}
                    </div>
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
