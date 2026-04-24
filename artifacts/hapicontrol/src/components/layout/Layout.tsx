import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  IconHome, IconSolicitar, IconMiCredito, IconPerfil,
  IconPanel, IconBandeja, IconCartera, IconAlerta, IconArbol,
  IconPersona, IconMoneda, IconMas, IconFinanzas, IconCalendario,
} from "@/components/hapi/HapiIcons";

type NavItem = { icon: React.ReactNode; label: string; path: string };

const clientNav: NavItem[] = [
  { icon: <IconHome size={22} />,      label: "Inicio",      path: "/"           },
  { icon: <IconSolicitar size={22} />, label: "Solicitar",   path: "/solicitar"  },
  { icon: <IconMiCredito size={22} />, label: "Mi Credito",  path: "/mi-credito" },
  { icon: <IconPerfil size={22} />,    label: "Perfil",      path: "/perfil"     },
];

const adminNav: NavItem[] = [
  { icon: <IconPanel size={22} />,   label: "Panel",       path: "/admin"             },
  { icon: <IconBandeja size={22} />, label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <IconCartera size={22} />, label: "Cartera",     path: "/admin/cartera"     },
  { icon: <IconAlerta size={22} />,  label: "Morosos",     path: "/admin/morosos"     },
  { icon: <IconArbol size={22} />,   label: "Red",         path: "/admin/arbol"       },
];

const execNav: NavItem[] = [
  { icon: <IconPanel size={22} />,       label: "Panel",    path: "/dashboard"              },
  { icon: <IconPersona size={22} />,     label: "Clientes", path: "/dashboard/clientes"     },
  { icon: <IconCalendario size={22} />,  label: "Agenda",   path: "/dashboard/agenda"       },
  { icon: <IconMoneda size={22} />,      label: "Cobrar",   path: "/dashboard/cobrar"       },
  { icon: <IconMas size={22} />,         label: "Alta",     path: "/dashboard/alta-cliente" },
];

function isActive(path: string, current: string) {
  if (path === "/" && current === "/") return true;
  if ((path === "/admin" && current === "/admin") || (path === "/dashboard" && current === "/dashboard")) return true;
  if (path !== "/" && path !== "/admin" && path !== "/dashboard") return current.startsWith(path);
  return false;
}

function HapiIcon({ size = 20, color = "#e84545" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <circle cx="90" cy="52" r="16" fill={color} />
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill={color} />
    </svg>
  );
}

function UserAvatar({ name, size = 32, dark = false }: { name: string; size?: number; dark?: boolean }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: dark ? "rgba(255,255,255,0.15)" : "var(--navy)",
      border: dark ? "1.5px solid rgba(255,255,255,0.2)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700,
      color: dark ? "#fff" : "#fff",
      letterSpacing: "-0.02em", flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const map: Record<string, { label: string; bg: string; color: string }> = {
    admin:     { label: "Admin",   bg: "#f3e8ff", color: "#7c3aed" },
    executive: { label: "Asesor",  bg: "#dbeafe", color: "#1d4ed8" },
    client:    { label: "Cliente", bg: "#d1fae5", color: "#065f46" },
  };
  const m = map[role];
  if (!m) return null;
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 100,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase", background: m.bg, color: m.color,
    }}>
      {m.label}
    </span>
  );
}

