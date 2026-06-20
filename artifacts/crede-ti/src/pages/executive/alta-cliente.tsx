import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconAtras, IconFlecha, IconCheck,
  IconCamara, IconSubir, IconCerrar,
  IconPersona, IconGrupo, IconID, IconMoneda,
  IconLoader, IconAlerta,
  IconDocumento, IconTelefono, IconUbicacion,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("credeti_token")}`,
  "Content-Type": "application/json",
});

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, 1000 / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type DocKey = "ine_front" | "ine_back" | "curp_doc" | "domicilio" | "ingresos";

const DOC_FIELDS: { key: DocKey; label: string; hint: string; required: boolean }[] = [
  { key: "ine_front",  label: "INE — frente",              hint: "Foto clara del frente de la identificación", required: true  },
  { key: "ine_back",   label: "INE — reverso",             hint: "Foto del reverso de la identificación",      required: true  },
  { key: "curp_doc",   label: "CURP",                       hint: "Impresión o imagen del CURP",               required: true  },
  { key: "domicilio",  label: "Comprobante de domicilio",  hint: "Recibo de luz, agua o gas (máx 3 meses)",    required: true  },
  { key: "ingresos",   label: "Comprobante de ingresos",   hint: "Estado de cuenta o constancia laboral",      required: false },
];

const TERMS = [4, 8, 13, 24, 36, 48];
const PURPOSES = [
  "Capital de trabajo / negocio",
  "Educación",
  "Salud y gastos médicos",
  "Mejoras al hogar",
  "Pago de deudas",
  "Otro",
];

function Field({
  label, value, onChange, type = "text", placeholder = "", required = false, hint = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function DocCapture({
  label, hint, required, value, onChange,
}: { label: string; hint: string; required: boolean; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try { onChange(await compressImage(file)); }
    finally { setLoading(false); }
  }, [onChange]);

  const isPdf = value?.startsWith("data:application/pdf");

  return (
    <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-800">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
        </div>
        {value && (
          <button onClick={() => onChange(null)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400">
            <IconCerrar size={16} />
          </button>
        )}
      </div>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
          {isPdf ? (
            <div className="flex items-center gap-3 bg-green-50 p-3">
              <IconDocumento size={28} color="#ef4444" />
              <div>
                <div className="text-sm font-semibold text-gray-800">PDF cargado</div>
                <div className="text-xs text-green-600 font-medium flex items-center gap-1">< IconCheck size={14} /> Listo</div>
              </div>
            </div>
          ) : (
            <>
              <img src={value} alt={label} className="w-full max-h-36 object-cover" />
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <IconCheck size={14} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { ref.current?.setAttribute("capture", "environment"); ref.current?.click(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-white pressable"
            style={{ background: "#1e40af" }}
          >
            {loading ? <IconLoader size={16} /> : <IconCamara size={16} />}
            Cámara
          </button>
          <button
            type="button"
            onClick={() => { ref.current?.removeAttribute("capture"); ref.current?.click(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 pressable"
          >
            <IconSubir size={16} /> Archivo
          </button>
        </div>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 px-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full transition-all duration-500"
          style={{ background: i < step ? "var(--accent)" : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

export default function AltaCliente() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const TOTAL = 3;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState("");
  const [curp, setCurp] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [internalNotes, setInternalNotes] = useState("");


  const [docs, setDocs] = useState<Partial<Record<DocKey, string | null>>>({});

  const [amount, setAmount] = useState(3000);
  const [termWeeks, setTermWeeks] = useState(8);
  const [purpose, setPurpose] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<any | null>(null);

  const setDoc = (key: DocKey) => (v: string | null) => setDocs(d => ({ ...d, [key]: v }));

  const requiredDocs = DOC_FIELDS.filter(f => f.required);
  const docsOk = requiredDocs.every(f => docs[f.key]);

  const canContinue = () => {
    if (step === 1) return !!(fullName.trim() && phone.replace(/\D/g, "").length === 10 && address.trim());
    if (step === 2) return docsOk;
    if (step === 3) return !!(amount >= 500 && termWeeks && purpose);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const docNote = DOC_FIELDS.map(f => `${f.label}: ${docs[f.key as DocKey] ? "✓" : "—"}`).join(" | ");
      const notesText = [
        purpose ? `Destino: ${purpose}` : "",
        internalNotes,
        `Docs: ${docNote}`,
      ].filter(Boolean).join("\n");

      const clientRes = await fetch(`${API}/clients`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ fullName, phone, altPhone: altPhone || null, address, curp: curp || null, internalNotes: notesText }),
      });
      const clientData = await clientRes.json();
      if (!clientRes.ok) throw new Error(clientData.error ?? "Error al crear cliente");

      const creditRes = await fetch(`${API}/credits/apply`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ clientId: clientData.id, amount, termWeeks, purpose }),
      });
      const creditData = await creditRes.json();
      if (!creditRes.ok) throw new Error(creditData.error ?? "Error al crear crédito");

      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      setDone({ client: clientData, credit: creditData });
    } catch (e: any) {
      setError(e.message ?? "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <IconCheck size={48} color="#22c55e" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Cliente registrado!</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            <strong>{done.client.fullName}</strong> fue dado de alta exitosamente con su crédito inicial.
          </p>

          <div className="w-full max-w-sm flex flex-col gap-3">
            <div className="card text-left">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Cliente</span>
                <span className="font-bold text-gray-900">{done.client.fullName}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Teléfono</span>
                <span className="font-medium text-gray-800">{done.client.phone}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Monto</span>
                <span className="font-bold text-blue-700">{fmt(parseFloat(done.credit.amount))}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Pago semanal</span>
                <span className="font-medium text-gray-800">{fmt(parseFloat(done.credit.weeklyPayment))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plazo</span>
                <span className="font-medium text-gray-800">{done.credit.termWeeks} semanas</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/dashboard/expediente/${done.client.id}`)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-bold pressable"
              style={{ background: "var(--accent)" }}
            >
              Ver expediente <IconFlecha size={16} />
            </button>
            <button
              onClick={() => {
                setDone(null); setStep(1);
                setFullName(""); setPhone(""); setAltPhone(""); setAddress(""); setCurp("");
                setGuarantorName(""); setGuarantorPhone("");
                setDocs({}); setPurpose(""); setInternalNotes("");
              }}
              className="text-sm text-gray-400 py-2 pressable"
            >
              Registrar otro cliente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-0 pb-8">

        {/* Header */}
        <div className="px-4 pt-4 md:pt-0 pb-4 flex items-center gap-3">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/dashboard/clientes")}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center pressable"
          >
            <IconAtras size={16} color="#4b5563" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Alta de cliente</h1>
            <p className="text-xs text-gray-400">Paso {step} de {TOTAL}</p>
          </div>
        </div>

        <StepBar step={step} total={TOTAL} />

        <div className="px-4 pt-5 flex flex-col gap-4">

          {step === 1 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-base">
                  <IconPersona size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Datos personales</h2>
                  <p className="text-xs text-gray-400">Ingresa la información del cliente</p>
                </div>
              </div>

              <div className="card flex flex-col gap-4">
                <Field label="Nombre completo" value={fullName} onChange={setFullName} required placeholder="Nombre(s) y apellidos completos" />
                <Field label="Teléfono celular" value={phone} onChange={setPhone} type="tel" required placeholder="10 dígitos" />
                <Field label="Teléfono alternativo" value={altPhone} onChange={setAltPhone} type="tel" placeholder="Opcional" />
                <Field label="Domicilio completo" value={address} onChange={setAddress} required placeholder="Calle, número, colonia, municipio" hint="Dirección exacta para visitas de cobro" />
                <Field label="CURP" value={curp} onChange={setCurp} placeholder="18 caracteres" hint="Puedes consultarla en renapo.gob.mx" />
              </div>

              <div className="card flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Notas internas</label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Observaciones del asesor (solo visibles internamente)..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </>
          )}


          {step === 2 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-base">
                  <IconID size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Documentos KYC</h2>
                  <p className="text-xs text-gray-400">Captura con cámara en presencia del cliente</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {DOC_FIELDS.map(f => (
                  <DocCapture
                    key={f.key}
                    label={f.label}
                    hint={f.hint}
                    required={f.required}
                    value={docs[f.key] ?? null}
                    onChange={setDoc(f.key)}
                  />
                ))}
              </div>

              <div
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: docsOk ? "rgba(14,159,110,0.10)" : "#f8fafc" }}
              >
                <span className="shrink-0"><IconCheck size={24} color={docsOk ? "#10b981" : "#cbd5e1"} /></span>
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">
                    {docsOk ? "Documentos requeridos completos" : `Faltan ${requiredDocs.filter(f => !docs[f.key]).length} documentos obligatorios`}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {DOC_FIELDS.filter(f => docs[f.key as DocKey]).length} de {DOC_FIELDS.length} cargados
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-base">
                  <IconMoneda size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Configurar crédito</h2>
                  <p className="text-xs text-gray-400">Monto y condiciones del crédito inicial</p>
                </div>
              </div>

              <div className="card flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Monto del crédito <span className="text-red-500">*</span></label>
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
                  <label className="text-sm font-semibold text-gray-700">Plazo <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-5 gap-2">
                    {TERMS.map(t => (
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

                {(() => {
                  // 60% annual rate pro-rated by term — matches owner business rule.
                  const interest = amount * 0.60 * (termWeeks / 52);
                  const total = amount + interest;
                  const weeklyPay = total / termWeeks;
                  return (
                    <div className="rounded-xl p-4 grid grid-cols-3 gap-2 text-center" style={{ background: "var(--surface-2)" }}>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Pago semanal</div>
                        <div className="font-extrabold text-base" style={{ color: "var(--accent)" }}>{fmt(weeklyPay)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total a pagar</div>
                        <div className="font-extrabold text-base text-gray-800">{fmt(total)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Interés (60% anual)</div>
                        <div className="font-extrabold text-base text-gray-800">{fmt(interest)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="card flex flex-col gap-3">
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

              {/* Summary */}
              <div className="card bg-blue-50 border border-blue-100">
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Resumen del alta</div>
                {[
                  [<IconPersona size={16} />, fullName],
                  [<IconTelefono size={16} />, phone],
                  [<IconUbicacion size={16} />, address],
                ].map(([icon, val], i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                    <span className="text-blue-400 text-base">{icon}</span>
                    <span className="truncate">{String(val)}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <span className="shrink-0"><IconAlerta size={20} color="#ef4444" /></span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 text-sm font-semibold pressable"
              >
                <IconAtras size={16} /> Atrás
              </button>
            )}
            {step < TOTAL && (
              <button
                onClick={() => canContinue() && setStep(s => s + 1)}
                disabled={!canContinue()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all pressable"
                style={{
                  background: canContinue() ? "var(--accent)" : "#e5e7eb",
                  color: canContinue() ? "white" : "#9ca3af",
                }}
              >
                Continuar <IconFlecha size={16} />
              </button>
            )}
            {step === TOTAL && (
              <button
                onClick={handleSubmit}
                disabled={!canContinue() || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all pressable"
                style={{
                  background: canContinue() && !submitting ? "#10b981" : "#e5e7eb",
                  color: canContinue() && !submitting ? "white" : "#9ca3af",
                }}
              >
                {submitting
                  ? <><IconLoader size={16} /> Registrando...</>
                  : <>< IconCheck size={14} /> Dar de alta</>
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
