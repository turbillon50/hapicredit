import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "./BottomNav";
import { RiLockLine, RiSwapLine, RiCloseLine } from "react-icons/ri";
import { useLocation } from "wouter";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  executive: "Asesor",
  client: "Cliente",
};

const roleColor: Record<string, { bg: string; text: string; dot: string }> = {
  admin:     { bg: "#eef3fb", text: "#1a3a6b", dot: "#1a3a6b" },
  executive: { bg: "#ecfdf5", text: "#065f46", dot: "#059669" },
  client:    { bg: "#f5f3ff", text: "#4c1d95", dot: "#7c3aed" },
};

const SWITCH_ROLES = [
  { label: "Administrador", username: "admin", password: "admin123", color: "#1a3a6b" },
  { label: "Asesor — Carlos", username: "ejecutivo1", password: "exec123", color: "#0f5132" },
  { label: "Asesor — Daniela", username: "ejecutivo2", password: "exec123", color: "#5b21b6" },
];

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const { user, logout, login } = useAuth();
  const [, setLocation] = useLocation();
  const [showSwitch, setShowSwitch] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const colors = user ? (roleColor[user.role] ?? roleColor.admin) : roleColor.admin;

  const handleSwitch = async (role: typeof SWITCH_ROLES[0]) => {
    setSwitching(role.label);
    try {
      await logout();
      await new Promise(r => setTimeout(r, 200));
      await login({ username: role.username, password: role.password });
    } catch {
      setSwitching(null);
    }
    setShowSwitch(false);
    setSwitching(null);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {title && (
        <header
          className="sticky top-0 z-40 bg-white flex items-center justify-between px-4 pt-safe"
          style={{
            height: "calc(3rem + env(safe-area-inset-top, 0px))",
            boxShadow: "0 1px 0 rgba(15,31,61,0.08), 0 2px 6px rgba(15,31,61,0.03)",
          }}
        >
          <div className="flex items-center gap-2.5 h-12">
            {back ? (
              <button
                onClick={() => setLocation(back)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-primary -ml-1"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div
                className="w-6.5 h-6.5 rounded-md flex items-center justify-center mr-0.5 flex-shrink-0"
                style={{ background: "#0f1f3d", width: "26px", height: "26px" }}
              >
                <span className="text-white font-bold text-[10px]" style={{ fontFamily: "Georgia, serif" }}>HC</span>
              </div>
            )}
            <h1 className="text-[15px] font-semibold text-foreground tracking-tight leading-none">{title}</h1>
          </div>

          <div className="flex items-center gap-1 h-12">
            {user && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: colors.bg, color: colors.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                {roleLabel[user.role] ?? user.role}
              </span>
            )}
            <button
              onClick={() => setShowSwitch(true)}
              title="Cambiar perfil"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-secondary"
              style={{ color: "#94a3b8" }}
            >
              <RiLockLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>
      <BottomNav />

      {showSwitch && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowSwitch(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-semibold text-foreground">Cambiar perfil</p>
              <button onClick={() => setShowSwitch(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
                <RiCloseLine className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {SWITCH_ROLES.map(role => (
                <button
                  key={role.label}
                  onClick={() => handleSwitch(role)}
                  disabled={!!switching}
                  className="w-full h-[50px] rounded-xl flex items-center justify-between px-4 transition-all active:scale-[0.98] disabled:opacity-60 text-white"
                  style={{ background: role.color }}
                >
                  <span className="text-[14px] font-semibold">{role.label}</span>
                  {switching === role.label ? (
                    <svg className="w-4 h-4 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <RiSwapLine className="w-4 h-4 text-white/50" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
