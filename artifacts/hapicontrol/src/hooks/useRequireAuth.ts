import { useEffect } from "react";
import { useLocation } from "wouter";

export function useRequireAuth(allowedRoles?: string[]) {
  const [, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("hapi_token");
    const role = localStorage.getItem("hapi_role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      // Redirect to correct area
      if (role === "admin" || role === "executive") {
        navigate("/admin");
      } else {
        navigate("/mi-credito");
      }
    }
  }, []);
}
