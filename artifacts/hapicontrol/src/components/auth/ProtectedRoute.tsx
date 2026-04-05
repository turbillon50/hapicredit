import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { RiLoader4Line } from "react-icons/ri";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, initialized } = useAuth();

  // No token in storage = go to login immediately, no waiting
  if (!localStorage.getItem("hapi_token")) {
    return <Redirect to="/login" />;
  }

  if (!initialized) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "var(--navy-900)" }}>
        <RiLoader4Line className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin")     return <Redirect to="/admin" />;
    if (user.role === "executive") return <Redirect to="/dashboard" />;
    if (user.role === "client")    return <Redirect to="/portal" />;
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
