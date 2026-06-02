import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useClerk } from "@clerk/react";
import {
  IconHome, IconSolicitar, IconMiCredito, IconPerfil,
  IconPanel, IconBandeja, IconCartera, IconAlerta, IconArbol,
  IconPersona, IconMoneda, IconMas, IconFinanzas, IconCalendario,
} from "@/components/hapi/HapiIcons";
import { useTheme } from "@/hooks/use-theme";
import logoImg from "@assets/logo-credeti-square.jpeg";

/* Toggle claro/oscuro — sol/luna. `tone` adapta el color al header. */
function ThemeToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const color = tone === "light" ? "rgba(255,255,255,0.75)" : "var(--text-muted)";
  const bg    = tone === "light" ? "rgba(255,255,255,0.12)" : "var(--surface-2)";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Modo claro" : "Modo oscuro"}
      className="pressable"
      style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, border: "none", cursor: "pointer", color,
      }}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

/* Marca Crede-Ti con wordmark serif (eco del logo). */
function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 30, height: 30, borderRadius: 9, overflow: "hidden", flexShrink: 0, boxShadow: "var(--shadow-xs)" }}>
        <img src={logoImg} alt="Crede-Ti" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <span className="font-display" style={{ fontWeight: 700, fontSize: 19, color: "var(--text-primary)" }}>
        Crede<span style={{ color: "var(--brand-gold)" }}>-Ti</span>
      </span>
    </div>
  );
}

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

function HapiIcon({ size = 20, color = "#215DFF" }: { size?: number; color?: string }) {
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
  const t = localStorage.getItem("credeti_token");
  const r = localStorage.getItem("credeti_role");
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
  const { signOut } = useClerk();

  const role  = localStorage.getItem("credeti_role");
  const token = localStorage.getItem("credeti_token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("credeti_user") || "{}"); } catch { return {}; } })();

  const access = checkAccess(location);
  if (access === "login") { navigate("/login"); return null; }
  if (access !== "ok") { navigate(access); return null; }

  const isAdmin = location.startsWith("/admin");
  const isExec  = location.startsWith("/dashboard") || location.startsWith("/executive");
  const isStaff = isAdmin || isExec;
  const navItems = isAdmin ? adminNav : isExec ? execNav : clientNav;

  useEffect(() => {
    const t = localStorage.getItem("credeti_token");
    const r = localStorage.getItem("credeti_role");
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
    localStorage.removeItem("credeti_token");
    localStorage.removeItem("credeti_role");
    localStorage.removeItem("credeti_user");
    queryClient.clear();
    signOut({ redirectUrl: "/sign-in" }).catch(() => {
      window.location.href = "/sign-in";
    });
  }

  /* ── Staff (admin/exec) header — marca profunda ── */
  const StaffHeader = () => (
    <div className="sticky top-0 z-30 shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-blue-deep) 0%, var(--brand-blue) 110%)" }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <header className="flex items-center justify-between px-4" style={{ height: 58, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={() => {
            if (back) { navigate(back); }
            else if (window.history.length > 1) { window.history.back(); }
            else { navigate(isAdmin ? "/admin" : isExec ? "/dashboard" : "/"); }
          }}
          className="flex items-center gap-1.5 pressable"
          style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Atras</span>
        </button>

        <div className="flex items-center gap-2">
          {!title && <RoleBadge role={role} />}
          <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>
            {title ?? <>Crede<span style={{ color: "var(--brand-gold)" }}>-Ti</span></>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle tone="light" />
          {token && (
            <button onClick={handleLogout} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Salir
            </button>
          )}
        </div>
      </header>
    </div>
  );

  /* ── Client/public header — superficie ── */
  const ClientHeader = () => (
    <div className="sticky top-0 z-30 shrink-0" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <header className="flex items-center justify-between px-4" style={{ height: 58 }}>
        <BrandMark />

        <div className="flex items-center gap-2">
          {role && <RoleBadge role={role} />}
          <ThemeToggle tone="dark" />
          {token ? (
            <button onClick={handleLogout} style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Salir
            </button>
          ) : (
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-blue)", textDecoration: "none", padding: "6px 14px", border: "1.5px solid var(--border-mid)", borderRadius: 100 }}>
              Iniciar sesion
            </a>
          )}
        </div>
      </header>
    </div>
  );

  const isDemo = typeof token === "string" && token.startsWith("demo-token");

  // Honest server check: if the backend says demo is disabled (production
  // default), purge any lingering demo token from a previous session so the
  // user isn't shown a ghost demo state. Runs once on mount.
  useEffect(() => {
    if (!isDemo) return;
    fetch(`/api/demo/status`).then(r => r.json()).then(d => {
      if (d && d.enabled === false) {
        localStorage.removeItem("credeti_token");
        localStorage.removeItem("credeti_role");
        localStorage.removeItem("credeti_user");
        window.location.href = "/";
      }
    }).catch(() => { /* ignore — keep the demo banner visible until we know better */ });
  }, [isDemo]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bg-warm)" }}>
      {isDemo && (
        <div style={{
          background: "var(--brand-gold)", color: "var(--brand-blue-deep)",
          paddingTop: "calc(6px + env(safe-area-inset-top, 0px))",
          paddingBottom: 6,
          paddingLeft: "calc(14px + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(14px + env(safe-area-inset-right, 0px))",
          fontSize: 11, fontWeight: 800,
          letterSpacing: "0.08em", textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
        }}>
          <span>● Modo demo — sin base de datos · listados vacíos esperados</span>
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            style={{
              background: "rgba(10,31,74,0.12)", color: "#0A2E8A",
              border: "none", borderRadius: 100, padding: "3px 10px",
              fontWeight: 700, fontSize: 10, cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            Salir
          </button>
        </div>
      )}
      {isStaff ? <StaffHeader /> : <ClientHeader />}

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        display: "flex",
        background: isStaff ? "var(--brand-blue-deep)" : "var(--surface)",
        borderTop: isStaff ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--border)",
        boxShadow: isStaff ? "none" : "0 -2px 20px rgba(15,23,42,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {navItems.map(item => {
          const active = isActive(item.path, location);
          const activeColor = isStaff ? "var(--brand-gold)" : "var(--brand-blue)";
          const inactiveColor = isStaff ? "rgba(255,255,255,0.4)" : "var(--text-muted)";
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
