import { useEffect } from "react";
import { ReportButton } from "@/components/ReportButton";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  IconHome, IconSolicitar, IconMiCredito, IconPerfil,
  IconPanel, IconBandeja, IconCartera, IconAlerta, IconArbol,
  IconPersona, IconMoneda, IconMas, IconFinanzas, IconCalendario, IconEquipo,
} from "@/components/hapi/HapiIcons";
import { useTheme } from "@/hooks/use-theme";
import { useMyAvatar } from "@/hooks/use-my-avatar";
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
        width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, border: "none", cursor: "pointer", color,
      }}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

/* Símbolo "Ci" — la C con figura humana que forma la i */
function CredetiSymbol({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cgL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A00C8"/>
          <stop offset="100%" stopColor="#215DFF"/>
        </linearGradient>
      </defs>
      <path d="M72 18C62 10 42 8 26 18C12 27 8 42 12 56C16 70 30 80 48 82C58 83 68 80 76 74" stroke="url(#cgL)" strokeWidth="14" strokeLinecap="round" fill="none"/>
      <circle cx="80" cy="18" r="9" fill="#19D7D7"/>
      <rect x="62" y="46" width="26" height="11" rx="5.5" fill="#19D7D7"/>
    </svg>
  );
}

/* Marca credeti con wordmark serif (eco del logo). */
function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <CredetiSymbol size={32} />
      <span className="font-display" style={{ fontWeight: 700, fontSize: 19, color: "var(--text-primary)" }}>
        crede<span style={{ color: "var(--brand-gold)" }}>ti</span>
      </span>
    </div>
  );
}

type NavItem = { icon: React.ReactNode; label: string; path: string };

const clientNav: NavItem[] = [
  { icon: <IconHome size={22} />,      label: "Inicio",      path: "/"           },
  { icon: <IconSolicitar size={22} />, label: "Solicitar",   path: "/solicitar"  },
  { icon: <IconMiCredito size={22} />, label: "Mi Crédito",  path: "/mi-credito" },
  { icon: <IconPerfil size={22} />,    label: "Perfil",      path: "/perfil"     },
];

