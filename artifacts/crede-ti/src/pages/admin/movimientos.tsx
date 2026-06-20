import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import {
  IconFlechaIzquierda,
  IconMoneda,
  IconNomina,
  IconMas,
  IconCaja,
  IconAlerta,
  IconCartera,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(n);

const fmtDate = (dateStr: string) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" }).toUpperCase();
};

const fmtTime = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true });
};

type LedgerEntry = {
  id: string;
  date: string;
  type: string;
  description: string;
  detail: string;
  amount: number;
  createdAt: string;
};

type LedgerData = {
  executiveId: number;
  executiveName: string;
  balance: number;
  totalPortfolio: number;
  totalDisbursed: number;
  totalCollected: number;
  activeCredits: number;
  totalClients: number;
  entries: LedgerEntry[];
};

function getEntryIcon(type: string) {
  switch (type) {
    case "income":
    case "late_fee":
      return <IconMoneda size={16} color="#16a34a" />;
    case "disbursement":
      return <IconCartera size={16} color="#dc2626" />;
    case "payroll":
      return <IconNomina size={16} color="#d97706" />;
    case "capital":
      return <IconCaja size={16} color="var(--text-secondary)" />;
    case "expense":
      return <IconAlerta size={16} color="#dc2626" />;
    default:
      return <IconMoneda size={16} color="var(--text-muted)" />;
  }
}

function getEntryIconBg(type: string) {
  switch (type) {
    case "income":
    case "late_fee":
      return "rgba(22,163,74,0.1)";
    case "disbursement":
      return "rgba(220,38,38,0.1)";
    case "payroll":
      return "rgba(217,119,6,0.1)";
    case "capital":
      return "rgba(124,58,237,0.1)";
    case "expense":
      return "rgba(220,38,38,0.1)";
    default:
      return "rgba(107,114,128,0.1)";
  }
}

const EXPENSE_TYPES = [
  { value: "payroll", label: "Nomina" },
  { value: "capital", label: "Capital Prestamos" },
  { value: "expense", label: "Otro gasto" },
];

type EditTarget = { id: string; amount: number; description: string };

