import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useListClients } from "@workspace/api-client-react";
import { Link } from "wouter";
import { IconFlecha } from "@/components/hapi/HapiIcons";

const statusLabels: Record<string, string> = {
  current: "Al corriente",
  overdue: "En atraso",
  at_risk: "En riesgo",
  defaulted: "Vencido",
  inactive: "Inactivo",
};

const avatarColors: Record<string, string> = {
  current: "#15803d",
  overdue: "#b45309",
  at_risk: "#d97706",
  defaulted: "#dc2626",
  inactive: "#94a3b8",
};

export default function AdminClients() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useListClients({}, { query: {} });

  const filtered = clients?.filter((c: any) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  ) ?? [];

  const counts = {
    current: clients?.filter((c: any) => c.status === "current").length ?? 0,
    overdue: clients?.filter((c: any) => c.status === "overdue" || c.status === "at_risk").length ?? 0,
    defaulted: clients?.filter((c: any) => c.status === "defaulted").length ?? 0,
  };

  return (
    <Layout title="Cartera General">
      <div className="space-y-4">

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Al corriente", count: counts.current, color: "#15803d", bg: "#f0fdf4" },
            { label: "En atraso", count: counts.overdue, color: "#b45309", bg: "#fffbeb" },
            { label: "Vencidos", count: counts.defaulted, color: "#dc2626", bg: "#fef2f2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-card p-3 text-center">
              <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-[9px] font-semibold text-muted-foreground leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2"/><path d="M16 16l5 5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg></span>
          <input
            type="search"
            placeholder="Buscar cliente..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-card"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[70px] bg-white rounded-2xl shadow-card animate-pulse" />
          ))
        ) : (
          <div className="space-y-2.5">
            {filtered.map((client: any) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 active:bg-secondary transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: avatarColors[client.status] ?? "#1B5FBC" }}>
                    <span className="text-[11px] font-bold text-white uppercase">
                      {client.fullName.trim().split(" ").slice(0,2).map((p: string) => p[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{client.fullName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{client.phone} · {client.executiveName ?? "Sin asesor"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-semibold px-2 py-1 rounded-full status-${client.status}`}>
                      {statusLabels[client.status] ?? client.status}
                    </span>
                    <IconFlecha size={14} color="#9ca3af" />
                  </div>
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
