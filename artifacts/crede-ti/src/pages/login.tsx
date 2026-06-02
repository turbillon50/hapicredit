import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// Legacy /login route — we no longer ship a custom username/password form.
// Clerk is the only auth surface now. This page just redirects:
//   - If the user is already signed in via Clerk → role home
//   - Otherwise → Clerk's <SignIn /> at /sign-in
export default function Login() {
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
    window.location.href = `${basePath}/sign-in`;
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#06143B 0%,#215DFF 55%,#19D7D7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Montserrat, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
    }}>
      Redirigiendo a inicio de sesión…
    </div>
  );
}
