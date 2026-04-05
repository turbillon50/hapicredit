import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  RiShieldCheckLine,
  RiUserLine,
  RiGroupLine,
  RiBankCardLine,
  RiArrowRightSLine,
  RiInformationLine,
} from "react-icons/ri";

const ROLES = [
  {
    key: "admin",
    icon: <RiShieldCheckLine />,
    label: "Administrador",
    sub: "Visión global — cartera, finanzas, asesores",
    bg: "linear-gradient(135deg, #0f2552, #1a3a6b)",
    border: "rgba(59,130,246,0.25)",
    tag: "Control total",
    tagColor: "#3b82f6",
  },
  {
    key: "ejecutivo1",
    icon: <RiGroupLine />,
    label: "Asesor de campo",
    sub: "Carlos Mendoza — mis clientes, cobros y comisiones",
    bg: "linear-gradient(135deg, #064e3b, #065f46)",
    border: "rgba(16,185,129,0.25)",
    tag: "Ejecutivo 1",
    tagColor: "#10b981",
  },
  {
    key: "ejecutivo2",
    icon: <RiUserLine />,
    label: "Asesor de campo",
    sub: "Daniela Ruiz — mis clientes, cobros y comisiones",
    bg: "linear-gradient(135deg, #3b0764, #6d28d9)",
    border: "rgba(139,92,246,0.25)",
    tag: "Ejecutivo 2",
    tagColor: "#a78bfa",
  },
  {
    key: "cliente1",
    icon: <RiBankCardLine />,
    label: "Cliente",
    sub: "Ana López — mi crédito, pagos e historial",
    bg: "linear-gradient(135deg, #1c1917, #292524)",
    border: "rgba(251,191,36,0.25)",
    tag: "Portal cliente",
    tagColor: "#fbbf24",
  },
];

export default function Login() {
  const { demoLogin } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Always wipe any previous session the moment the login screen mounts
  useEffect(() => {
    localStorage.removeItem("hapi_token");
    queryClient.clear();
  }, []);

  const handleSelect = async (key: string) => {
    if (loading) return;
    setLoading(key);
    try {
      await demoLogin(key);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f2040 60%, #0a1628 100%)" }}
    >
      {/* Background glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full top-[-200px] right-[-200px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
      <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-100px] left-[-100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <RiShieldCheckLine className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">HapiCredit</h1>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Selecciona con qué perfil deseas entrar
          </p>
        </div>

        {/* Role cards */}
        <div className="flex flex-col gap-3">
          {ROLES.map(role => (
            <button
              key={role.key}
              onClick={() => handleSelect(role.key)}
              disabled={!!loading}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] disabled:opacity-60 pressable"
              style={{
                background: role.bg,
                border: `1px solid ${role.border}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  {loading === role.key ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : role.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-bold text-[15px]">{role.label}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.12)", color: role.tagColor }}
                    >
                      {role.tag}
                    </span>
                  </div>
                  <div className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {role.sub}
                  </div>
                </div>

                {/* Arrow */}
                <RiArrowRightSLine
                  className="text-xl shrink-0 transition-opacity"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Install hint */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowInstall(s => !s)}
            className="flex items-center justify-center gap-2 mx-auto pressable py-2 px-4"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <RiInformationLine className="text-sm" />
            <span className="text-xs">Cómo instalar la app en tu celular</span>
          </button>

          {showInstall && (
            <div
              className="mt-3 rounded-2xl p-5 text-left"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-xs font-bold text-white mb-3">Instalar en tu dispositivo</p>
              <div className="flex flex-col gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                <div>
                  <span className="text-white font-medium">iPhone / iPad — </span>
                  Safari → ícono compartir → "Añadir a pantalla de inicio"
                </div>
                <div>
                  <span className="text-white font-medium">Android — </span>
                  Chrome → menú (⋮) → "Instalar app"
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
          Grupo CAFJA · HapiCredit · Sistema interno
        </div>
      </div>
    </div>
  );
}
