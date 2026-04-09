import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  IconFlecha, IconAtras, IconCheck,
  IconLoader, IconAlerta, IconSubir,
  IconDobleCheck, IconPerfil, IconTelefono, IconUbicacion,
  IconMoneda, IconDocumento, IconCamara as IconImagen,
  IconWhatsapp, IconBorrar, IconTienda,
  IconGrupo, IconCamara,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const TERM_OPTIONS = [
  { weeks: 8,  ratePerThousand: 175, label: "8 semanas" },
  { weeks: 13, ratePerThousand: 120, label: "13 semanas" },
];

const COMMISSION_RATE = 0.10;

const PURPOSES = [
  "Capital de trabajo / negocio",
  "Compra de mercancía",
  "Ampliación de negocio",
  "Gastos personales",
  "Salud y gastos médicos",
  "Educación",
  "Mejoras al hogar",
  "Pago de deudas",
  "Otro",
];

const SOURCES = [
  { key: "facebook",      label: "Facebook" },
  { key: "whatsapp",      label: "WhatsApp directo" },
  { key: "recommendation", label: "Recomendación" },
  { key: "referral",      label: "Referido de otro cliente" },
  { key: "other",         label: "Otro" },
];

const DOC_TYPES = [
  { key: "ine_front",  label: "INE — Frente",               required: true  },
  { key: "ine_back",   label: "INE — Reverso",              required: true  },
  { key: "selfie_ine", label: "Selfie sosteniendo tu INE",  required: true  },
  { key: "domicilio",  label: "Comprobante de domicilio",   required: true  },
  { key: "negocio",    label: "Foto del negocio",           required: false },
  { key: "otro",       label: "Otro documento",             required: false },
];

