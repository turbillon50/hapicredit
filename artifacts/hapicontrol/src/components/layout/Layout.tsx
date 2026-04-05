import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  RiHomeLine, RiAddCircleLine, RiBankCardLine, RiUserLine,
  RiInboxLine, RiFileListLine, RiGroupLine,
  RiSettings3Line, RiArrowLeftLine, RiAlarmWarningLine,
} from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

type NavItem = { icon: React.ReactNode; label: string; path: string };

const clientNav: NavItem[] = [
  { icon: <RiHomeLine />,        label: "Inicio",     path: "/"           },
  { icon: <RiAddCircleLine />,   label: "Solicitar",  path: "/solicitar"  },
  { icon: <RiBankCardLine />,    label: "Mi Crédito", path: "/mi-credito" },
  { icon: <RiUserLine />,        label: "Perfil",     path: "/perfil"     },
  { icon: <RiSettings3Line />,   label: "Admin",      path: "/admin"      },
];

const adminNav: NavItem[] = [
  { icon: <RiHomeLine />,        label: "Panel",       path: "/admin"             },
  { icon: <RiInboxLine />,       label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <RiFileListLine />,    label: "Cartera",     path: "/admin/cartera"     },
  { icon: <RiAlarmWarningLine />,label: "Morosos",     path: "/admin/morosos"     },
  { icon: <RiGroupLine />,       label: "Asesores",    path: "/admin/asesores"    },
];

function isActive(path: string, current: string) {
  if (path === "/" && current === "/") return true;
  if (path === "/admin" && current === "/admin") return true;
  if (path !== "/" && path !== "/admin") return current.startsWith(path);
  return false;
}

async function ensureAdminToken() {
  const existing = localStorage.getItem("hapi_token");
  if (existing) return;
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

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const navItems = isAdmin ? adminNav : clientNav;

  useEffect(() => {
    ensureAdminToken();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: "var(--surface-2)" }}>

      <div
        className="sticky top-0 z-30 shrink-0"
        style={{ background: "var(--navy-900)" }}
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
                <RiArrowLeftLine className="text-lg" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="text-white font-bold text-sm tracking-tight">Administrador</div>
              <div className="w-16" />
            </>
          ) : (
            <>
              <div>
                <div className="text-white font-bold text-base tracking-tight leading-none">HapiCredit</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Grupo CAFJA</div>
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
          background: isAdmin ? "var(--navy-900)" : "#fff",
          borderTop: isAdmin ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,31,61,0.08)",
          boxShadow: isAdmin ? "none" : "0 -2px 20px rgba(15,31,61,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const isAdminTab = item.path === "/admin" && !isAdmin;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 pressable relative"
            >
              <span
                className="text-[22px] transition-colors"
                style={{ color: active ? (isAdmin ? "#60a5fa" : "var(--accent)") : isAdminTab ? "rgba(100,116,139,0.5)" : (isAdmin ? "rgba(255,255,255,0.35)" : "var(--text-muted)") }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] transition-colors"
                style={{
                  color: active ? (isAdmin ? "#60a5fa" : "var(--accent)") : isAdminTab ? "rgba(100,116,139,0.5)" : (isAdmin ? "rgba(255,255,255,0.35)" : "var(--text-muted)"),
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: isAdmin ? "#60a5fa" : "var(--accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
