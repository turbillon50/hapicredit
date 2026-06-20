import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/hapi/Avatar";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { IconCartera, IconCalendario, IconAlerta } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const DAILY_FINE = 200;

const fmt = (n: number | null | undefined) =>
  n == null ? "---" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) => {
  if (!d) return "---";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const DAY_NAMES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DAY_LABELS: Record<string, string> = {
  domingo: "Domingo",
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
};

function getDayOfWeek(dateStr: string | null): string {
  if (!dateStr) return "sin_fecha";
  const dt = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[dt.getDay()];
}

type CarteraItem = {
  clientId: number;
  clientName: string;
  clientStatus: string;
  executiveName: string;
  creditAmount: number;
  remainingBalance: number;
  weeklyPayment: number;
  termWeeks: number;
  currentPaymentNum: number;
  openingFee: number;
  nextPaymentDate: string | null;
  daysOverdue: number;
  disbursementDate: string | null;
  hasActiveCredit: boolean;
  totalLateFees: number;
};

function fetchPortfolio(): Promise<CarteraItem[]> {
  return fetch(`${API}/dashboard/admin/portfolio-detail`, { headers: auth() }).then(r => r.json());
}

function semaphoreColor(status: string, daysOverdue: number) {
  if (status === "defaulted" || daysOverdue >= 31) return { bg: "#1a1a1a", text: "#fff", label: "Cartera vencida", dot: "#000" };
  if (status === "overdue" || daysOverdue >= 16)   return { bg: "rgba(224,36,36,0.10)", text: "#991b1b", label: "Atraso critico", dot: "#ef4444" };
  if (status === "at_risk" || daysOverdue >= 1)    return { bg: "rgba(217,142,30,0.10)", text: "#92400e", label: "Atraso leve", dot: "#f59e0b" };
  return                                           { bg: "rgba(14,159,110,0.10)", text: "#065f46", label: "Al corriente", dot: "#22c55e" };
}

type StatusFilter = "todos" | "current" | "at_risk" | "overdue" | "defaulted";
type ViewMode = "list" | "day";

function CreditCard({ item, navigate }: { item: CarteraItem; navigate: (path: string) => void }) {
  const sem = semaphoreColor(item.clientStatus, item.daysOverdue);
  const fines = item.daysOverdue > 0 ? item.daysOverdue * DAILY_FINE : 0;
  const progress = item.termWeeks > 0 ? (item.currentPaymentNum / item.termWeeks) * 100 : 0;
  const isPastDue = item.nextPaymentDate && new Date(item.nextPaymentDate) < new Date();

  return (
    <div className="card pressable" onClick={() => navigate(`/admin/expediente/${item.clientId}`)}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={item.clientName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{item.clientName}</div>
          <div className="text-xs text-gray-500">{item.executiveName}</div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: sem.bg, color: sem.text }}
        >
          {sem.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase">Monto</div>
          <div className="text-sm font-bold text-gray-800">{fmt(item.creditAmount)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase">Saldo</div>
          <div className="text-sm font-bold text-gray-800">{fmt(item.remainingBalance)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase">Semanal</div>
          <div className="text-sm font-bold text-gray-800">{fmt(item.weeklyPayment)}</div>
        </div>
      </div>

      <div className="mb-2.5">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Progreso: {item.currentPaymentNum}/{item.termWeeks} pagos</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: progress >= 80 ? "#22c55e" : "var(--accent)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: isPastDue ? "var(--danger)" : "var(--text-secondary)" }}>
          <IconCalendario size={14} />
          <span>Prox: <strong>{fmtDate(item.nextPaymentDate)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          {fines > 0 && (
            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
              <IconAlerta size={14} /> {fmt(fines)} multas
            </span>
          )}
          {item.daysOverdue > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sem.bg, color: sem.text }}>
              {item.daysOverdue}d
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCartera() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [execFilter, setExecFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const { data = [], isLoading } = useQuery({
    queryKey: ["portfolio-detail"],
    queryFn: fetchPortfolio,
  });

  const safeData = Array.isArray(data) ? data : [];
  const activeData = (safeData as CarteraItem[]).filter(d => d.hasActiveCredit);
  const executives = [...new Set(activeData.map(d => d.executiveName))];

  const filtered = activeData.filter(item => {
    const q = search.toLowerCase();
    const matchName = item.clientName.toLowerCase().includes(q);
    const matchExec = execFilter === "todos" || item.executiveName === execFilter;
    const matchStatus = statusFilter === "todos" ||
      (statusFilter === "current" && item.daysOverdue === 0 && item.clientStatus === "current") ||
      (statusFilter === "at_risk" && (item.clientStatus === "at_risk" || (item.daysOverdue >= 1 && item.daysOverdue < 16))) ||
      (statusFilter === "overdue" && (item.clientStatus === "overdue" || (item.daysOverdue >= 16 && item.daysOverdue < 31))) ||
      (statusFilter === "defaulted" && (item.clientStatus === "defaulted" || item.daysOverdue >= 31));
    return matchName && matchExec && matchStatus;
  });

  const totalPortfolio = activeData.reduce((s, d) => s + d.remainingBalance, 0);

  const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
    { key: "todos",     label: "Todos",        color: "var(--accent)" },
    { key: "current",   label: "Al corriente", color: "#22c55e" },
    { key: "at_risk",   label: "Riesgo",       color: "#f59e0b" },
    { key: "overdue",   label: "Mora",         color: "#ef4444" },
    { key: "defaulted", label: "Vencida",      color: "#000" },
  ];

  const groupedByDay = (() => {
    const groups: Record<string, CarteraItem[]> = {};
    for (const item of filtered) {
      const day = getDayOfWeek(item.nextPaymentDate);
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    }
    const orderedDays = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", "sin_fecha"];
    return orderedDays
      .filter(d => groups[d]?.length)
      .map(d => ({
        day: d,
        label: d === "sin_fecha" ? "Sin fecha asignada" : DAY_LABELS[d],
        items: groups[d],
        totalCobranza: groups[d].reduce((s, i) => s + i.weeklyPayment, 0),
        count: groups[d].length,
      }));
  })();

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        <div className="px-4 pt-4 md:pt-0 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cartera Detallada</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeData.length} crédito{activeData.length !== 1 ? "s" : ""} activo{activeData.length !== 1 ? "s" : ""} · Cartera: {fmt(totalPortfolio)}
            </p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("day")}
              className="p-2 rounded-md pressable"
              style={viewMode === "day" ? { background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : {}}
              title="Agrupar por día"
            >
              <IconCalendario size={16} color={viewMode === "day" ? "#2563eb" : "#9ca3af"} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-md pressable"
              style={viewMode === "list" ? { background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : {}}
              title="Lista"
            >
              <IconCartera size={16} color={viewMode === "list" ? "#2563eb" : "#9ca3af"} />
            </button>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-2.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2"/><path d="M16 16l5 5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg></span>
            <input
              type="search"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base search"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {STATUS_TABS.map(t => {
              const active = statusFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable ${active ? "text-white" : "bg-gray-100 text-gray-600"}`}
                  style={active ? { background: t.color } : {}}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setExecFilter("todos")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all pressable ${execFilter === "todos" ? "text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
              style={execFilter === "todos" ? { background: "var(--accent)" } : {}}
            >
              Todos
            </button>
            {executives.map(ex => (
              <button
                key={ex}
                onClick={() => setExecFilter(ex)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all pressable ${execFilter === ex ? "text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
                style={execFilter === ex ? { background: "var(--accent)" } : {}}
              >
                {ex.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<IconCartera />}
              title="Sin resultados"
              description="No se encontraron créditos con ese filtro."
            />
          ) : viewMode === "day" ? (
            <div className="flex flex-col gap-4">
              {groupedByDay.map(group => (
                <div key={group.day}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(37,99,235,0.1)" }}
                      >
                        <IconCalendario size={14} color="#2563eb" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{group.label}</div>
                        <div className="text-[10px] text-gray-400">
                          {group.count} cliente{group.count !== 1 ? "s" : ""} · Cobranza: {fmt(group.totalCobranza)}
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: "rgba(37,99,235,0.08)", color: "var(--accent)" }}
                    >
                      {fmt(group.totalCobranza)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.items.map(item => (
                      <CreditCard key={item.clientId} item={item} navigate={navigate} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(item => (
                <CreditCard key={item.clientId} item={item} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
