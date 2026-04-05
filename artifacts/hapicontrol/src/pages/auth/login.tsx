import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RiUserLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiShieldLine } from "react-icons/ri";

const DEMO_ROLES = [
  { label: "Administrador", username: "admin", password: "admin123", color: "#1a3a6b", sub: "Acceso total al sistema" },
  { label: "Asesor", username: "ejecutivo1", password: "exec123", color: "#0f5132", sub: "Vista de ejecutivo de campo" },
  { label: "Asesor 2", username: "ejecutivo2", password: "exec123", color: "#5b21b6", sub: "Daniela Ruiz — vista asesor" },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login({ username, password });
    } catch {
      setError("Credenciales incorrectas. Verifica tu usuario y contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: typeof DEMO_ROLES[0]) => {
    setLoadingRole(role.label);
    setError("");
    try {
      await login({ username: role.username, password: role.password });
    } catch {
      setError("Error al acceder en modo demo.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "linear-gradient(160deg, #080f1e 0%, #0f1f3d 45%, #1a3a6b 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-safe pb-8">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] mb-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white font-bold text-[22px] tracking-tight" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>HC</span>
            </div>
            <h1 className="text-[26px] font-bold text-white tracking-tight">HapiControl</h1>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Plataforma de gestión de cartera</p>
          </div>

          {/* Demo access — prominent */}
          <div className="mb-5 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <RiShieldLine className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Acceso demo — un toque
                </p>
              </div>
              <div className="space-y-2">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.label}
                    onClick={() => handleDemo(role)}
                    disabled={!!loadingRole}
                    className="w-full h-12 rounded-xl flex items-center justify-between px-4 transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: role.color, boxShadow: `0 2px 12px ${role.color}55` }}
                  >
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-white leading-none">{role.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{role.sub}</p>
                    </div>
                    {loadingRole === role.label ? (
                      <svg className="w-4 h-4 animate-spin text-white/70" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
                        <path d="M6 4L10 8L6 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>o ingresa con credenciales</p>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>

          {/* Manual login */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[12px] font-medium text-destructive bg-destructive/8 border border-destructive/15">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-foreground/70">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <RiUserLine className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="usuario"
                    className="w-full h-10 pl-9 pr-4 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-foreground/70">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <RiLockLine className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-10 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground"
                  >
                    {showPassword ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0f1f3d, #1a3a6b)" }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verificando...
                  </span>
                ) : "Ingresar"}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
            HapiControl · Grupo CAFJA / HapiCredit · Uso interno
          </p>
        </div>
      </div>
    </div>
  );
}
