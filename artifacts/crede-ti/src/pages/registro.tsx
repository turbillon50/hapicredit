import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// Legacy /registro route — the bespoke step-based registration UI is gone.
// All sign-up now happens in Clerk's <SignUp /> at /sign-up.
//   - Already signed in → role home
//   - Not signed in → Clerk sign-up
// Admin/asesor role assignment is owner-driven via Clerk publicMetadata.role
// in the Clerk dashboard, or via the elevation flow in /perfil.
export default function Registro() {
  const [, navigate] = useLocation();
  const { isSignedIn, isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      const role =
        (user?.publicMetadata?.role as string | undefined)
        ?? localStorage.getItem("credeti_role")
        ?? "client";
      const home = role === "admin" ? "/admin"
        : role === "executive" ? "/dashboard"
        : "/mi-credito";
      window.location.href = `${basePath}${home}`;
      return;
    }
    window.location.href = `${basePath}/sign-up`;
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#06143B 0%,#215DFF 55%,#19D7D7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.7)",
      fontFamily: "'Inter', -apple-system, sans-serif",
      fontSize: 14,
    }}>
      Redirigiendo al registro…
    </div>
  );
}
