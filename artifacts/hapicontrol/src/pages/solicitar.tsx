import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  RiArrowRightLine, RiArrowLeftLine, RiCheckboxCircleLine,
  RiLoader4Line, RiErrorWarningLine, RiUpload2Line,
  RiCheckLine, RiUserLine, RiPhoneLine, RiMapPinLine,
  RiMoneyDollarCircleLine, RiFileTextLine, RiImageLine,
  RiWhatsappLine, RiDeleteBinLine,
} from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

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

const DOC_TYPES = [
  { key: "ine_front",  label: "INE — Frente",               required: true  },
  { key: "ine_back",   label: "INE — Reverso",              required: true  },
  { key: "curp_doc",   label: "CURP",                       required: true  },
  { key: "domicilio",  label: "Comprobante de domicilio",   required: true  },
  { key: "ingresos",   label: "Comprobante de ingresos",    required: false },
  { key: "foto",       label: "Fotografía reciente",        required: false },
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
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDocKey, setActiveDocKey] = useState("");

  // Step 1 - Personal
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [curp, setCurp] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");

  // Step 2 - Credit
  const [amount, setAmount] = useState(5000);
  const [termWeeks, setTermWeeks] = useState(12);
  const [purpose, setPurpose] = useState("");

  // Step 2b - Guarantor
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");

  // Step 3 - Documents
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const weeklyPayment = (amount * 1.10) / termWeeks;
  const totalPayment = amount * 1.10;

  const canStep1 = fullName.trim().length >= 3 && phone.replace(/\D/g, "").length === 10;
  const canStep2 = purpose.length > 0;
  const requiredDocs = DOC_TYPES.filter(d => d.required);
  const uploadedKeys = docs.map(d => d.key);
  const docProgress = requiredDocs.filter(d => uploadedKeys.includes(d.key)).length;
  const canSubmit = canStep1 && canStep2;

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
        termWeeks,
        purpose,
        personalInfo: { fullName: fullName.trim(), phone: phone.trim(), curp, address, occupation, monthlyIncome: parseFloat(income) || 0 },
        guarantor: { name: guarantorName, phone: guarantorPhone },
        creditRequest: { requestedAmount: amount, termWeeks, purpose, weeklyPayment },
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
            <RiCheckboxCircleLine className="text-4xl text-green-500" />
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
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><div className="text-gray-400">Monto</div><div className="font-bold">{fmt(amount)}</div></div>
              <div><div className="text-gray-400">Plazo</div><div className="font-bold">{termWeeks} sem</div></div>
              <div><div className="text-gray-400">Semanal</div><div className="font-bold">{fmt(weeklyPayment)}</div></div>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <a
              href="https://wa.me/521XXXXXXXXXX"
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-white text-sm font-semibold pressable"
              style={{ background: "#25d366" }}
            >
              <RiWhatsappLine className="text-xl" /> Contactar por WhatsApp
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-8 px-4 pt-4">

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {["Datos", "Crédito", "Documentos", "Enviar"].map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full transition-all"
                style={{ background: i <= step ? "var(--accent)" : "#e5e7eb" }}
              />
              <span className="text-[10px] font-semibold" style={{ color: i <= step ? "var(--accent)" : "#9ca3af" }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ingresa tu información básica</p>
            </div>
            <div className="card flex flex-col gap-4">
              <Field icon={<RiUserLine />} label="Nombre completo" required>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre y apellidos" className="input-field" />
              </Field>
              <Field icon={<RiPhoneLine />} label="Teléfono celular" required>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 dígitos" maxLength={10} className="input-field" />
              </Field>
              <Field label="CURP">
                <input value={curp} onChange={e => setCurp(e.target.value.toUpperCase())} placeholder="18 caracteres" maxLength={18} className="input-field" />
              </Field>
              <Field icon={<RiMapPinLine />} label="Domicilio">
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, colonia, ciudad" className="input-field" />
              </Field>
              <Field label="Ocupación">
                <input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Ej: Comerciante, Empleado..." className="input-field" />
              </Field>
              <Field icon={<RiMoneyDollarCircleLine />} label="Ingreso mensual aprox.">
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="$0" className="input-field" />
              </Field>
            </div>
            <NavButtons canNext={canStep1} onNext={() => setStep(1)} />
          </div>
        )}

        {/* Step 1 — Credit details */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos del crédito</h2>
              <p className="text-xs text-gray-500 mt-0.5">Define el monto y condiciones</p>
            </div>

            <div className="card flex flex-col gap-4">
              <label className="text-sm font-semibold text-gray-700">Monto solicitado</label>
              <div className="text-4xl font-extrabold text-center py-2" style={{ color: "var(--accent)" }}>{fmt(amount)}</div>
              <input type="range" min={500} max={30000} step={500} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-gray-400"><span>$500</span><span>$30,000</span></div>

              <label className="text-sm font-semibold text-gray-700">Plazo de pago</label>
              <div className="grid grid-cols-5 gap-2">
                {TERM_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTermWeeks(t)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 pressable ${termWeeks === t ? "text-white" : "border-gray-200 bg-white text-gray-600"}`}
                    style={termWeeks === t ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                  >
                    {t}<span className="text-[10px] font-normal block">{t === 1 ? "sem" : "sem"}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl p-4 flex justify-around text-sm" style={{ background: "var(--surface-2)" }}>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Pago semanal</div>
                  <div className="font-extrabold text-lg" style={{ color: "var(--accent)" }}>{fmt(weeklyPayment)}</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Total</div>
                  <div className="font-extrabold text-lg text-gray-800">{fmt(totalPayment)}</div>
                </div>
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

            <div className="card flex flex-col gap-3">
              <div className="text-sm font-semibold text-gray-700">Datos del aval <span className="text-xs text-gray-400 font-normal">(opcional)</span></div>
              <Field label="Nombre del aval">
                <input value={guarantorName} onChange={e => setGuarantorName(e.target.value)} placeholder="Nombre completo" className="input-field" />
              </Field>
              <Field label="Teléfono del aval">
                <input type="tel" value={guarantorPhone} onChange={e => setGuarantorPhone(e.target.value)} placeholder="10 dígitos" maxLength={10} className="input-field" />
              </Field>
            </div>

            <NavButtons canNext={canStep2} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          </div>
        )}

        {/* Step 2 — Documents */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Documentos</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sube fotos de tus documentos. {docProgress}/{requiredDocs.length} obligatorios cargados.
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
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center"><RiFileTextLine className="text-gray-400" /></div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                        <RiImageLine className="text-xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {d.label} {d.required && <span className="text-red-500">*</span>}
                      </div>
                      {uploaded ? (
                        <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <RiCheckLine /> {uploaded.filename}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No cargado</div>
                      )}
                    </div>
                    {uploaded ? (
                      <button onClick={() => removeDoc(d.key)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#fff0f0" }}>
                        <RiDeleteBinLine className="text-red-500 text-sm" />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setActiveDocKey(d.key); fileRef.current?.click(); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold pressable"
                        style={{ background: "#f0f7ff", color: "var(--accent)" }}
                      >
                        <RiUpload2Line className="inline mr-1" />Subir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />

            <NavButtons canNext onNext={() => setStep(3)} onBack={() => setStep(1)} />
          </div>
        )}

        {/* Step 3 — Review & Submit */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revisa tu solicitud</h2>
              <p className="text-xs text-gray-500 mt-0.5">Confirma que todo esté correcto antes de enviar</p>
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Solicitante</div>
              <div className="text-base font-bold text-gray-900">{fullName}</div>
              <div className="text-sm text-gray-500">{phone} {curp && `· ${curp}`}</div>
              {address && <div className="text-sm text-gray-500 mt-1">{address}</div>}
              {occupation && <div className="text-sm text-gray-500">Ocupación: {occupation}</div>}
              {income && <div className="text-sm text-gray-500">Ingreso: {fmt(parseFloat(income))}/mes</div>}
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Crédito</div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-blue-50 rounded-xl py-2">
                  <div className="text-[10px] text-gray-400 uppercase">Monto</div>
                  <div className="text-sm font-bold text-blue-700">{fmt(amount)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <div className="text-[10px] text-gray-400 uppercase">Plazo</div>
                  <div className="text-sm font-bold">{termWeeks} sem</div>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <div className="text-[10px] text-gray-400 uppercase">Semanal</div>
                  <div className="text-sm font-bold">{fmt(weeklyPayment)}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">Destino: <span className="font-medium text-gray-900">{purpose}</span></div>
            </div>

            {guarantorName && (
              <div className="card">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Aval</div>
                <div className="text-sm font-medium text-gray-900">{guarantorName}</div>
                <div className="text-sm text-gray-500">{guarantorPhone}</div>
              </div>
            )}

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Documentos ({docs.length})</div>
              <div className="flex flex-col gap-1.5">
                {DOC_TYPES.map(d => {
                  const uploaded = docs.find(u => u.key === d.key);
                  return (
                    <div key={d.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{d.label}</span>
                      {uploaded
                        ? <span className="text-green-600 font-semibold text-xs flex items-center gap-1"><RiCheckLine /> Cargado</span>
                        : <span className="text-gray-400 text-xs">{d.required ? "Pendiente" : "Opcional"}</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <RiErrorWarningLine className="text-red-500 text-xl shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white text-sm font-bold pressable"
              style={{ background: canSubmit && !submitting ? "linear-gradient(135deg,#1e40af,#3b82f6)" : "#e5e7eb", color: canSubmit && !submitting ? "white" : "#9ca3af" }}
            >
              {submitting ? <><RiLoader4Line className="animate-spin" /> Enviando...</> : "Enviar solicitud"}
            </button>

            <button onClick={() => setStep(2)} className="text-center text-sm text-gray-400 pressable py-2">
              <RiArrowLeftLine className="inline mr-1" /> Regresar
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Field({ icon, label, required, children }: { icon?: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
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
          <RiArrowLeftLine /> Atrás
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold pressable"
        style={{ background: canNext ? "var(--accent)" : "#e5e7eb", color: canNext ? "white" : "#9ca3af" }}
      >
        Siguiente <RiArrowRightLine />
      </button>
    </div>
  );
}