function checkAccess(location: string): "ok" | "login" | string {
  const t = localStorage.getItem("hapi_token");
  const r = localStorage.getItem("hapi_role");
  const publicPaths = ["/", "/login", "/registro", "/privacidad", "/terminos", "/faq"];
  if (!t) return publicPaths.includes(location) ? "ok" : "login";
  if (location.startsWith("/admin") && r !== "admin") return r === "executive" ? "/dashboard" : "/mi-credito";
  if ((location.startsWith("/dashboard") || location === "/executive") && r !== "executive") return r === "admin" ? "/admin" : "/mi-credito";
  if (["/solicitar", "/mi-credito", "/perfil"].includes(location)) {
    if (r === "admin") return "/admin";
    if (r === "executive") return "/dashboard";
  }
  return "ok";
}

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  const role  = localStorage.getItem("hapi_role");
  const token = localStorage.getItem("hapi_token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}"); } catch { return {}; } })();

  const access = checkAccess(location);
  if (access === "login") { navigate("/login"); return null; }
  if (access !== "ok") { navigate(access); return null; }

  const isAdmin = location.startsWith("/admin");
  const isExec  = location.startsWith("/dashboard") || location.startsWith("/executive");
  const isStaff = isAdmin || isExec;
  const navItems = isAdmin ? adminNav : isExec ? execNav : clientNav;

  useEffect(() => {
    const t = localStorage.getItem("hapi_token");
    const r = localStorage.getItem("hapi_role");
    const publicPaths = ["/", "/login", "/registro", "/privacidad", "/terminos", "/faq"];
    const isPublic = publicPaths.includes(location) || location.startsWith("/sign-in") || location.startsWith("/sign-up");
    if (!t) { if (!isPublic) navigate("/login"); return; }
    if (location.startsWith("/admin"))     { if (r !== "admin")     { navigate(r === "executive" ? "/dashboard" : "/mi-credito"); return; } }
    if (location.startsWith("/dashboard") || location === "/executive") { if (r !== "executive") { navigate(r === "admin" ? "/admin" : "/mi-credito"); return; } }
    if (["/solicitar", "/mi-credito", "/perfil"].includes(location)) {
      if (r === "admin")     { navigate("/admin");     return; }
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

  /* ── Staff (admin/exec) header — dark ── */
  const StaffHeader = () => (
    <div className="sticky top-0 z-30 shrink-0" style={{ background: "linear-gradient(135deg,#080f1f 0%,#142246 100%)" }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <header className="flex items-center justify-between px-4" style={{ height: 58, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={() => {
            if (back) { navigate(back); }
            else if (window.history.length > 1) { window.history.back(); }
            else { navigate(isAdmin ? "/admin" : isExec ? "/dashboard" : "/"); }
          }}
          className="flex items-center gap-1.5 pressable"
          style={{ color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Atras</span>
        </button>

        <div className="flex items-center gap-2">
          {!title && <RoleBadge role={role} />}
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "-0.025em" }}>
            {title ?? "HapiControl"}
          </span>
        </div>

        {token ? (
          <div className="flex items-center gap-2">
            <UserAvatar name={user?.fullName ?? user?.username ?? "U"} size={30} dark />
            <button onClick={handleLogout} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Salir
            </button>
          </div>
        ) : <div style={{ width: 56 }} />}
      </header>
    </div>
  );

  /* ── Client/public header — white ── */
  const ClientHeader = () => (
    <div className="sticky top-0 z-30 shrink-0" style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <header className="flex items-center justify-between px-4" style={{ height: 58 }}>
        <div className="flex items-center gap-2">
          <HapiIcon size={22} color="#e84545" />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.04em", color: "#111" }}>
            Hapi<span style={{ color: "#e84545" }}>Credit</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {role && <RoleBadge role={role} />}
          {token ? (
            <div className="flex items-center gap-2">
              <UserAvatar name={user?.fullName ?? user?.username ?? "U"} size={32} />
              <button onClick={handleLogout} style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Salir
              </button>
            </div>
          ) : (
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", textDecoration: "none", padding: "6px 14px", border: "1.5px solid var(--border-mid)", borderRadius: 100 }}>
              Iniciar sesion
            </a>
          )}
        </div>
      </header>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bg-warm)" }}>
      {isStaff ? <StaffHeader /> : <ClientHeader />}

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        display: "flex",
        background: isStaff ? "#0d1a36" : "#fff",
        borderTop: isStaff ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border)",
        boxShadow: isStaff ? "none" : "0 -2px 20px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const activeColor = isStaff ? "#93c5fd" : "var(--coral)";
          const inactiveColor = isStaff ? "rgba(255,255,255,0.3)" : "var(--text-muted)";
          const color = active ? activeColor : inactiveColor;

          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", paddingTop: 10, paddingBottom: 8, gap: 3,
                textDecoration: "none", position: "relative",
                cursor: "pointer",
                transition: "opacity 0.1s",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 32, height: 3, borderRadius: 2,
                  background: active ? activeColor : "transparent",
                }} />
              )}
              <span style={{ color, transition: "color 0.15s" }}>{item.icon}</span>
              <span style={{ fontSize: 10, color, fontWeight: active ? 700 : 500, transition: "color 0.15s", letterSpacing: "0.01em" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
