import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/hapi/Button";
import { IconCheck, IconMoneda, IconBuscar, IconAlerta, IconReloj } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const todayStr = () => new Date().toISOString().split("T")[0];

export default function ExecutiveCobrar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Efectivo");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["exec-clients", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/clients`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar clientes");
      return r.json();
    },
    enabled: !!user?.id,
  });

  // Load active credit when client is selected
  const { data: credits = [], isLoading: creditsLoading } = useQuery<any[]>({
    queryKey: ["client-credits-cobrar", selectedClient?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/credits?clientId=${selectedClient!.id}`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar crédito");
      return r.json();
    },
    enabled: !!selectedClient?.id,
  });

  const activeCredit = (credits as any[]).find((c: any) => c.status === "active");

  const payMut = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch(`${API}/payments`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error al registrar");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-clients"] });
      qc.invalidateQueries({ queryKey: ["client-credits-cobrar"] });
      setSuccess(true);
      setSelectedClient(null);
      setClientSearch("");
      setAmount("");
      setMethod("Efectivo");
      setNotes("");
      setTimeout(() => setSuccess(false), 4000);
    },
  });

  const filteredClients = (clients as any[]).filter(c =>
    !selectedClient && clientSearch.length >= 2 &&
    c.fullName?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  function selectClient(c: any) {
    setSelectedClient(c);
    setClientSearch(c.fullName);
    setAmount("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedClient) { setError("Selecciona un cliente."); return; }
    if (!activeCredit) { setError("Este cliente no tiene un crédito activo."); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setError("Ingresa un monto válido."); return; }

    try {
      await payMut.mutateAsync({
        clientId: selectedClient.id,
        creditId: activeCredit.id,
        executiveId: user?.id,
        amountPaid: parseFloat(amount),
        paymentDate: todayStr(),
        notes: notes ? `${method} - ${notes}` : method,
      });
    } catch (err: any) {
      setError(err.message ?? "Error al registrar el pago.");
    }
  }

  const daysOverdue = activeCredit ? (() => {
    const disburse = new Date(activeCredit.disbursementDate);
    const nextDue = new Date(disburse);
    nextDue.setDate(nextDue.getDate() + (activeCredit.currentPaymentNumber + 1) * 7);
    const diff = Math.floor((Date.now() - nextDue.getTime()) / 86400000);
    return Math.max(0, diff);
  })() : 0;

  return (
    <Layout>
      <div className="px-4 pt-4 pb-24">

        <h1 className="text-xl font-bold text-gray-900 mb-1">Registrar Cobro</h1>
        <p className="text-sm text-gray-500 mb-6">Registra el pago semanal de un cliente</p>

        {success && (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-5 text-sm font-semibold" style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
            <IconCheck size={20} />
            Pago registrado — pendiente de validación por el admin.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Client selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Cliente</label>
            {selectedClient ? (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl border-2 pressable"
                style={{ borderColor: "var(--accent)", background: "var(--surface-3)" }}
                onClick={() => { setSelectedClient(null); setClientSearch(""); setAmount(""); }}
              >
                <IconMoneda size={20} color="#2563eb" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{selectedClient.fullName}</div>
                  <div className="text-xs text-blue-500">{selectedClient.phone} · Toca para cambiar</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconBuscar size={18} color="var(--text-muted)" /></span>
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="input-base search"
                  />
                </div>
                {filteredClients.length > 0 && (
                  <div className="card p-0 overflow-hidden border border-gray-100">
                    {filteredClients.slice(0, 6).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        onClick={() => selectClient(c)}
                      >
                        <span className="font-medium text-gray-900">{c.fullName}</span>
                        <span className="text-xs text-gray-400">{c.status === "current" ? "Al corriente" : c.status === "at_risk" ? "En riesgo" : "Vencido"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active credit info */}
          {selectedClient && (
            <div>
              {creditsLoading ? (
                <div className="rounded-2xl p-4 bg-gray-50 text-sm text-gray-400 text-center">Cargando crédito...</div>
              ) : activeCredit ? (
                <div className="rounded-2xl p-4 border-2" style={{ background: "var(--surface-3)", borderColor: "var(--success)" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Crédito activo</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      Semana {activeCredit.currentPaymentNumber + 1} de {activeCredit.termWeeks}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Pago esperado</div>
                      <div className="text-lg font-extrabold text-gray-900">{fmt(activeCredit.weeklyPayment)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Saldo restante</div>
                      <div className="text-lg font-bold text-gray-700">{fmt(activeCredit.remainingBalance)}</div>
                    </div>
                  </div>
                  {daysOverdue > 0 && (
                    <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                      <IconAlerta size={14} color="var(--danger)" />
                      <span className="text-xs text-red-600 font-semibold">
                        {daysOverdue} día(s) de atraso · Multa estimada: {fmt(daysOverdue * 200)}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmount(String(activeCredit.weeklyPayment))}
                    className="mt-3 w-full text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl py-2 pressable"
                  >
                    Usar pago semanal ({fmt(activeCredit.weeklyPayment)})
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl p-4 bg-yellow-50 border border-yellow-100 flex items-center gap-3">
                  <IconReloj size={18} color="#ca8a04" />
                  <span className="text-sm text-yellow-700 font-medium">Este cliente no tiene un crédito activo.</span>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          {activeCredit && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monto cobrado (MXN)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-base text-lg font-bold"
                  required
                />
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) < activeCredit.weeklyPayment && (
                  <p className="text-xs text-orange-500 mt-1 px-1">Pago parcial — saldo restante: {fmt(activeCredit.weeklyPayment - parseFloat(amount))}</p>
                )}
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Metodo de pago</label>
                <div className="flex gap-2">
                  {["Efectivo", "Transferencia", "Otro"].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all pressable ${method === m ? "text-white" : "bg-gray-100 text-gray-600"}`}
                      style={method === m ? { background: "var(--accent)" } : {}}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Notas (opcional)</label>
                <textarea
                  placeholder="Observaciones del cobro..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="input-base"
                  style={{ height: "auto", paddingTop: "12px", paddingBottom: "12px", resize: "none" }}
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          {activeCredit && (
            <Button type="submit" size="lg" fullWidth loading={payMut.isPending}>
              <IconCheck size={18} />
              Confirmar cobro
            </Button>
          )}
        </form>
      </div>
    </Layout>
  );
}
