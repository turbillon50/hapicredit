import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "./BottomNav";
import { RiLogoutBoxRLine, RiUserLine } from "react-icons/ri";

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  executive: "Asesor",
  client: "Cliente",
};

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {title && (
        <header className="sticky top-0 z-40 bg-white border-b border-border shadow-card flex items-center justify-between px-4 pt-safe" style={{ height: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}>
          <div className="flex items-center gap-3 h-14">
            {back && (
              <a href={back} className="text-primary mr-1 flex items-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            )}
            <h1 className="text-[17px] font-semibold text-foreground tracking-tight">{title}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2 h-14">
              <div className="flex items-center gap-2 bg-secondary rounded-full pl-2 pr-3 py-1">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <RiUserLine className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{roleLabel[user.role] || user.role}</span>
              </div>
              <button
                onClick={() => logout()}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              >
                <RiLogoutBoxRLine className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </header>
      )}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
