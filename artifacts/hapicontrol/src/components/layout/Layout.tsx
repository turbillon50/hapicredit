import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  IconHome, IconSolicitar, IconMiCredito, IconPerfil, IconAdmin, IconAtras,
  IconPanel, IconBandeja, IconCartera, IconAlerta, IconArbol,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

type NavItem = { icon: React.ReactNode; label: string; path: string };

const clientNav: NavItem[] = [
  { icon: <IconHome />,        label: "Inicio",     path: "/"           },
  { icon: <IconSolicitar />,   label: "Solicitar",  path: "/solicitar"  },
  { icon: <IconMiCredito />,   label: "Mi Credito", path: "/mi-credito" },
  { icon: <IconPerfil />,      label: "Perfil",     path: "/perfil"     },
  { icon: <IconAdmin />,       label: "Admin",      path: "/admin"      },
];

const adminNav: NavItem[] = [
  { icon: <IconPanel />,   label: "Panel",       path: "/admin"             },
  { icon: <IconBandeja />, label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <IconCartera />, label: "Cartera",     path: "/admin/cartera"     },
  { icon: <IconAlerta />,  label: "Morosos",     path: "/admin/morosos"     },
  { icon: <IconArbol />,   label: "Mi Red",      path: "/admin/arbol"       },
];

function isActive(path: string, current: string) {
  if (path === "/" && current === "/") return true;
  if (path === "/admin" && current === "/admin") return true;
  if (path !== "/" && path !== "/admin") return current.startsWith(path);
  return false;
}

async function ensureAdminToken() {
  const existing = localStorage.getItem("hapi_token");
  if (existing) {
    try {
      const check = await fetch(`${API}/clients`, { headers: { Authorization: `Bearer ${existing}` } });
      if (check.ok) return;
    } catch {}
    localStorage.removeItem("hapi_token");
  }
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const data = await res.json();
    if (data.token) localStorage.setItem("hapi_token", data.token);
  } catch {}
}

function getRoleInfo(location: string) {
  if (location.startsWith("/admin")) {
    return { label: "Administrador", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" };
  }
  if (location === "/solicitar" || location === "/mi-credito" || location === "/perfil") {
    return { label: "Cliente", color: "var(--accent)", bg: "rgba(26,46,94,0.1)" };
  }
  return null;
}

function HapiLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="52" r="16" fill="white"/>
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const navItems = isAdmin ? adminNav : clientNav;
  const roleInfo = getRoleInfo(location);
  const queryClient = useQueryClient();

  useEffect(() => {
    ensureAdminToken().then(() => {
      // Invalidate all queries so they retry with the fresh token
      queryClient.invalidateQueries();
    });
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: "var(--surface-2)" }}>

      <div
        className="sticky top-0 z-30 shrink-0"
        style={{ background: "var(--navy-800)" }}
      >
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
        <header
          className="flex items-center justify-between px-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            height: "56px",
          }}
        >
          {isAdmin ? (
            <>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-white/70 pressable py-3"
              >
                <IconAtras size={18} />
                <span className="text-sm font-medium">Inicio</span>
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                >
                  Admin
                </div>
                <span className="text-white font-bold text-sm tracking-tight">HapiControl</span>
              </div>
              <div className="w-16" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <HapiLogo size={22} />
                </div>
                <div>
                  <div className="text-white font-bold text-base tracking-tight leading-none">
                    <span>Hapi</span><span style={{ color: "var(--brand-red)" }}>Credit</span>
                  </div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>Tu credito, Tu impulso</div>
                </div>
              </div>
              {roleInfo && (
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: "rgba(26,46,94,0.3)", color: "#93c5fd" }}
                >
                  {roleInfo.label}
                </div>
              )}
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
          background: isAdmin ? "var(--navy-800)" : "#fff",
          borderTop: isAdmin ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,31,61,0.08)",
          boxShadow: isAdmin ? "none" : "0 -2px 20px rgba(15,31,61,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const isAdminTab = item.path === "/admin" && !isAdmin;
          const iconColor = active
            ? (isAdmin ? "#60a5fa" : "var(--accent)")
            : isAdminTab
              ? "rgba(100,116,139,0.5)"
              : (isAdmin ? "rgba(255,255,255,0.35)" : "var(--text-muted)");
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 pressable relative"
            >
              <span
                className="transition-colors"
                style={{ color: iconColor }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] transition-colors"
                style={{
                  color: iconColor,
                  fontWeight: active ? 700 : 500,
                }}
              >
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
