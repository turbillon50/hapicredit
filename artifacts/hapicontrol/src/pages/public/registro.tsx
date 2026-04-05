import { useState } from "react";
import {
  IconEscudo, IconFlecha, IconCheck,
  IconLoader, IconAlerta, IconTelefono, IconPerfil,
  IconWhatsapp, IconCandado,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

export default function Registro() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, "").length === 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          phone: phone.trim(),
          requestedAmount: parseFloat(amount) || 0,
          termWeeks: 12,
          purpose: "No especificado",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setDone(data.referenceNumber);
    } catch (e: any) {
      setError(e.message ?? "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#f0f4ff" }}>

      {/* Hero header */}
      <div
        className="flex flex-col items-center text-center px-6 pt-14 pb-12"
        style={{ background: "linear-gradient(160deg,#0f1e3d 0%,#1e3a7b 60%,#2563eb 100%)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl text-white"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <IconEscudo size={30} color="#fff" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">HapiCredit</h1>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">
          Créditos rápidos y transparentes para hacer crecer tu negocio o atender tus necesidades
        </p>
      </div>

      <div className="flex-1 px-5 py-8 flex flex-col gap-5 max-w-md mx-auto w-full">

        {done ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <IconCheck size={36} color="#22c55e" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Gracias por tu interés!</h2>
            <p className="text-sm text-gray-500 mb-5">
              Recibimos tu solicitud. Un asesor de HapiCredit se comunicará contigo a la brevedad para orientarte.
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 mb-6">
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Folio</div>
              <div className="text-2xl font-extrabold text-blue-700">{done}</div>
              <div className="text-xs text-gray-400 mt-1">Guárdalo como referencia</div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/521XXXXXXXXXX"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-white text-sm font-semibold"
                style={{ background: "#25d366" }}
              >
                <IconWhatsapp size={20} color="#fff" /> Escríbenos por WhatsApp
              </a>
              <button
                onClick={() => { setDone(null); setName(""); setPhone(""); setAmount(""); }}
                className="w-full mt-1 text-sm text-gray-400 py-2 pressable"
              >
                Enviar otra solicitud
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">¿Te interesa un crédito?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Déjanos tus datos y un asesor te contactará personalmente
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { icon: "⚡", title: "Aprobación en 24 hrs", desc: "Respuesta rápida de tu asesor asignado" },
                { icon: "💰", title: "Desde $500 hasta $30,000", desc: "Montos adaptados a tu necesidad" },
                { icon: "📅", title: "Pagos semanales cómodos", desc: "Plazos de 8 a 24 semanas" },
              ].map(b => (
                <div key={b.title} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{b.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-base font-bold text-gray-900">Regístrate ahora</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><IconPerfil size={16} color="#9ca3af" /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre y apellidos"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Teléfono celular <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><IconTelefono size={16} color="#9ca3af" /></span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="10 dígitos"
                    maxLength={10}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400">Tu asesor te llamará a este número</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  ¿Cuánto necesitas? <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Monto aproximado en pesos"
                  min={500}
                  max={30000}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <span className="shrink-0"><IconAlerta size={16} color="#ef4444" /></span>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-sm font-bold transition-all pressable"
                style={{
                  background: canSubmit && !submitting ? "linear-gradient(135deg,#1e40af,#3b82f6)" : "#e5e7eb",
                  color: canSubmit && !submitting ? "white" : "#9ca3af",
                }}
              >
                {submitting
                  ? <><IconLoader size={16} className="animate-spin" /> Enviando...</>
                  : <>Quiero ser cliente <IconFlecha size={16} color="#fff" /></>
                }
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <IconCandado size={14} color="#d1d5db" />
              <p className="text-xs text-gray-400">Tu información es confidencial y está protegida</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
