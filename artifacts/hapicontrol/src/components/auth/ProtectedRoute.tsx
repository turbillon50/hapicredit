import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { RiLoader4Line } from "react-icons/ri";

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) {
  const { user, initialized } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      setLocation("/login");
    } else if (!allowedRoles.includes(user.role)) {
      if (user.role === "admin")     setLocation("/admin");
      else if (user.role === "executive") setLocation("/dashboard");
      else if (user.role === "client")    setLocation("/portal");
      else setLocation("/");
    }
  }, [user, initialized, setLocation, allowedRoles]);

  if (!initialized) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "var(--navy-900)" }}>
        <div className="flex flex-col items-center gap-4">
          <RiLoader4Line className="w-10 h-10 text-white animate-spin" />
          <div className="text-sm text-white/50">Iniciando sesión...</div>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
