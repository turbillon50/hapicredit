import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  useCreatePayment,
  getListClientsQueryKey,
  useListClients,
  getListCreditsQueryKey,
  useListCredits,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { RiMoneyDollarCircleLine, RiCheckLine } from "react-icons/ri";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function ExecutivePaymentsNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const createPayment = useCreatePayment();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clients } = useListClients(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListClientsQueryKey({ executiveId: user?.id }) } }
  );

  const { data: credits } = useListCredits(
    { clientId: Number(selectedClientId) },
    { query: { enabled: !!selectedClientId, queryKey: getListCreditsQueryKey({ clientId: Number(selectedClientId) }) } }
  );

  const activeCredits = credits?.filter((c: any) => c.status === "active") ?? [];
  const selectedCredit = activeCredits.find((c: any) => c.id.toString() === selectedCreditId);

  useEffect(() => {
    if (activeCredits.length === 1) {
      setSelectedCreditId(activeCredits[0].id.toString());
      setAmount(String(activeCredits[0].weeklyPayment ?? ""));
    }
  }, [credits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedCreditId || !amount) return;
    try {
      await createPayment.mutateAsync({
        data: {
          clientId: Number(selectedClientId),
          creditId: Number(selectedCreditId),
          amountPaid: Number(amount),
          paymentDate: new Date().toISOString(),
          executiveId: user?.id,
          notes,
        }
      });
      toast({ title: "Pago registrado correctamente" });
      setLocation(`/clients/${selectedClientId}`);
    } catch {
      toast({ title: "No se pudo registrar el pago", variant: "destructive" });
    }
  };

  return (
    <Layout title="Registrar Pago">
      <div className="space-y-4">

        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Seleccionar cliente</p>
          <div className="space-y-2">
            {clients?.map((client: any) => (
              <button
                key={client.id}
                type="button"
                onClick={() => { setSelectedClientId(client.id.toString()); setSelectedCreditId(""); setAmount(""); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedClientId === client.id.toString()
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#1a3a6b" }}>
                  <span className="text-[11px] font-bold text-white uppercase">
                    {client.fullName.trim().split(" ").slice(0,2).map((p: string) => p[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{client.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{client.phone}</p>
                </div>
                {selectedClientId === client.id.toString() && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <RiCheckLine className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedClientId && activeCredits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Crédito</p>
            {activeCredits.map((credit: any) => (
              <button
                key={credit.id}
                type="button"
                onClick={() => { setSelectedCreditId(credit.id.toString()); setAmount(String(credit.weeklyPayment ?? "")); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedCreditId === credit.id.toString()
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-foreground">Crédito #{credit.id}</p>
                  <p className="text-[11px] text-muted-foreground">Saldo: {fmt(credit.remainingBalance ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-primary">{fmt(credit.weeklyPayment ?? 0)}</p>
                  <p className="text-[10px] text-muted-foreground">semanal</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedCreditId && (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monto recibido</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[15px]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full h-14 pl-8 pr-4 bg-background border border-border rounded-xl text-[22px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              {selectedCredit && (
                <p className="text-[12px] text-muted-foreground">
                  Pago sugerido: <span className="font-semibold text-foreground">{fmt(selectedCredit.weeklyPayment ?? 0)}</span>
                </p>
              )}
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1.5 block">Notas (opcional)</label>
                <textarea
                  className="w-full h-20 px-3.5 py-3 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                  placeholder="Observaciones del cobro..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={createPayment.isPending}
                className="w-full h-12 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #1a3a6b, #2454a3)" }}
              >
                <RiMoneyDollarCircleLine className="w-5 h-5" />
                {createPayment.isPending ? "Procesando..." : "Confirmar pago"}
              </button>
            </div>
          </form>
        )}

      </div>
    </Layout>
  );
}