type UploadedDoc = { key: string; filename: string; mimeType: string; preview: string };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Solicitar() {
  useRequireAuth(["client"]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDocKey, setActiveDocKey] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [curp, setCurp] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");
  const [source, setSource] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessYears, setBusinessYears] = useState("");

  const [ref1Name, setRef1Name] = useState("");
  const [ref1Phone, setRef1Phone] = useState("");
  const [ref1Relation, setRef1Relation] = useState("");
  const [ref2Name, setRef2Name] = useState("");
  const [ref2Phone, setRef2Phone] = useState("");
  const [ref2Relation, setRef2Relation] = useState("");

  const [amount, setAmount] = useState(5000);
  const [termIdx, setTermIdx] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [payDay, setPayDay] = useState("lunes");

  const [avalName, setAvalName] = useState("");
  const [avalPhone, setAvalPhone] = useState("");
  const [avalAddress, setAvalAddress] = useState("");
  const [avalRelation, setAvalRelation] = useState("");

  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const term = TERM_OPTIONS[termIdx];
  const weeklyPayment = (amount / 1000) * term.ratePerThousand;
  const totalPayment = weeklyPayment * term.weeks;
  const commission = amount * COMMISSION_RATE;
  const disbursement = amount - commission;

  const canStep0 = true;
  const canStep1 = true;
  const canStep2 = true;
  const requiredDocs = DOC_TYPES.filter(d => d.required);
  const uploadedKeys = docs.map(d => d.key);
  const docProgress = requiredDocs.filter(d => uploadedKeys.includes(d.key)).length;
  const canSubmit = true;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeDocKey) return;
    const dataUrl = await fileToDataUrl(file);
    setDocs(prev => [
      ...prev.filter(d => d.key !== activeDocKey),
      { key: activeDocKey, filename: file.name, mimeType: file.type, preview: dataUrl },
    ]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeDoc(key: string) {
    setDocs(prev => prev.filter(d => d.key !== key));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const docsData: Record<string, any> = {};
      for (const d of docs) {
        docsData[d.key] = { provided: true, filename: d.filename, preview: d.preview };
      }
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: "",
        requestedAmount: amount,
        termWeeks: term.weeks,
        purpose,
        source,
        personalInfo: {
          fullName: fullName.trim(), phone: phone.trim(), curp, address,
          occupation, monthlyIncome: parseFloat(income) || 0, source,
        },
        businessInfo: {
          name: businessName, type: businessType,
          address: businessAddress, years: businessYears,
        },
        references: [
          { name: ref1Name, phone: ref1Phone, relation: ref1Relation },
          { name: ref2Name, phone: ref2Phone, relation: ref2Relation },
        ],
        guarantor: { name: avalName, phone: avalPhone, address: avalAddress, relation: avalRelation },
        creditRequest: {
          requestedAmount: amount, termWeeks: term.weeks, purpose,
          weeklyPayment, commission, disbursement, totalPayment, payDay,
          ratePerThousand: term.ratePerThousand,
        },
        documents: docsData,
      };
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setDone(data.referenceNumber ?? `HC-${Date.now()}`);
    } catch (e: any) {
      setError(e.message ?? "Ocurrió un error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <IconDobleCheck size={36} color="#22c55e" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Solicitud enviada</h2>
          <p className="text-sm text-gray-500 mb-2 max-w-xs">
            Un asesor de HapiCredit revisará tu expediente y te contactará pronto.
          </p>
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 w-full max-w-xs">
            <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Folio</div>
            <div className="text-2xl font-extrabold text-blue-700">{done}</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 w-full max-w-xs mb-6">
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div><div className="text-gray-400">Monto solicitado</div><div className="font-bold">{fmt(amount)}</div></div>
              <div><div className="text-gray-400">Recibes</div><div className="font-bold text-green-600">{fmt(disbursement)}</div></div>
              <div><div className="text-gray-400">Plazo</div><div className="font-bold">{term.weeks} semanas</div></div>
              <div><div className="text-gray-400">Pago semanal</div><div className="font-bold">{fmt(weeklyPayment)}</div></div>
            </div>
          </div>
          <a
            href="https://wa.me/521XXXXXXXXXX"
            className="flex items-center justify-center gap-2 w-full max-w-xs rounded-2xl py-3.5 text-white text-sm font-semibold pressable"
            style={{ background: "#25d366" }}
          >
            <IconWhatsapp size={20} color="#fff" /> Contactar por WhatsApp
          </a>
        </div>
      </Layout>
    );
  }

  const STEPS = ["Datos", "Crédito", "Aval", "Docs", "Enviar"];

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-8 px-4 pt-4">

        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full transition-all"
                style={{ background: i <= step ? "var(--accent)" : "#e5e7eb" }}
              />
              <span className="text-[9px] font-semibold" style={{ color: i <= step ? "var(--accent)" : "#9ca3af" }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
              <p className="text-xs text-gray-500 mt-0.5">Información del solicitante</p>
            </div>

            <div className="card flex flex-col gap-4">
              <Field label="Nombre completo" required>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Como aparece en tu INE" className="input-field" />
              </Field>
              <Field label="Teléfono celular" required>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 dígitos" maxLength={10} className="input-field" />
              </Field>
              <Field label="CURP">
                <input value={curp} onChange={e => setCurp(e.target.value.toUpperCase())} placeholder="18 caracteres" maxLength={18} className="input-field" />
              </Field>
              <Field label="Domicilio" required>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, colonia, ciudad" className="input-field" />
              </Field>
              <Field label="Ocupación">
                <input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Ej: Comerciante, Empleado..." className="input-field" />
              </Field>
              <Field label="Ingreso mensual aprox.">
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="$0" className="input-field" />
              </Field>
            </div>

            <div className="card flex flex-col gap-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos del negocio</div>
              <Field label="Nombre del negocio">
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nombre o giro" className="input-field" />
              </Field>
              <Field label="Tipo de negocio">
                <input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Ej: Tienda de abarrotes, Taller..." className="input-field" />
              </Field>
              <Field label="Dirección del negocio">
                <input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="Si es diferente a domicilio" className="input-field" />
              </Field>
              <Field label="Años operando">
                <input value={businessYears} onChange={e => setBusinessYears(e.target.value)} placeholder="Ej: 3" className="input-field" />
              </Field>
            </div>

            <div className="card flex flex-col gap-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Referencias personales</div>
              <div className="text-[10px] text-gray-400">Persona 1</div>
              <div className="flex gap-2">
                <div className="flex-1"><input value={ref1Name} onChange={e => setRef1Name(e.target.value)} placeholder="Nombre" className="input-field" /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><input type="tel" value={ref1Phone} onChange={e => setRef1Phone(e.target.value)} placeholder="Teléfono" maxLength={10} className="input-field" /></div>
                <div className="flex-1"><input value={ref1Relation} onChange={e => setRef1Relation(e.target.value)} placeholder="Parentesco" className="input-field" /></div>
              </div>
              <div className="text-[10px] text-gray-400 mt-2">Persona 2</div>
              <div className="flex gap-2">
                <div className="flex-1"><input value={ref2Name} onChange={e => setRef2Name(e.target.value)} placeholder="Nombre" className="input-field" /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><input type="tel" value={ref2Phone} onChange={e => setRef2Phone(e.target.value)} placeholder="Teléfono" maxLength={10} className="input-field" /></div>
                <div className="flex-1"><input value={ref2Relation} onChange={e => setRef2Relation(e.target.value)} placeholder="Parentesco" className="input-field" /></div>
              </div>
            </div>

            <div className="card flex flex-col gap-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Como nos conociste</div>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSource(s.key)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border-2 pressable"
                    style={source === s.key ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <NavButtons canNext={canStep0} onNext={() => setStep(1)} />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos del crédito</h2>
              <p className="text-xs text-gray-500 mt-0.5">Monto y condiciones</p>
            </div>

            <div className="card flex flex-col gap-4">
              <label className="text-sm font-semibold text-gray-700">Monto solicitado</label>
              <div className="text-4xl font-extrabold text-center py-2" style={{ color: "var(--accent)" }}>{fmt(amount)}</div>
              <input type="range" min={1000} max={30000} step={1000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-gray-400"><span>$1,000</span><span>$30,000</span></div>

              <label className="text-sm font-semibold text-gray-700">Plazo de pago</label>
              <div className="grid grid-cols-2 gap-3">
                {TERM_OPTIONS.map((t, i) => (
                  <button
                    key={t.weeks}
                    onClick={() => setTermIdx(i)}
                    className={`py-4 rounded-xl text-center border-2 pressable ${termIdx === i ? "text-white" : "border-gray-200 bg-white text-gray-600"}`}
                    style={termIdx === i ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                  >
                    <div className="text-xl font-extrabold">{t.weeks}</div>
                    <div className="text-xs">semanas</div>
                    <div className="text-[10px] mt-1 opacity-70">${t.ratePerThousand}/semana por $1,000</div>
                  </button>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--accent)" }}>
                <div className="px-4 py-2 text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
                  Resumen de tu crédito
                </div>
                <div className="p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monto solicitado</span>
                    <span className="font-bold">{fmt(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comisión por apertura (10%)</span>
                    <span className="font-bold text-red-500">-{fmt(commission)}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-1" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Recibes en tu cuenta</span>
                    <span className="font-extrabold text-green-600 text-lg">{fmt(disbursement)}</span>
                  </div>
                  <div className="border-t border-gray-100 my-1" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pago semanal</span>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>{fmt(weeklyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total a pagar</span>
                    <span className="font-bold">{fmt(totalPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plazo</span>
                    <span className="font-bold">{term.weeks} semanas</span>
                  </div>
                </div>
              </div>

              <label className="text-sm font-semibold text-gray-700">Día de pago preferido</label>
              <div className="flex flex-wrap gap-2">
                {["lunes","martes","miércoles","jueves","viernes","sábado"].map(d => (
                  <button
                    key={d}
                    onClick={() => setPayDay(d)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border-2 pressable capitalize"
                    style={payDay === d ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb" }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="card flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">Destino del crédito <span className="text-red-500">*</span></label>
              {PURPOSES.map(p => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left font-medium pressable ${purpose === p ? "text-white" : "border-gray-200 bg-white text-gray-700"}`}
                  style={purpose === p ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                >
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${purpose === p ? "border-white" : "border-gray-300"}`}>
                    {purpose === p && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {p}
                </button>
              ))}
            </div>

            <NavButtons canNext={canStep1} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Obligado solidario (Aval)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Es requisito obligatorio contar con un aval</p>
            </div>

            <div className="card flex flex-col gap-4">
              <Field label="Nombre completo del aval" required>
                <input value={avalName} onChange={e => setAvalName(e.target.value)} placeholder="Como aparece en su INE" className="input-field" />
              </Field>
              <Field label="Teléfono del aval" required>
                <input type="tel" value={avalPhone} onChange={e => setAvalPhone(e.target.value)} placeholder="10 dígitos" maxLength={10} className="input-field" />
              </Field>
              <Field label="Domicilio del aval">
                <input value={avalAddress} onChange={e => setAvalAddress(e.target.value)} placeholder="Dirección completa" className="input-field" />
              </Field>
              <Field label="Parentesco o relación">
                <input value={avalRelation} onChange={e => setAvalRelation(e.target.value)} placeholder="Ej: Hermano, Amigo, Vecino..." className="input-field" />
              </Field>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="text-sm font-semibold text-yellow-800 mb-1">Importante</div>
              <div className="text-xs text-yellow-700 leading-relaxed">
                El aval se compromete como obligado solidario del crédito. Se le podría contactar en caso de incumplimiento de pago.
              </div>
            </div>

            <NavButtons canNext={canStep2} onNext={() => setStep(3)} onBack={() => setStep(1)} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Documentos</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sube fotos de tus documentos. {docProgress}/{requiredDocs.length} obligatorios.
              </p>
            </div>

            <div className="card flex flex-col gap-3">
              {DOC_TYPES.map(d => {
                const uploaded = docs.find(u => u.key === d.key);
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    {uploaded ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                        {uploaded.mimeType.startsWith("image/") ? (
                          <img src={uploaded.preview} alt={d.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center"><IconDocumento size={16} color="#9ca3af" /></div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                        {d.key === "selfie_ine" ? <IconCamara size={20} /> : <IconImagen size={20} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {d.label} {d.required && <span className="text-red-500">*</span>}
                      </div>
                      {uploaded ? (
                        <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <IconCheck size={14} /> {uploaded.filename}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No cargado</div>
                      )}
                    </div>
                    {uploaded ? (
                      <button onClick={() => removeDoc(d.key)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#fff0f0" }}>
                        <IconBorrar size={14} color="#ef4444" />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setActiveDocKey(d.key); fileRef.current?.click(); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                        style={{ background: "#f0f7ff", color: "var(--accent)" }}
                      >
                        <IconSubir size={12} className="inline mr-1" />Subir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" onChange={handleFileUpload} className="hidden" />

            <NavButtons canNext onNext={() => setStep(4)} onBack={() => setStep(2)} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revisa tu solicitud</h2>
              <p className="text-xs text-gray-500 mt-0.5">Confirma que todo esté correcto</p>
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Solicitante</div>
              <div className="text-base font-bold text-gray-900">{fullName}</div>
              <div className="text-sm text-gray-500">{phone} {curp && `· ${curp}`}</div>
              {address && <div className="text-sm text-gray-500 mt-1">{address}</div>}
              {occupation && <div className="text-sm text-gray-500">Ocupación: {occupation}</div>}
              {income && <div className="text-sm text-gray-500">Ingreso: {fmt(parseFloat(income))}/mes</div>}
            </div>

            {businessName && (
              <div className="card">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Negocio</div>
                <div className="text-sm font-medium text-gray-900">{businessName}</div>
                <div className="text-sm text-gray-500">{businessType} {businessYears && `· ${businessYears} años`}</div>
              </div>
            )}

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Crédito</div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className="font-bold">{fmt(amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Comisión (10%)</span><span className="font-bold text-red-500">-{fmt(commission)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700 font-semibold">Recibes</span><span className="font-extrabold text-green-600">{fmt(disbursement)}</span></div>
                <div className="border-t border-gray-100 my-1" />
                <div className="flex justify-between"><span className="text-gray-500">Pago semanal</span><span className="font-bold">{fmt(weeklyPayment)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plazo</span><span className="font-bold">{term.weeks} semanas</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total a pagar</span><span className="font-bold">{fmt(totalPayment)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Día de pago</span><span className="font-bold capitalize">{payDay}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="font-medium text-right max-w-[50%]">{purpose}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Aval (obligado solidario)</div>
              <div className="text-sm font-medium text-gray-900">{avalName}</div>
              <div className="text-sm text-gray-500">{avalPhone} {avalRelation && `· ${avalRelation}`}</div>
              {avalAddress && <div className="text-sm text-gray-500">{avalAddress}</div>}
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Documentos ({docs.length})</div>
              <div className="flex flex-col gap-1.5">
                {DOC_TYPES.map(d => {
                  const uploaded = docs.find(u => u.key === d.key);
                  return (
                    <div key={d.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{d.label}</span>
                      {uploaded
                        ? <span className="text-green-600 font-semibold text-xs flex items-center gap-1"><IconCheck size={14} /> Listo</span>
                        : <span className="text-gray-400 text-xs">{d.required ? "Pendiente" : "Opcional"}</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <span className="shrink-0"><IconAlerta size={20} color="#ef4444" /></span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white text-sm font-bold pressable"
              style={{ background: canSubmit && !submitting ? "linear-gradient(135deg,#1e40af,#3b82f6)" : "#e5e7eb", color: canSubmit && !submitting ? "white" : "#9ca3af" }}
            >
              {submitting ? <><IconLoader size={16} className="animate-spin" /> Enviando...</> : "Enviar solicitud"}
            </button>

            <button onClick={() => setStep(3)} className="text-center text-sm text-gray-400 pressable py-2">
              <IconAtras size={14} className="inline mr-1" /> Regresar
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function NavButtons({ canNext, onNext, onBack }: { canNext: boolean; onNext: () => void; onBack?: () => void }) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-600 pressable"
        >
          <IconAtras size={16} /> Atrás
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold pressable"
        style={{ background: canNext ? "var(--accent)" : "#e5e7eb", color: canNext ? "white" : "#9ca3af" }}
      >
        Siguiente <IconFlecha size={16} color="#fff" />
      </button>
    </div>
  );
}
