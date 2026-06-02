import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  IconCheck,
  IconAlerta, IconSubir,
  IconDobleCheck, IconDocumento, IconCamara as IconImagen,
  IconWhatsapp, IconBorrar, IconCamara,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// Owner rules:
// - Existing clients: $1,000–$30,000 / 4–48 weeks / 60% annual rate (pro rata)
// - New clients:      $500–$1,000   / 4 weeks fixed / 30% flat interest
const NEW_AMOUNT_MIN  = 500;
const NEW_AMOUNT_MAX  = 1000;
const NEW_TERM_WEEKS  = 4;
const NEW_INTEREST    = 0.30;       // flat over the term

const EXISTING_AMOUNT_MIN = 1000;
const EXISTING_AMOUNT_MAX = 30000;
const EXISTING_TERM_MIN   = 4;
const EXISTING_TERM_MAX   = 48;
const EXISTING_ANNUAL     = 0.60;   // 60% APR pro-rated

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
  { key: "facebook",       label: "Facebook" },
  { key: "whatsapp",       label: "WhatsApp directo" },
  { key: "recommendation", label: "Recomendación" },
  { key: "referral",       label: "Referido de otro cliente" },
  { key: "other",          label: "Otro" },
];

const DOC_TYPES = [
  { key: "ine_front",  label: "INE — Frente",               required: true  },
  { key: "ine_back",   label: "INE — Reverso",              required: true  },
  { key: "selfie_ine", label: "Selfie sosteniendo tu INE",  required: true  },
  { key: "domicilio",  label: "Comprobante de domicilio",   required: true  },
  { key: "otro",       label: "Otro documento",             required: false },
];

