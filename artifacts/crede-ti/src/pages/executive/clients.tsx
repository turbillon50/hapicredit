import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useListClients } from "@workspace/api-client-react";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge, statusBadge } from "@/components/hapi/Badge";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { useLocation } from "wouter";
import { IconBuscar, IconPersona, IconFlecha, IconMas } from "@/components/hapi/HapiIcons";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const STATUS_FILTER: { key: string; label: string }[] = [
  { key: "todos",     label: "Todos"      },
  { key: "current",   label: "Al corriente" },
  { key: "overdue",   label: "En atraso"  },
  { key: "defaulted", label: "Vencido"    },
];

export default function ExecutiveClients() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("todos");

  const { data: clients = [], isLoading } = useListClients({
    executiveId: user?.id,
  });

  const filtered = (clients as any[]).filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.fullName?.toLowerCase().includes(q) || c.phone?.includes(q);
    const matchStatus = statusF === "todos" || c.status === statusF;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        <div className="px-4 pt-4 md:pt-0 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Mis Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{(clients as any[]).length} clientes en cartera</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/alta-cliente")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold pressable"
            style={{ background: "var(--accent)" }}
          >
            <IconMas size={16} color="#fff" /> Nuevo
          </button>
        </div>

        <div className="px-4 flex flex-col gap-2.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconBuscar size={18} color="var(--text-muted)" /></span>
            <input
              type="search"
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base search"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {STATUS_FILTER.map(sf => (
              <button
                key={sf.key}
                onClick={() => setStatusF(sf.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable ${statusF === sf.key ? "text-white" : "bg-gray-100 text-gray-600"}`}
                style={statusF === sf.key ? { background: "var(--accent)" } : {}}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<IconPersona />}
              title="Sin clientes"
              description="No se encontraron clientes con ese filtro."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((client: any) => {
                const sb = statusBadge(client.status);
                return (
                  <div key={client.id} className="card pressable" onClick={() => navigate(`/dashboard/expediente/${client.id}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar name={client.fullName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 truncate">{client.fullName}</span>
                          <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {client.phone && (
                            <span className="text-xs text-gray-500">{client.phone}</span>
                          )}
                          {client.loanBalance && (
                            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                              {fmt(parseFloat(client.loanBalance))}
                            </span>
                          )}
                        </div>
                      </div>
                      <IconFlecha size={20} color="var(--text-muted)" />
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
