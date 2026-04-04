import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RiUserLine, RiLockLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "linear-gradient(160deg, #0f1f3d 0%, #1a3a6b 55%, #1e4a87 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-safe">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] mb-5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <span className="text-white font-bold text-2xl tracking-tight" style={{ fontFamily: "Georgia, serif" }}>HC</span>
            </div>
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">HapiControl</h1>
            <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Sistema de gestión de cartera</p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <h2 className="text-[17px] font-semibold text-foreground mb-1">Iniciar sesión</h2>
            <p className="text-[13px] text-muted-foreground mb-6">Ingresa tus credenciales para continuar</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium text-destructive bg-destructive/8 border border-destructive/15">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground/80">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <RiUserLine className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="tu.usuario"
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground/80">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <RiLockLine className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-background border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground"
                  >
                    {showPassword ? <RiEyeOffLine className="w-4.5 h-4.5" /> : <RiEyeLine className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold text-[15px] text-white mt-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1a3a6b, #2454a3)" }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verificando...
                  </span>
                ) : "Entrar"}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            HapiControl — Uso interno exclusivo
          </p>
        </div>
      </div>
    </div>
  );
}