const DAYS_OF_WEEK = [
  { key: "lunes",     label: "Lun" },
  { key: "martes",    label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves",    label: "Jue" },
  { key: "viernes",   label: "Vie" },
  { key: "sabado",    label: "Sáb" },
  { key: "domingo",   label: "Dom" },
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

  // Personal info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [curp, setCurp] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");
  const [source, setSource] = useState("");

  // References (2 personal references)
  const [ref1Name, setRef1Name]         = useState("");
  const [ref1Phone, setRef1Phone]       = useState("");
  const [ref1Relation, setRef1Relation] = useState("");
  const [ref2Name, setRef2Name]         = useState("");
  const [ref2Phone, setRef2Phone]       = useState("");
  const [ref2Relation, setRef2Relation] = useState("");

  // Credit request
  const [isNewClient, setIsNewClient] = useState(true);
  const [amount, setAmount]           = useState(1000);
  const [termWeeks, setTermWeeks]     = useState(NEW_TERM_WEEKS);
  const [purpose, setPurpose]         = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<"weekly" | "biweekly">("weekly");
  const [payDay, setPayDay] = useState<string>("lunes");

  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  // Bank info — required for deposit
  const [bankName, setBankName]           = useState("");
  const [clabe, setClabe]                 = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // ── Derived ranges + computed schedule ────────────────────────────────────
  const amountMin = isNewClient ? NEW_AMOUNT_MIN : EXISTING_AMOUNT_MIN;
  const amountMax = isNewClient ? NEW_AMOUNT_MAX : EXISTING_AMOUNT_MAX;
  const termMin   = isNewClient ? NEW_TERM_WEEKS : EXISTING_TERM_MIN;
  const termMax   = isNewClient ? NEW_TERM_WEEKS : EXISTING_TERM_MAX;

  // Clamp current values when switching client type
  const clampedAmount = Math.min(amountMax, Math.max(amountMin, amount));
  const clampedTerm   = Math.min(termMax,   Math.max(termMin,   termWeeks));
  const termLabel     = "semanas";

  // 5% mensual pro-rata por semanas (semanas ÷ 4 = meses aprox.)
  const interestAmount = isNewClient
    ? clampedAmount * NEW_INTEREST
    : clampedAmount * 0.05 * (clampedTerm / 4);

  const totalPayment  = clampedAmount + interestAmount;
  const installments  = paymentFrequency === "biweekly"
    ? Math.ceil(clampedTerm / 2)
    : clampedTerm;
  const installmentLabel = paymentFrequency === "biweekly" ? "quincenal" : "semanal";
  const perInstallment = totalPayment / installments;
  const disbursement   = clampedAmount; // no commission anymore

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
      const docsData: Record<string, { provided: boolean; filename: string; preview: string }> = {};
      for (const d of docs) {
        docsData[d.key] = { provided: true, filename: d.filename, preview: d.preview };
      }
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: "",
        requestedAmount: clampedAmount,
        termWeeks: clampedTerm,
        purpose,
        source,
        isNewClient,
        personalInfo: {
          fullName: fullName.trim(), phone: phone.trim(), curp, address,
          occupation, monthlyIncome: parseFloat(income) || 0, source,
        },
        references: [
          { name: ref1Name, phone: ref1Phone, relation: ref1Relation },
          { name: ref2Name, phone: ref2Phone, relation: ref2Relation },
        ],
        creditRequest: {
          requestedAmount: clampedAmount,
          termWeeks: clampedTerm,
          purpose,
          isNewClient,
          interestRate: isNewClient ? 0.30 : 0.05,
          totalToRepay: totalPayment,
          perInstallment,
          paymentFrequency,
          payDay,
          bankInfo: {
            bankName: bankName.trim(),
            clabe,
            accountHolder: accountHolder.trim(),
          },
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
      setDone(data.referenceNumber ?? `CT-${Date.now()}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ocurrió un error";
      setError(msg);
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
            Un asesor de credeti revisará tu expediente y te contactará pronto.
          </p>
          <div className="rounded-2xl p-4 mb-4 w-full max-w-xs" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
            <div className="text-xs font-semibold uppercase mb-1" style={{ color: "#215DFF" }}>Folio</div>
            <div className="text-2xl font-extrabold" style={{ color: "#215DFF" }}>{done}</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 w-full max-w-xs mb-6">
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div><div className="text-gray-400">Monto solicitado</div><div className="font-bold">{fmt(clampedAmount)}</div></div>
              <div><div className="text-gray-400">Recibes</div><div className="font-bold text-green-600">{fmt(disbursement)}</div></div>
              <div><div className="text-gray-400">Plazo</div><div className="font-bold">{clampedTerm} {termLabel}</div></div>
              <div><div className="text-gray-400">Pago {installmentLabel}</div><div className="font-bold">{fmt(perInstallment)}</div></div>
            </div>
          </div>
          <a
            href="https://wa.me/529984292748"
            className="flex items-center justify-center gap-2 w-full max-w-xs rounded-2xl py-3.5 text-white text-sm font-semibold pressable mb-6"
            style={{ background: "#25d366" }}
          >
            <IconWhatsapp size={20} color="#fff" /> Contactar por WhatsApp
          </a>

          {/* Thank you + social — matches the owner's WhatsApp script */}
          <div className="w-full max-w-xs rounded-2xl p-5 text-center" style={{ background: "#215DFF" }}>
            <div className="text-base font-extrabold text-white mb-1">Gracias por formar parte</div>
            <div className="text-xs text-white/75 mb-3 leading-relaxed">
              Síguenos en redes y entérate de todas nuestras promociones, servicios y productos.
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61557831849432&sfnsn=wa", bg: "#1877F2" },
                { name: "TikTok",   href: "https://www.tiktok.com/@credeti4?_r=1&_t=ZS-93SMngFBDLb",         bg: "#000"     },
                { name: "YouTube",  href: "https://youtube.com/@crede-ti?si=LMHLBMcXqtG3Il25", bg: "#FF0000"  },
              ].map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
                  style={{ background: s.bg }}>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const STEPS = ["Datos", "Crédito", "Docs", "Enviar"];

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

        {/* ───────────── STEP 0 — personal info + references + source ───────── */}
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

            <NavButtons canNext onNext={() => { if (!accountHolder.trim() && fullName.trim()) setAccountHolder(fullName.trim()); setStep(1); }} />
          </div>
        )}

        {/* ───────────── STEP 1 — credit simulator ──────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos del crédito</h2>
              <p className="text-xs text-gray-500 mt-0.5">Simula tu crédito y elige condiciones</p>
            </div>

            {/* New vs existing client toggle */}
            <div className="card flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de cliente</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsNewClient(true)}
                  className="py-3 rounded-xl text-sm font-bold border-2 pressable text-center"
                  style={isNewClient ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                >
                  Cliente nuevo
                  <div className="text-[10px] font-normal opacity-75 mt-0.5">$500 – $1,000 · 4 sem · 30%</div>
                </button>
                <button
                  onClick={() => setIsNewClient(false)}
                  className="py-3 rounded-xl text-sm font-bold border-2 pressable text-center"
                  style={!isNewClient ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                >
                  Cliente recurrente
                  <div className="text-[10px] font-normal opacity-75 mt-0.5">$1k – $30k · 4–48 sem · 5% mensual</div>
                </button>
              </div>
            </div>

            {/* Simulator */}
            <div className="card flex flex-col gap-4">
              <label className="text-sm font-semibold text-gray-700">Monto solicitado</label>
              <div className="text-4xl font-extrabold text-center py-2" style={{ color: "var(--accent)" }}>{fmt(clampedAmount)}</div>
              <input
                type="range"
                min={amountMin}
                max={amountMax}
                step={isNewClient ? 100 : 1000}
                value={clampedAmount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "#215DFF" }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{fmt(amountMin)}</span>
                <span>{fmt(amountMax)}</span>
              </div>

              <label className="text-sm font-semibold text-gray-700">Plazo</label>
              <div className="text-3xl font-extrabold text-center py-2" style={{ color: "var(--accent)" }}>
                {clampedTerm} <span className="text-base font-medium text-gray-500">{termLabel}</span>
              </div>
              {!isNewClient ? (
                <>
                  <input
                    type="range"
                    min={termMin}
                    max={termMax}
                    step={1}
                    value={clampedTerm}
                    onChange={e => setTermWeeks(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "#215DFF" }}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{termMin} {termLabel}</span>
                    <span>{termMax} {termLabel}</span>
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-center text-gray-400">
                  Plazo fijo para clientes nuevos. Al recurrir podrás extenderlo hasta 48 semanas.
                </div>
              )}

              <div className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--accent)" }}>
                <div className="px-4 py-2 text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
                  Resumen de tu crédito
                </div>
                <div className="p-4 flex flex-col gap-2 text-sm">
                  <Row label="Monto solicitado"  value={fmt(clampedAmount)} />
                  <Row
                    label={isNewClient ? "Interés (30% fijo)" : "Interés (5% mensual)"}
                    value={`+${fmt(interestAmount)}`}
                  />
                  <div className="border-t border-dashed border-gray-200 my-1" />
                  <Row label="Recibes en tu cuenta" value={fmt(disbursement)} highlight />
                  <div className="border-t border-gray-100 my-1" />
                  <Row label={`Pago ${installmentLabel}`} value={fmt(perInstallment)} accent />
                  <Row label="Total a pagar" value={fmt(totalPayment)} />
                  <Row label="Plazo" value={`${clampedTerm} ${termLabel}`} />
                </div>
              </div>
            </div>

            {/* Payment frequency + day */}
            <div className="card flex flex-col gap-4">
              <label className="text-sm font-semibold text-gray-700">Frecuencia de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "weekly",   label: "Semanal" },
                  { key: "biweekly", label: "Quincenal" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setPaymentFrequency(f.key as "weekly" | "biweekly")}
                    className="py-3 rounded-xl text-sm font-medium border-2 pressable"
                    style={paymentFrequency === f.key ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <label className="text-sm font-semibold text-gray-700">Día de pago</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setPayDay(d.key)}
                    className="py-2 rounded-lg text-xs font-medium border-2 pressable"
                    style={payDay === d.key ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                  >
                    {d.label}
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

            {/* Bank account for deposit */}
            <div className="card flex flex-col gap-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos bancarios</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Cuenta donde recibirás el depósito</div>
              </div>
              <Field label="Banco" required>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ej: BBVA, Banamex, HSBC, Bancoppel..." className="input-field" />
              </Field>
              <Field label="CLABE interbancaria" required>
                <input
                  value={clabe}
                  onChange={e => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
                  placeholder="18 dígitos"
                  maxLength={18}
                  className="input-field"
                  inputMode="numeric"
                />
                {clabe.length > 0 && clabe.length < 18 && (
                  <span className="text-xs text-red-500 mt-0.5">Faltan {18 - clabe.length} dígito{18 - clabe.length !== 1 ? "s" : ""}</span>
                )}
                {clabe.length === 18 && (
                  <span className="text-xs text-green-600 font-semibold mt-0.5">CLABE válida ✓</span>
                )}
              </Field>
              <Field label="Nombre del titular" required>
                <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Igual que en tu INE" className="input-field" />
              </Field>
              <div className="text-[11px] bg-amber-50 text-amber-700 rounded-xl px-3 py-2 border border-amber-200">
                El titular de la cuenta debe ser el mismo que el solicitante. No se realizarán depósitos a cuentas de terceros.
              </div>
            </div>

            <NavButtons
              canNext={bankName.trim().length > 0 && clabe.length === 18 && accountHolder.trim().length > 0}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          </div>
        )}

        {/* ───────────── STEP 2 — documents ─────────────────────────────────── */}
        {step === 2 && (
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

            <NavButtons canNext onNext={() => setStep(3)} onBack={() => setStep(1)} />
          </div>
        )}

        {/* ───────────── STEP 3 — review + submit ───────────────────────────── */}
        {step === 3 && (
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

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Crédito</div>
              <div className="flex flex-col gap-2 text-sm">
                <Row label="Tipo" value={isNewClient ? "Cliente nuevo" : "Cliente recurrente"} />
                <Row label="Monto" value={fmt(clampedAmount)} />
                <Row label="Plazo" value={`${clampedTerm} ${termLabel}`} />
                <Row label={isNewClient ? "Interés (30% fijo)" : "Interés (60% anual)"} value={`+${fmt(interestAmount)}`} />
                <div className="border-t border-gray-100 my-1" />
                <Row label="Recibes" value={fmt(disbursement)} highlight />
                <Row label={`Pago ${installmentLabel}`} value={fmt(perInstallment)} accent />
                <Row label="Total a pagar" value={fmt(totalPayment)} />
                <Row label="Frecuencia" value={paymentFrequency === "biweekly" ? "Quincenal" : "Semanal"} />
                <Row label="Día de pago" value={payDay} capitalize />
                <Row label="Destino" value={purpose} />
              </div>
            </div>

            <div className="card">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cuenta bancaria</div>
              <div className="flex flex-col gap-2 text-sm">
                <Row label="Banco" value={bankName} />
                <Row label="CLABE" value={clabe} />
                <Row label="Titular" value={accountHolder} />
              </div>
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
              <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: "#fff0f0", border: "1px solid #fecaca" }}>
                <IconAlerta size={18} color="#dc2626" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm pressable disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>

            <NavButtons canNext={false} onBack={() => setStep(2)} />
          </div>
        )}

      </div>
    </Layout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value, highlight, accent, capitalize }: {
  label: string;
  value: string | number;
  highlight?: boolean;
  accent?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-bold ${highlight ? "text-green-600 text-lg" : capitalize ? "capitalize" : ""}`}
        style={accent ? { color: "var(--accent)" } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function NavButtons({ canNext, onNext, onBack }: { canNext: boolean; onNext?: () => void; onBack?: () => void }) {
  return (
    <div className="flex gap-2 mt-2">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold pressable"
          style={{ background: "#f3f4f6", color: "#374151" }}
        >
          Atrás
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm pressable disabled:opacity-60"
          style={{ background: canNext ? "var(--accent)" : "#e5e7eb", color: canNext ? "#fff" : "#9ca3af" }}
        >
          Continuar
        </button>
      )}
    </div>
  );
}
