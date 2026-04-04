import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "./BottomNav";
import { RiLogoutBoxRLine } from "react-icons/ri";

export function Layout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-background pb-16">
      {title && (
        <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
          {user && (
            <button 
              onClick={() => logout()} 
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
            >
              <RiLogoutBoxRLine className="w-5 h-5" />
            </button>
          )}
        </header>
      )}
      <main className="max-w-md mx-auto w-full px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
