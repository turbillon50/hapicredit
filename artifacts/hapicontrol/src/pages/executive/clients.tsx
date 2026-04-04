import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { getListClientsQueryKey, useListClients } from "@workspace/api-client-react";
import { Link } from "wouter";
import { RiSearchLine, RiAddCircleLine, RiArrowRightLine } from "react-icons/ri";

const statusLabels: Record<string, string> = {
  current: "Al corriente",
  overdue: "En atraso",
  at_risk: "En riesgo",
  defaulted: "Vencido",
  inactive: "Inactivo",
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const text = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return <span className="text-[13px] font-bold text-white uppercase">{text}</span>;
}

const avatarColors: Record<string, string> = {
  current: "#1a3a6b",
  overdue: "#b45309",
  at_risk: "#d97706",
  defaulted: "#dc2626",
  inactive: "#94a3b8",
};

export default function ExecutiveClients() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useListClients(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListClientsQueryKey({ executiveId: user?.id }) } }
  );

  const filtered = clients?.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  ) ?? [];

  return (
    <Layout title="Mi Cartera">
      <div className="space-y-4">

        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar cliente o teléfono..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/clients/new">
            <button className="h-10 w-10 flex items-center justify-center bg-primary rounded-xl shadow-card active:opacity-80 transition-opacity">
              <RiAddCircleLine className="w-5 h-5 text-white" />
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0,1,2,3].map(i => <div key={i} className="h-[70px] bg-white rounded-2xl shadow-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              {search ? "Sin resultados para tu búsqueda" : "No tienes clientes asignados"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 active:bg-secondary transition-colors">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: avatarColors[client.status] ?? "#1a3a6b" }}>
                    <Initials name={client.fullName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{client.fullName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{client.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full status-${client.status}`}>
                      {statusLabels[client.status] ?? client.status}
                    </span>
                    <RiArrowRightLine className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && clients && clients.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            {filtered.length} de {clients.length} clientes
          </p>
        )}
      </div>
    </Layout>
  );
}
