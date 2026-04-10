import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  IconHome, IconSolicitar, IconMiCredito, IconPerfil,
  IconPanel, IconBandeja, IconCartera, IconAlerta, IconArbol,
  IconPersona, IconMoneda, IconMas, IconFinanzas,
} from "@/components/hapi/HapiIcons";

type NavItem = { icon: React.ReactNode; label: string; path: string };

const clientNav: NavItem[] = [
  { icon: <IconHome />,      label: "Inicio",      path: "/"           },
  { icon: <IconSolicitar />, label: "Solicitar",   path: "/solicitar"  },
  { icon: <IconMiCredito />, label: "Mi Credito",  path: "/mi-credito" },
  { icon: <IconPerfil />,    label: "Perfil",      path: "/perfil"     },
];

const adminNav: NavItem[] = [
  { icon: <IconPanel />,   label: "Panel",       path: "/admin"             },
  { icon: <IconBandeja />, label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <IconCartera />, label: "Cartera",     path: "/admin/cartera"     },
  { icon: <IconAlerta />,  label: "Morosos",     path: "/admin/morosos"     },
  { icon: <IconArbol />,   label: "Mi Red",      path: "/admin/arbol"       },
];

const execNav: NavItem[] = [
  { icon: <IconPanel />,    label: "Panel",      path: "/dashboard"             },
  { icon: <IconPersona />,  label: "Clientes",   path: "/dashboard/clientes"    },
  { icon: <IconMoneda />,   label: "Cobrar",     path: "/dashboard/cobrar"      },
  { icon: <IconMas />,      label: "Alta",       path: "/dashboard/alta-cliente"},
  { icon: <IconFinanzas />, label: "Comisiones", path: "/dashboard/comisiones"  },
];

function isActive(path: string, current: string) {
  if (path === "/" && current === "/") return true;
  if ((path === "/admin" && current === "/admin") || (path === "/dashboard" && current === "/dashboard")) return true;
  if (path !== "/" && path !== "/admin" && path !== "/dashboard") return current.startsWith(path);
  return false;
}

function HapiLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <circle cx="90" cy="52" r="16" fill="white"/>
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
    </svg>
  );
}

function getRoleBadge(role: string | null) {
  if (role === "admin") return { label: "Admin", color: "#a78bfa", bg: "rgba(124,58,237,0.2)" };
  if (role === "executive") return { label: "Asesor", color: "#60a5fa", bg: "rgba(37,99,235,0.2)" };
  if (role === "client") return { label: "Cliente", color: "#34d399", bg: "rgba(16,185,129,0.2)" };
  return null;
}

function checkAccess(location: string): "ok" | "login" | string {
  const t = localStorage.getItem("hapi_token");
  const r = localStorage.getItem("hapi_role");

  const publicPaths = ["/", "/login", "/registro"];
  const isPublic = publicPaths.includes(location) || location.startsWith("/sign-in") || location.startsWith("/sign-up");

  if (!t) return isPublic ? "ok" : "login";

  if (location.startsWith("/admin") && r !== "admin")
    return r === "executive" ? "/dashboard" : "/mi-credito";
  if ((location.startsWith("/dashboard") || location === "/executive") && r !== "executive")
    return r === "admin" ? "/admin" : "/mi-credito";
  if (["/solicitar", "/mi-credito", "/perfil"].includes(location)) {
    if (r === "admin") return "/admin";
    if (r === "executive") return "/dashboard";
  }
  return "ok";
}

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  const role = localStorage.getItem("hapi_role");
  const token = localStorage.getItem("hapi_token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}"); } catch { return {}; } })();

  // Synchronous guard — blocks render before redirect fires
  const access = checkAccess(location);
  if (access === "login") { navigate("/login"); return null; }
  if (access !== "ok") { navigate(access); return null; }

  const isAdmin = location.startsWith("/admin");
  const isExec  = location.startsWith("/dashboard") || location.startsWith("/executive");
  const navItems = isAdmin ? adminNav : isExec ? execNav : clientNav;
  const badge = getRoleBadge(role);

  // Route protection — strict per role
  useEffect(() => {
    const t = localStorage.getItem("hapi_token");
    const r = localStorage.getItem("hapi_role");

    const publicPaths = ["/", "/login", "/registro"];
    const isPublic = publicPaths.includes(location) || location.startsWith("/sign-in") || location.startsWith("/sign-up");

    if (!t) {
      if (!isPublic) navigate("/login");
      return;
    }

    // Logged in — enforce strict role routing
    if (location.startsWith("/admin")) {
      if (r !== "admin") {
        navigate(r === "executive" ? "/dashboard" : "/mi-credito");
        return;
      }
    }
    if (location.startsWith("/dashboard") || location === "/executive") {
      if (r !== "executive") {
        navigate(r === "admin" ? "/admin" : "/mi-credito");
        return;
      }
    }
    if (["/solicitar", "/mi-credito", "/perfil"].includes(location)) {
      if (r === "admin") { navigate("/admin"); return; }
      if (r === "executive") { navigate("/dashboard"); return; }
    }
  }, [location]);

  function handleLogout() {
    localStorage.removeItem("hapi_token");
    localStorage.removeItem("hapi_role");
    localStorage.removeItem("hapi_user");
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: "var(--surface-2)" }}>

      <div className="sticky top-0 z-30 shrink-0" style={{ background: "var(--navy-800)" }}>
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
        <header
          className="flex items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", height: "56px" }}
        >
          {(isAdmin || isExec) ? (
            <>
              <button
                onClick={() => back ? navigate(back) : navigate("/")}
                className="flex items-center gap-2 text-white/70 pressable py-3 min-w-[56px]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                <span className="text-sm font-medium">{back ? "Atras" : "Inicio"}</span>
              </button>
              <div className="flex items-center gap-2">
                {badge && !title && (
                  <div className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </div>
                )}
                <span className="text-white font-bold text-sm tracking-tight">{title ?? "HapiControl"}</span>
              </div>
              {token ? (
                <button onClick={handleLogout} className="text-xs text-white/50 pressable py-2 px-1 hover:text-white/80 min-w-[40px] text-right">
                  Salir
                </button>
              ) : (
                <div className="min-w-[40px]" />
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <HapiLogo size={22} />
                </div>
                <div>
                  <div className="text-white font-bold text-base tracking-tight leading-none">
                    <span>Hapi</span><span style={{ color: "var(--brand-red)" }}>Credit</span>
                  </div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>Tu credito, Tu impulso</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <div className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </div>
                )}
                {token && (
                  <button onClick={handleLogout} className="text-xs text-white/50 pressable py-2 hover:text-white/80">
                    Salir
                  </button>
                )}
              </div>
            </>
          )}
        </header>
      </div>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex"
        style={{
          background: (isAdmin || isExec) ? "var(--navy-800)" : "#fff",
          borderTop: (isAdmin || isExec) ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,31,61,0.08)",
          boxShadow: (isAdmin || isExec) ? "none" : "0 -2px 20px rgba(15,31,61,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const iconColor = active
            ? ((isAdmin || isExec) ? "#60a5fa" : "var(--accent)")
            : ((isAdmin || isExec) ? "rgba(255,255,255,0.35)" : "var(--text-muted)");
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 pressable relative"
            >
              <span className="transition-colors" style={{ color: iconColor }}>
                {item.icon}
              </span>
              <span className="text-[10px] transition-colors" style={{ color: iconColor, fontWeight: active ? 700 : 500 }}>
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: isAdmin ? "#60a5fa" : "var(--brand-red)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
