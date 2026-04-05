import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useListClients, useCreatePayment } from "@workspace/api-client-react";
import { Button } from "@/components/hapi/Button";
import { IconCheck, IconMoneda, IconBuscar } from "@/components/hapi/HapiIcons";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const todayStr = () => new Date().toISOString().split("T")[0];

export default function ExecutiveCobrar() {
  const { user } = useAuth();
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [amount, setAmount]   = useState("");
  const [method, setMethod]   = useState("Efectivo");
  const [notes, setNotes]     = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const { data: clients = [] } = useListClients({ executiveId: user?.id }, { query: {} });
  const payMut = useCreatePayment();

  const filteredClients = (clients as any[]).filter(c =>
    !selectedClient && clientSearch.length >= 2 &&
    c.fullName?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedClient) { setError("Selecciona un cliente."); return; }
    if (!amount || isNaN(parseFloat(amount))) { setError("Ingresa un monto válido."); return; }

    try {
      await payMut.mutateAsync({
        data: {
          clientId: selectedClient.id,
          executiveId: user?.id,
          amountPaid: parseFloat(amount).toString(),
          paymentDate: todayStr(),
          paymentMethod: method,
          notes: notes || undefined,
        } as any,
      });
      setSuccess(true);
      setSelectedClient(null);
      setClientSearch("");
      setAmount("");
      setMethod("Efectivo");
      setNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error al registrar el pago. Verifica los datos.");
    }
  };

  return (
    <Layout>
      <div className="px-4 pt-4 md:pt-0 pb-4">

        <h1 className="text-xl font-bold text-gray-900 mb-1">Registrar Cobro</h1>
        <p className="text-sm text-gray-500 mb-6">Registra el pago de un cliente</p>

        {success && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-5 text-sm font-semibold"
            style={{ background: "#d1fae5", color: "#065f46" }}
          >
            <IconCheck size={20} />
            Pago registrado correctamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Client selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Cliente
            </label>
            {selectedClient ? (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl border-2 pressable"
                style={{ borderColor: "var(--accent)", background: "#eff6ff" }}
                onClick={() => { setSelectedClient(null); setClientSearch(""); }}
              >
                <IconMoneda size={20} color="#2563eb" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{selectedClient.fullName}</div>
                  <div className="text-xs text-blue-600">Toca para cambiar</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconBuscar size={18} color="#9ca3af" /></span>
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
                    {filteredClients.slice(0, 5).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 pressable"
                        onClick={() => { setSelectedClient(c); setClientSearch(c.fullName); }}
                      >
                        <span className="font-medium text-gray-900">{c.fullName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Monto cobrado (MXN)
            </label>
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
            {amount && !isNaN(parseFloat(amount)) && (
              <div className="text-xs text-gray-500 mt-1.5 px-1">
                {fmt(parseFloat(amount))}
              </div>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Método de pago
            </label>
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
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Notas (opcional)
            </label>
            <textarea
              placeholder="Observaciones del cobro..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="input-base"
              style={{ height: "auto", paddingTop: "12px", paddingBottom: "12px", resize: "none" }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={payMut.isPending}
          >
            <IconCheck size={18} />
            Confirmar cobro
          </Button>
        </form>
      </div>
    </Layout>
  );
}
