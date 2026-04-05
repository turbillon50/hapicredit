import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RiUserLine, RiLockPasswordLine, RiShieldCheckLine, RiInformationLine } from "react-icons/ri";

const DEMO = [
  { key: "admin",      label: "Admin",        color: "#1a3a6b", sub: "Acceso total" },
  { key: "ejecutivo1", label: "Asesor 1",     color: "#065f46", sub: "Carlos" },
  { key: "ejecutivo2", label: "Asesor 2",     color: "#7c3aed", sub: "Daniela" },
];

export default function Login() {
  const { login, demoLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showInstall, setShowInstall] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (key: string) => {
    setDemoLoading(key);
    try {
      await demoLogin(key);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, var(--navy-950) 0%, var(--navy-800) 55%, var(--navy-700) 100%)",
      }}
    >
      {/* Background circles */}
      <div className="absolute w-[480px] h-[480px] rounded-full top-[-140px] right-[-160px] opacity-10"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
      <div className="absolute w-[300px] h-[300px] rounded-full bottom-[-80px] left-[-80px] opacity-10"
        style={{ background: "radial-gradient(circle, #1e4d8c 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm px-6 z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <RiShieldCheckLine className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HapiCredit</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sistema de gestión interna
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6 mb-5"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                USUARIO
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-base"
                  style={{ paddingLeft: "40px", background: "rgba(255,255,255,0.9)" }}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                CONTRASEÑA
              </label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base"
                  style={{ paddingLeft: "40px", background: "rgba(255,255,255,0.9)" }}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 rounded-xl px-3 py-2 border border-red-800/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl font-semibold text-white text-[15px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 mt-1"
              style={{ background: "var(--accent)" }}
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        {/* Demo access */}
        <div className="text-center mb-3">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            — Acceso de demostración —
          </span>
        </div>
        <div className="flex gap-3 mb-6">
          {DEMO.map(d => (
            <button
              key={d.key}
              onClick={() => handleDemo(d.key)}
              disabled={!!demoLoading}
              className="flex-1 py-3 px-2 rounded-xl text-center transition-all active:scale-95 disabled:opacity-60 pressable"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {demoLoading === d.key ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto block" />
              ) : (
                <>
                  <div className="text-white font-semibold text-xs">{d.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{d.sub}</div>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Install guide */}
        <button
          onClick={() => setShowInstall(s => !s)}
          className="flex items-center justify-center gap-2 w-full py-3 pressable"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <RiInformationLine className="text-sm" />
          <span className="text-xs">
            {showInstall ? "Ocultar instrucciones" : "Cómo instalar la app"}
          </span>
        </button>

        {showInstall && (
          <div
            className="mt-3 rounded-2xl p-5 text-sm"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <p className="font-semibold text-white mb-3">Instalar en tu dispositivo</p>
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="font-medium text-white text-xs mb-1">iPhone / iPad</p>
                <p className="text-xs leading-relaxed">
                  Abre en Safari → toca el ícono de compartir → "Añadir a pantalla de inicio"
                </p>
              </div>
              <div>
                <p className="font-medium text-white text-xs mb-1">Android</p>
                <p className="text-xs leading-relaxed">
                  Abre en Chrome → menú (⋮) → "Instalar app" o "Añadir a pantalla de inicio"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
