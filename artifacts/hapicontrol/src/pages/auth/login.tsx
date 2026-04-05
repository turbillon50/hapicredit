import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RiShieldLine } from "react-icons/ri";
import { InstallGuide } from "@/components/InstallGuide";

const DEMO_ROLES = [
  { label: "Administrador", username: "admin", password: "admin123", color: "#1a3a6b", sub: "Acceso total al sistema" },
  { label: "Asesor 1 — Carlos", username: "ejecutivo1", password: "exec123", color: "#0f5132", sub: "Ejecutivo de campo" },
  { label: "Asesor 2 — Daniela", username: "ejecutivo2", password: "exec123", color: "#5b21b6", sub: "Ejecutivo de campo" },
];

export default function Login() {
  const { login, user } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const autoLoginDone = useRef(false);

  useEffect(() => {
    if (!user && !autoLoginDone.current) {
      autoLoginDone.current = true;
      handleDemo(DEMO_ROLES[0]);
    }
  }, []);

  const handleDemo = async (role: typeof DEMO_ROLES[0]) => {
    setLoadingRole(role.label);
    try {
      await login({ username: role.username, password: role.password });
    } catch {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "linear-gradient(160deg, #080f1e 0%, #0f1f3d 45%, #1a3a6b 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-safe pb-8">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] mb-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white font-bold text-[22px] tracking-tight" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>HC</span>
            </div>
            <h1 className="text-[26px] font-bold text-white tracking-tight">HapiControl</h1>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Plataforma de gestión de cartera</p>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <RiShieldLine className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Seleccionar perfil
                </p>
              </div>
              <div className="space-y-2">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.label}
                    onClick={() => handleDemo(role)}
                    disabled={!!loadingRole}
                    className="w-full h-[52px] rounded-xl flex items-center justify-between px-4 transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: role.color, boxShadow: `0 2px 12px ${role.color}55` }}
                  >
                    <div className="text-left">
                      <p className="text-[14px] font-semibold text-white leading-none">{role.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{role.sub}</p>
                    </div>
                    {loadingRole === role.label ? (
                      <svg className="w-5 h-5 animate-spin text-white/70" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
                        <path d="M6 4L10 8L6 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <InstallGuide />

          <p className="text-center text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            HapiControl · Grupo CAFJA / HapiCredit · Demo
          </p>
        </div>
      </div>
    </div>
  );
}
