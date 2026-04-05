import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconMoneda, IconFlecha, IconCheck,
  IconLoader, IconAlerta, IconDocumento,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("hapi_token")}`,
  "Content-Type": "application/json",
});

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const TERM_OPTIONS = [8, 12, 16, 20, 24];
const PURPOSES = [
  "Capital de trabajo / negocio",
  "Educación",
  "Salud y gastos médicos",
  "Mejoras al hogar",
  "Pago de deudas",
  "Otro",
];

export default function ClientSolicitar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(3000);
  const [termWeeks, setTermWeeks] = useState(12);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const weeklyPayment = (amount * 1.10) / termWeeks;
  const totalPayment = amount * 1.10;

  const mut = useMutation({
    mutationFn: () =>
      fetch(`${API}/credits/apply`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          clientId: user?.clientId,
          amount,
          termWeeks,
          notes: `${purpose}${notes ? " — " + notes : ""}`,
        }),
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Error al enviar");
        return data;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      setSubmitted(true);
    },
    onError: (e: any) => setError(e.message),
  });

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <IconCheck size={36} color="#22c55e" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-sm text-gray-500 mb-2 max-w-xs">
            Tu asesor revisará tu solicitud y te contactará pronto.
          </p>
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 w-full max-w-xs">
            <div className="text-xs text-blue-600 font-semibold mb-1">Monto solicitado</div>
            <div className="text-3xl font-extrabold text-blue-700">{fmt(amount)}</div>
            <div className="text-xs text-gray-400 mt-1">{termWeeks} semanas · {fmt(weeklyPayment)}/sem</div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setPurpose(""); setNotes(""); }}
            className="text-sm text-blue-600 font-semibold pressable"
          >
            Hacer otra solicitud
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-8 px-4 pt-4 md:pt-0">

        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitar crédito</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selecciona el monto y plazo que necesitas</p>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Monto solicitado</label>
            <div className="text-4xl font-extrabold text-center py-3" style={{ color: "var(--accent)" }}>
              {fmt(amount)}
            </div>
            <input
              type="range" min={500} max={30000} step={500}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$500</span><span>$30,000</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Plazo de pago</label>
            <div className="grid grid-cols-5 gap-2">
              {TERM_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTermWeeks(t)}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all pressable ${termWeeks === t ? "text-white" : "border-gray-200 bg-white text-gray-600"}`}
                  style={termWeeks === t ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                >
                  {t}<span className="text-[10px] font-normal block -mt-0.5">sem</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex justify-around text-sm"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Pago semanal</div>
              <div className="font-extrabold text-lg" style={{ color: "var(--accent)" }}>{fmt(weeklyPayment)}</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Total a pagar</div>
              <div className="font-extrabold text-lg text-gray-800">{fmt(totalPayment)}</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Interés</div>
              <div className="font-extrabold text-lg text-gray-800">10%</div>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Destino del crédito <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2">
              {PURPOSES.map(p => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left font-medium transition-all pressable ${purpose === p ? "text-white" : "border-gray-200 bg-white text-gray-700"}`}
                  style={purpose === p ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                >
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${purpose === p ? "border-white" : "border-gray-300"}`}>
                    {purpose === p && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Comentarios adicionales</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe brevemente para qué usarás el crédito..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <span className="shrink-0"><IconAlerta size={20} color="#ef4444" /></span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={() => mut.mutate()}
          disabled={!purpose || mut.isPending}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white text-sm font-bold transition-all pressable"
          style={{
            background: purpose && !mut.isPending ? "var(--accent)" : "#e5e7eb",
            color: purpose && !mut.isPending ? "white" : "#9ca3af",
          }}
        >
          {mut.isPending
            ? <><IconLoader size={16} className="animate-spin" /> Enviando...</>
            : <><IconDocumento size={16} /> Enviar solicitud</>
          }
        </button>
      </div>
    </Layout>
  );
}
