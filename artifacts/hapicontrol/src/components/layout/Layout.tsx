import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "./BottomNav";
import { RiLockLine, RiLogoutBoxRLine } from "react-icons/ri";
import { useLocation } from "wouter";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  executive: "Asesor",
  client: "Cliente",
};

const roleColor: Record<string, { bg: string; text: string; dot: string }> = {
  admin:     { bg: "#eef3fb", text: "#1a3a6b", dot: "#1a3a6b" },
  executive: { bg: "#f0fdf4", text: "#065f46", dot: "#059669" },
  client:    { bg: "#f5f3ff", text: "#4c1d95", dot: "#7c3aed" },
};

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const colors = user ? (roleColor[user.role] ?? roleColor.admin) : roleColor.admin;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {title && (
        <header
          className="sticky top-0 z-40 bg-white border-b border-border flex items-center justify-between px-4 pt-safe"
          style={{ height: "calc(3.25rem + env(safe-area-inset-top, 0px))", boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(15,31,63,0.04)" }}
        >
          <div className="flex items-center gap-2.5 h-[3.25rem]">
            {back ? (
              <button
                onClick={() => setLocation(back)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-primary hover:bg-primary/8 transition-colors -ml-1"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mr-0.5 flex-shrink-0"
                style={{ background: "#0f1f3d" }}
              >
                <span className="text-white font-bold text-[11px]" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.3px" }}>HC</span>
              </div>
            )}
            <h1 className="text-[16px] font-semibold text-foreground tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-1.5 h-[3.25rem]">
            {user && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: colors.bg, color: colors.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                {roleLabel[user.role] ?? user.role}
              </span>
            )}
            <button
              onClick={() => logout()}
              title="Cambiar rol / Cerrar sesión"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-secondary"
              style={{ color: "#94a3b8" }}
            >
              <RiLockLine className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout()}
              title="Cerrar sesión"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-destructive/10 hover:text-destructive"
              style={{ color: "#94a3b8" }}
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