export default function AdminMovimientos() {
  const [, params] = useRoute("/admin/movimientos/:id");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const executiveId = parseInt(params?.id ?? "0");

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("payroll");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EditTarget | null>(null);

  const { data, isLoading } = useQuery<LedgerData>({
    queryKey: ["executive-ledger", executiveId],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/admin/executive-ledger?executiveId=${executiveId}`, {
        headers: auth(),
      });
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
    enabled: executiveId > 0,
  });

  const addExpense = useMutation({
    mutationFn: async (body: { movementType: string; amount: number; description: string }) => {
      const r = await fetch(`${API}/caja`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, executiveId }),
      });
      if (!r.ok) throw new Error("Failed to save");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-ledger", executiveId] });
      setShowForm(false);
      setFormAmount("");
      setFormDesc("");
    },
  });

  const editExpense = useMutation({
    mutationFn: async ({ id, amount, description }: { id: string; amount: number; description: string }) => {
      const r = await fetch(`${API}/caja/${id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description }),
      });
      if (!r.ok) throw new Error("Error al editar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-ledger", executiveId] });
      setEditTarget(null);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${API}/caja/${id}`, {
        method: "DELETE",
        headers: auth(),
      });
      if (!r.ok) throw new Error("Error al eliminar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-ledger", executiveId] });
      setDeleteTarget(null);
    },
  });

  const handleSubmitExpense = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;
    const label = EXPENSE_TYPES.find((t) => t.value === formType)?.label ?? "Gasto";
    addExpense.mutate({
      movementType: formType,
      amount,
      description: formDesc || label,
    });
  };

  const groupedEntries = (data?.entries ?? []).reduce<Record<string, LedgerEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-24">
        <div className="flex items-center gap-3 px-4 pt-4 md:pt-0">
          <button
            onClick={() => navigate("/admin/caja")}
            className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center"
          >
            <IconFlechaIzquierda size={16} color="var(--foreground)" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Libro de Movimientos</h1>
            {data && (
              <p className="text-xs text-muted-foreground">Prestamos {data.executiveName}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 space-y-3">
            <div className="h-24 bg-white rounded-2xl shadow-card animate-pulse" />
            <div className="h-16 bg-white rounded-2xl shadow-card animate-pulse" />
            <div className="h-16 bg-white rounded-2xl shadow-card animate-pulse" />
          </div>
        ) : data ? (
          <>
            <div className="px-4">
              <div
                className="rounded-2xl p-5 shadow-card-md"
                style={{ background: "linear-gradient(135deg, #1A4FE0, #215DFF)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={data.executiveName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-white">{data.executiveName}</p>
                    <p className="text-[10px] text-white/50">
                      {data.totalClients} clientes | {data.activeCredits} créditos activos
                    </p>
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Balance
                </p>
                <p className={`text-[32px] font-bold ${data.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(data.balance)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Total cobrado
                    </p>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(data.totalCollected)}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Total desembolsado
                    </p>
                    <p className="text-sm font-semibold text-red-400">{fmt(data.totalDisbursed)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                style={{ background: "var(--accent)" }}
              >
                <IconMas size={16} color="white" />
                Agregar gasto
              </button>
            </div>

            {showForm && (
              <div className="px-4">
                <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Nuevo movimiento
                  </p>

                  <div className="flex gap-2">
                    {EXPENSE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setFormType(t.value)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: formType === t.value ? "var(--accent)" : "var(--surface-2)",
                          color: formType === t.value ? "white" : "var(--foreground)",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monto ($)"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitExpense}
                      disabled={addExpense.isPending || !formAmount}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: "var(--accent)" }}
                    >
                      {addExpense.isPending ? "Guardando..." : "Registrar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                    {fmtDate(date)}
                  </p>
                  <div className="bg-white rounded-2xl shadow-card divide-y divide-border overflow-hidden">
                    {groupedEntries[date].map((entry) => {
                      const isCaja = entry.id.startsWith("caja-");
                      const cajaId = isCaja ? entry.id.replace("caja-", "") : null;
                      return (
                        <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: getEntryIconBg(entry.type) }}
                          >
                            {getEntryIcon(entry.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">
                              {entry.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{entry.detail}</p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <p className={`text-sm font-bold ${entry.amount >= 0 ? "text-foreground" : "text-red-500"}`}>
                                {entry.amount >= 0 ? "" : "-"}{fmt(Math.abs(entry.amount))}
                              </p>
                              <p className="text-[9px] text-muted-foreground">{fmtTime(entry.createdAt)}</p>
                            </div>
                            {isCaja && cajaId && (
                              <div className="flex flex-col gap-1 ml-1">
                                <button
                                  onClick={() => {
                                    setEditTarget({ id: cajaId, amount: Math.abs(entry.amount), description: entry.detail !== `Prestamos ${data.executiveName}` ? entry.detail : entry.description });
                                    setEditAmount(String(Math.abs(entry.amount)));
                                    setEditDesc(entry.detail !== `Prestamos ${data.executiveName}` ? entry.detail : entry.description);
                                  }}
                                  style={{ background: "var(--surface-3)", border: "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#1d4ed8" }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ id: cajaId, amount: Math.abs(entry.amount), description: entry.description })}
                                  style={{ background: "var(--surface-3)", border: "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#dc2626" }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {sortedDates.length === 0 && (
                <div className="text-center py-12">
                  <IconCaja size={40} color="var(--muted-foreground)" />
                  <p className="text-sm text-muted-foreground mt-3">
                    No hay movimientos registrados
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Modal editar gasto */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px" }}>Editar movimiento</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Monto ($)"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
              <input
                type="text"
                placeholder="Descripción"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            <button
              onClick={() => editExpense.mutate({ id: editTarget.id, amount: parseFloat(editAmount), description: editDesc })}
              disabled={editExpense.isPending || !editAmount}
              style={{ width: "100%", padding: 14, background: "#215DFF", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: editExpense.isPending ? "default" : "pointer", marginBottom: 10, opacity: editExpense.isPending ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {editExpense.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              onClick={() => setEditTarget(null)}
              style={{ width: "100%", padding: 14, background: "transparent", color: "var(--text-secondary)", border: "1.5px solid var(--border)", borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal eliminar gasto */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>Eliminar movimiento</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
              Vas a eliminar <strong>{deleteTarget.description}</strong> por <strong>{fmt(deleteTarget.amount)}</strong>. Esta acción no se puede deshacer.
            </p>
            <button
              onClick={() => deleteExpense.mutate(deleteTarget.id)}
              disabled={deleteExpense.isPending}
              style={{ width: "100%", padding: 14, background: "#ef4444", color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: deleteExpense.isPending ? "default" : "pointer", marginBottom: 10, opacity: deleteExpense.isPending ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {deleteExpense.isPending ? "Eliminando..." : "Eliminar"}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ width: "100%", padding: 14, background: "transparent", color: "var(--text-secondary)", border: "1.5px solid var(--border)", borderRadius: 14, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
