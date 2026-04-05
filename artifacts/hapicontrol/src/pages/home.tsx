import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  RiArrowRightLine, RiShieldCheckLine, RiTimeLine,
  RiMoneyDollarCircleLine, RiCalendarLine, RiCheckboxCircleLine,
} from "react-icons/ri";

const STEPS = [
  { icon: <RiCheckboxCircleLine />, title: "Solicita", desc: "Llena tu solicitud y sube tus documentos en minutos" },
  { icon: <RiTimeLine />,           title: "Revisamos", desc: "Tu asesor revisa tu expediente en menos de 24 hrs" },
  { icon: <RiMoneyDollarCircleLine />, title: "Recibe", desc: "Recibe tu crédito directo una vez aprobado" },
];

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col gap-0">

        {/* Hero */}
        <div
          className="px-6 pt-10 pb-12 text-center"
          style={{ background: "linear-gradient(160deg,#0f1e3d 0%,#1e3a7b 60%,#2563eb 100%)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl text-white"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <RiShieldCheckLine />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">HapiCredit</h1>
          <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed mb-6">
            Créditos rápidos y transparentes para hacer crecer tu negocio
          </p>
          <Link href="/solicitar">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold pressable"
              style={{ background: "#fff", color: "var(--navy-900)" }}
            >
              Solicitar crédito <RiArrowRightLine />
            </button>
          </Link>
        </div>

        {/* Beneficios */}
        <div className="px-5 py-8 flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Tu crédito en 3 pasos</h2>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100"
              style={{ boxShadow: "0 2px 8px rgba(15,31,61,0.05)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white font-bold shrink-0"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{s.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Info cards */}
        <div className="px-5 pb-8 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>$500</div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Monto mínimo</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>$30,000</div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Monto máximo</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl font-extrabold text-gray-800">8-24</div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Semanas de plazo</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl font-extrabold text-gray-800">10%</div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Tasa fija</div>
          </div>
        </div>

        {/* CTA bar */}
        <div className="px-5 pb-8">
          <Link href="/solicitar">
            <button
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold pressable"
              style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}
            >
              Solicitar mi crédito ahora <RiArrowRightLine />
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <div className="text-xs text-gray-300">Grupo CAFJA · HapiCredit</div>
          <div className="text-[10px] text-gray-300 mt-1">Sistema interno · v1.0</div>
        </div>
      </div>
    </Layout>
  );
}
