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
  { icon: <IconHome size={22} />,      label: "Inicio",     path: "/"           },
  { icon: <IconSolicitar size={22} />, label: "Solicitar",  path: "/solicitar"  },
  { icon: <IconMiCredito size={22} />, label: "Mi Credito", path: "/mi-credito" },
  { icon: <IconPerfil size={22} />,    label: "Perfil",     path: "/perfil"     },
];

const adminNav: NavItem[] = [
  { icon: <IconPanel size={22} />,   label: "Panel",       path: "/admin"             },
  { icon: <IconBandeja size={22} />, label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <IconCartera size={22} />, label: "Cartera",     path: "/admin/cartera"     },
  { icon: <IconAlerta size={22} />,  label: "Morosos",     path: "/admin/morosos"     },
  { icon: <IconArbol size={22} />,   label: "Red",         path: "/admin/arbol"       },
];

const execNav: NavItem[] = [
  { icon: <IconPanel size={22} />,    label: "Panel",     path: "/dashboard"              },
  { icon: <IconPersona size={22} />,  label: "Clientes",  path: "/dashboard/clientes"     },
  { icon: <IconMoneda size={22} />,   label: "Cobrar",    path: "/dashboard/cobrar"       },
  { icon: <IconMas size={22} />,      label: "Alta",      path: "/dashboard/alta-cliente" },
  { icon: <IconBandeja size={22} />,  label: "Codigos",   path: "/dashboard/codigos"      },
];

function isActive(path: string, current: string) {
  if (path === "/" && current === "/") return true;
  if ((path === "/admin" && current === "/admin") || (path === "/dashboard" && current === "/dashboard")) return true;
  if (path !== "/" && path !== "/admin" && path !== "/dashboard") return current.startsWith(path);
  return false;
}

function HapiLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <circle cx="90" cy="52" r="16" fill="white"/>
      <path d="M90 140 C90 140 40 100 40 75 C40 58 53 48 66 48 C75 48 83 53 90 62 C97 53 105 48 114 48 C127 48 140 58 140 75 C140 100 90 140 90 140Z" fill="white"/>
    </svg>
  );
}

function UserAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 2,
        background: "rgba(255,255,255,0.18)",
        border: "1.5px solid rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700, color: "#fff",
        letterSpacing: "-0.02em", flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function getRoleBadge(role: string | null) {
  if (role === "admin")     return { label: "Admin",   color: "#c4b5fd", bg: "rgba(124,58,237,0.22)" };
  if (role === "executive") return { label: "Asesor",  color: "#93c5fd", bg: "rgba(37,99,235,0.22)" };
  if (role === "client")    return { label: "Cliente", color: "#6ee7b7", bg: "rgba(16,185,129,0.22)" };
  return null;
}

function checkAccess(location: string): "ok" | "login" | string {
  const t = localStorage.getItem("hapi_token");
  const r = localStorage.getItem("hapi_role");

  const publicPaths = ["/", "/login", "/registro", "/privacidad", "/terminos"];
  const isPublic = publicPaths.includes(location);

  if (!t) return isPublic ? "ok" : "registro";

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

  const role  = localStorage.getItem("hapi_role");
  const token = localStorage.getItem("hapi_token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}"); } catch { return {}; } })();

  const access = checkAccess(location);
  if (access === "registro") { navigate("/registro"); return null; }
  if (access !== "ok") { navigate(access); return null; }

  const isAdmin = location.startsWith("/admin");
  const isExec  = location.startsWith("/dashboard") || location.startsWith("/executive");
  const isDark  = isAdmin || isExec;
  const navItems = isAdmin ? adminNav : isExec ? execNav : clientNav;
  const badge = getRoleBadge(role);

  useEffect(() => {
    const t = localStorage.getItem("hapi_token");
    const r = localStorage.getItem("hapi_role");
    const publicPaths = ["/", "/login", "/registro"];
    const isPublic = publicPaths.includes(location) || location.startsWith("/sign-in") || location.startsWith("/sign-up");
    if (!t) { if (!isPublic) navigate("/registro"); return; }
    if (location.startsWith("/admin")) {
      if (r !== "admin") { navigate(r === "executive" ? "/dashboard" : "/mi-credito"); return; }
    }
    if (location.startsWith("/dashboard") || location === "/executive") {
      if (r !== "executive") { navigate(r === "admin" ? "/admin" : "/mi-credito"); return; }
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

  const headerBg = isDark
    ? "linear-gradient(135deg, #080f1f 0%, #142246 100%)"
    : "linear-gradient(135deg, #080f1f 0%, #142246 100%)";

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: "var(--surface-2)" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 shrink-0" style={{ background: headerBg }}>
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
        <header
          className="flex items-center justify-between px-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            height: "58px",
          }}
        >
          {(isAdmin || isExec) ? (
            <>
              {/* Back / home button */}
              <button
                onClick={() => back ? navigate(back) : navigate("/")}
                className="flex items-center gap-1.5 pressable py-2 min-w-[56px]"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{back ? "Atras" : "Inicio"}</span>
              </button>

              {/* Title / badge */}
              <div className="flex items-center gap-2">
                {badge && !title && (
                  <span
                    style={{
                      padding: "2px 8px", borderRadius: 6,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      background: badge.bg, color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                )}
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>
                  {title ?? "HapiControl"}
                </span>
              </div>

              {/* User avatar + logout */}
              {token ? (
                <div className="flex items-center gap-2 min-w-[56px] justify-end">
                  <UserAvatar name={user?.fullName ?? user?.username ?? "U"} size={30} />
                  <button
                    onClick={handleLogout}
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Salir
                  </button>
                </div>
              ) : <div className="min-w-[56px]" />}
            </>
          ) : (
            <>
              {/* Brand logo (public / client pages) */}
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <HapiLogo size={20} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    Hapi<span style={{ color: "var(--coral)" }}>Credit</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.02em", marginTop: 1 }}>
                    Tu credito, Tu impulso
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {badge && (
                  <span
                    style={{
                      padding: "2px 8px", borderRadius: 6,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      background: badge.bg, color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                )}
                {token && (
                  <div className="flex items-center gap-1.5">
                    <UserAvatar name={user?.fullName ?? user?.username ?? "U"} size={28} />
                    <button
                      onClick={handleLogout}
                      style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Salir
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </header>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex"
        style={{
          background: isDark ? "#080f1f" : "#fff",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(20,34,70,0.07)",
          boxShadow: isDark
            ? "none"
            : "0 -4px 24px rgba(20,34,70,0.07)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const iconColor = active
            ? (isDark ? "#93c5fd" : "var(--accent)")
            : (isDark ? "rgba(255,255,255,0.3)" : "var(--text-muted)");

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center pressable relative"
              style={{ paddingTop: 10, paddingBottom: 8, gap: 3 }}
            >
              {/* Active pill indicator */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 0, left: "50%",
                    transform: "translateX(-50%)",
                    width: active ? 36 : 0,
                    height: 3, borderRadius: 3,
                    background: isDark ? "#93c5fd" : "var(--coral)",
                    transition: "width 0.2s ease",
                  }}
                />
              )}

              <span style={{ color: iconColor, transition: "color 0.15s" }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 10, letterSpacing: "0.01em",
                  color: iconColor, fontWeight: active ? 700 : 500,
                  transition: "color 0.15s, font-weight 0.15s",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
