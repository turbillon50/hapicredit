import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Badge, urgencyBadge } from "@/components/hapi/Badge";
import { Avatar } from "@/components/hapi/Avatar";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { RiAlarmWarningLine, RiPhoneLine, RiCalendarCheckLine } from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

type MorosoItem = {
  clientId: number;
  clientName: string;
  executiveName: string;
  daysOverdue: number;
  overdueAmount: number;
  phone?: string;
};

function fetchMorosos(): Promise<MorosoItem[]> {
  return fetch(`${API}/dashboard/admin/portfolio-detail`, { headers: auth() })
    .then(r => r.json())
    .then((items: any[]) =>
      items
        .filter(i => i.daysOverdue > 0)
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
    );
}

type Tab = "critico" | "alto" | "medio";

const TABS: { key: Tab; label: string; min: number; max: number }[] = [
  { key: "critico", label: "Críticos",  min: 31,  max: Infinity },
  { key: "alto",    label: "Alto",      min: 8,   max: 30       },
  { key: "medio",   label: "Medio",     min: 1,   max: 7        },
];

function filterTab(items: MorosoItem[], tab: Tab) {
  const t = TABS.find(t => t.key === tab)!;
  return items.filter(i => i.daysOverdue >= t.min && i.daysOverdue <= t.max);
}

export default function AdminMorosos() {
  const [tab, setTab] = useState<Tab>("critico");
  const { data = [], isLoading } = useQuery({ queryKey: ["morosos"], queryFn: fetchMorosos });

  const filtered = filterTab(data, tab);
  const total = data.length;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        {/* Page header */}
        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Morosos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} cliente{total !== 1 ? "s" : ""} con atraso
          </p>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-2">
          {TABS.map(t => {
            const count = filterTab(data, t.key).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all pressable ${
                  active ? "text-white" : "text-gray-600 bg-gray-100"
                }`}
                style={active ? { background: "var(--accent)" } : {}}
              >
                {t.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<RiAlarmWarningLine />}
              title="Sin clientes en esta categoría"
              description="No hay clientes con este nivel de atraso en este momento."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(item => {
                const ub = urgencyBadge(item.daysOverdue);
                return (
                  <div key={item.clientId} className="card">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar name={item.clientName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">{item.clientName}</span>
                          <Badge variant={ub.variant} size="sm">{ub.label}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Asesor: {item.executiveName}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl p-2.5" style={{ background: "#fef3c7" }}>
                        <div className="text-[10px] font-semibold text-yellow-700 uppercase">Días en atraso</div>
                        <div className="text-lg font-bold text-yellow-800">{item.daysOverdue}d</div>
                      </div>
                      <div className="rounded-xl p-2.5" style={{ background: "#fee2e2" }}>
                        <div className="text-[10px] font-semibold text-red-700 uppercase">Monto vencido</div>
                        <div className="text-base font-bold text-red-800">{fmt(item.overdueAmount)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { if (item.phone) window.open(`tel:${item.phone}`) }}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all pressable"
                        style={{ background: "#dbeafe", color: "#1e40af" }}
                      >
                        <RiPhoneLine className="text-sm" /> Llamar
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all pressable"
                        style={{ background: "#d1fae5", color: "#065f46" }}
                      >
                        <RiCalendarCheckLine className="text-sm" /> Promesa
                      </button>
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