const adminNav: NavItem[] = [
  { icon: <IconPanel size={22} />,   label: "Panel",       path: "/admin"             },
  { icon: <IconBandeja size={22} />, label: "Solicitudes", path: "/admin/solicitudes" },
  { icon: <IconCartera size={22} />, label: "Cartera",     path: "/admin/cartera"     },
  { icon: <IconAlerta size={22} />,  label: "Morosos",     path: "/admin/morosos"     },
  { icon: <IconEquipo size={22} />,  label: "Contenido",   path: "/admin/centro"      },
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
    admin:     { label: "Admin",   bg: "var(--surface-3)", color: "var(--text-secondary)" },
    executive: { label: "Asesor",  bg: "rgba(33,93,255,0.10)", color: "#1d4ed8" },
    client:    { label: "Cliente", bg: "var(--surface-3)", color: "var(--text-secondary)" },
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

function checkAccess(location: string, t: string | null, r: string | null): "ok" | "login" | string {
  const publicPaths = ["/", "/inicio", "/login", "/registro", "/privacidad", "/terminos", "/faq", "/calculadora"];
  if (!t) return publicPaths.includes(location) ? "ok" : "login";
  // El panel admin sigue protegido: solo admins entran a /admin.
  if (location.startsWith("/admin") && r !== "admin") return r === "executive" ? "/dashboard" : "/mi-credito";
  // El dashboard de ejecutivo solo para executives (un admin puede verlo también).
  if ((location.startsWith("/dashboard") || location === "/executive") && r !== "executive" && r !== "admin") return "/mi-credito";
  // La vista de cliente (/solicitar, /mi-credito, /perfil) queda ABIERTA para
  // admins y ejecutivos también — pueden solicitar crédito y vivir el flujo.
  return "ok";
}

export function Layout({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();

  // Auth is derived from BOTH the legacy localStorage token (demo mode + admin
  // master-code login) AND the live Clerk session. The Clerk session is the
  // reason a brand-new user who just signed up is authenticated even before
  // ClerkCacheInvalidator has finished writing credeti_token to localStorage.
  // Deriving from useUser() (reactive) is what stops the "me regresa al login"
  // bounce right after registering.
  const tokenLS = localStorage.getItem("credeti_token");
  const roleLS  = localStorage.getItem("credeti_role");
  const clerkRole = (clerkUser?.publicMetadata?.role as string | undefined) ?? undefined;
  const token = tokenLS ?? (isSignedIn ? "clerk-session" : null);
  const role  = roleLS ?? clerkRole ?? (isSignedIn ? "client" : null);
  const user  = (() => { try { return JSON.parse(localStorage.getItem("credeti_user") || "{}"); } catch { return {}; } })();

  const publicPaths = ["/", "/login", "/registro", "/privacidad", "/terminos", "/faq", "/calculadora"];
  const isPublicPath = publicPaths.includes(location) || location.startsWith("/sign-in") || location.startsWith("/sign-up");

  // On a protected route with no token yet: if Clerk is still booting OR the
  // user IS signed in (token sync in flight), show a loader instead of bouncing
  // them to /login. Once Clerk settles this re-renders with the right auth.
  if (!token && !isPublicPath && (!clerkLoaded || isSignedIn)) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(150deg,#06143B 0%,#0A2E8A 50%,#215DFF 100%)",
        color: "rgba(255,255,255,0.75)", fontFamily: "Montserrat, Inter, sans-serif", fontSize: 14 }}>
        Cargando tu cuenta…
      </div>
    );
  }

  const access = checkAccess(location, token, role);
  if (access === "login") { navigate("/login"); return null; }
  if (access !== "ok") { navigate(access); return null; }

  const isAdmin = location.startsWith("/admin");
  const isExec  = location.startsWith("/dashboard") || location.startsWith("/executive");
  const isStaff = isAdmin || isExec;
  const navItems = isAdmin ? adminNav : isExec ? execNav : clientNav;

  useEffect(() => {
    if (!clerkLoaded) return; // wait for Clerk before making routing decisions
    const t = token;
    const r = role;
    const isPublic = isPublicPath;
    if (!t) { if (!isPublic) navigate("/login"); return; }
    // Panel admin sigue protegido: solo admins.
    if (location.startsWith("/admin"))     { if (r !== "admin")     { navigate(r === "executive" ? "/dashboard" : "/mi-credito"); return; } }
    // Dashboard de ejecutivo: executives (y admins pueden verlo).
    if (location.startsWith("/dashboard") || location === "/executive") { if (r !== "executive" && r !== "admin") { navigate("/mi-credito"); return; } }
    // La vista cliente (/solicitar, /mi-credito, /perfil) queda ABIERTA para
    // admin y ejecutivo — ya NO se rebota; pueden vivir el flujo del acreditado.
  }, [location, clerkLoaded, token, role]);

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
    <div className="sticky top-0 z-30 shrink-0 mobile-header" style={{ background: "linear-gradient(135deg, var(--brand-blue-deep) 0%, var(--brand-blue) 110%)" }}>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"></path></svg>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Atras</span>
        </button>

        <div className="flex items-center gap-2">
          {!title && <RoleBadge role={role} />}
          <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>
            {title ?? <>crede<span style={{ color: "var(--brand-gold)" }}>ti</span></>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (<>
            <a href="/admin/reportes" style={{ color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center" }} title="Reportes">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <path d="M3 9h18M9 21V9"></path>
              </svg>
            </a>
            <a href="/admin/configuracion" style={{ color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center" }} title="Configuración">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </a>
          </>)}
          {isAdmin && (
            <Link href="/mi-credito" style={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }} title="Ver como cliente">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
          )}
          <Link href="/inicio" style={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }} title="Ver inicio">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </Link>
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
  const ClientHeader = () => {
    const { data: av } = useMyAvatar();
    const myName = (() => { try { return JSON.parse(localStorage.getItem("credeti_user") ?? "{}").fullName ?? ""; } catch { return ""; } })();
    const initials = myName.trim().split(/\s+/).slice(0,2).map((w:string)=>w[0]?.toUpperCase()??"").join("");
    return (
    <div className="sticky top-0 z-30 shrink-0 mobile-header" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <header className="flex items-center justify-between px-4" style={{ height: 58 }}>
        <BrandMark />

        <div className="flex items-center gap-2">
          {token && (
            <button onClick={() => navigate("/perfil")} style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "none", padding: 0, cursor: "pointer", background: av?.url ? "var(--surface-3)" : "var(--brand-blue-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title="Mi perfil">
              {av?.url
                ? <img src={av.url} alt={myName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{initials || "?"}</span>}
            </button>
          )}
          {role && <RoleBadge role={role} />}
          <ThemeToggle tone="dark" />
          {token ? (
            <button onClick={handleLogout} style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Salir
            </button>
          ) : (
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-blue)", textDecoration: "none", padding: "6px 14px", border: "1.5px solid var(--border-mid)", borderRadius: 100 }}>
              Iniciar sesión
            </a>
          )}
        </div>
      </header>
    </div>
    );
  };

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

  // ── Sidebar de escritorio (módulo tipo Stripe). Solo visible >= 900px vía CSS ──
  const DesktopSidebar = () => (
    <aside className="desktop-sidebar">
      <div style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <CredetiSymbol size={30} />
        <span className="font-display" style={{ fontWeight: 700, fontSize: 19, color: "#fff" }}>
          crede<span style={{ color: "var(--brand-gold)" }}>ti</span>
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 14 }}>
        {navItems.map(item => {
          const active = isActive(item.path, location);
          return (
            <Link key={item.path} href={item.path} className={`dsb-item${active ? " active" : ""}`}>
              <span className="dsb-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
        <Link href="/inicio" className="dsb-item" style={{ margin: 0 }}>
          <span className="dsb-icon">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </span>
          <span>Ver inicio</span>
        </Link>
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/"; }}
          className="dsb-item"
          style={{ width: "auto", background: "rgba(255,255,255,0.04)", border: "none", margin: 0 }}
        >
          <span className="dsb-icon">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bg-warm)" }}>
      {isStaff && <DesktopSidebar />}
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

      <main className="app-main-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {isStaff && (
          <div className="desktop-topbar">
            <span className="desktop-topbar-title">{title ?? (isAdmin ? "Panel de administración" : "Panel de asesor")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ThemeToggle tone="dark" />
              <RoleBadge role={role} />
            </div>
          </div>
        )}
        <div className="app-main-content">
          {children}
        </div>
      </main>

      <ReportButton />

      {/* ── Bottom Navigation ── */}
      <nav className="mobile-bottom-nav" style={{
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
