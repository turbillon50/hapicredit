import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BottomSheet } from "@/components/hapi/BottomSheet";
import { Avatar } from "@/components/hapi/Avatar";
import {
  RiDashboardLine, RiFileListLine, RiAlarmWarningLine,
  RiGroupLine, RiLineChartLine, RiUserLine,
  RiMoneyDollarCircleLine, RiBankCardLine,
  RiLockLine, RiSwapLine, RiLogoutBoxLine,
  RiAddCircleLine, RiFolderOpenLine, RiInboxLine, RiCoinLine,
} from "react-icons/ri";

type NavItem = { icon: React.ReactNode; label: string; path: string };

const adminNav: NavItem[] = [
  { icon: <RiDashboardLine />,         label: "Resumen",      path: "/admin"               },
  { icon: <RiFileListLine />,          label: "Cartera",      path: "/admin/cartera"       },
  { icon: <RiInboxLine />,             label: "Solicitudes",  path: "/admin/solicitudes"   },
  { icon: <RiAlarmWarningLine />,      label: "Morosos",      path: "/admin/morosos"       },
  { icon: <RiLineChartLine />,         label: "Financiero",   path: "/admin/financiero"    },
];

// Desktop-only extra nav items for admin
const adminNavExtra: NavItem[] = [
  { icon: <RiGroupLine />,             label: "Asesores",     path: "/admin/asesores"      },
];

const execNav: NavItem[] = [
  { icon: <RiDashboardLine />,         label: "Mi Panel",   path: "/dashboard"              },
  { icon: <RiUserLine />,              label: "Clientes",   path: "/dashboard/clientes"     },
  { icon: <RiMoneyDollarCircleLine />, label: "Cobrar",     path: "/dashboard/cobrar"       },
  { icon: <RiCoinLine />,              label: "Comisiones", path: "/dashboard/comisiones"   },
];

const clientNav: NavItem[] = [
  { icon: <RiBankCardLine />,          label: "Mi Crédito",  path: "/portal"              },
  { icon: <RiAddCircleLine />,         label: "Solicitar",   path: "/portal/solicitar"    },
  { icon: <RiFolderOpenLine />,        label: "Expediente",  path: "/portal/expediente"   },
];

const DEMO_OPTIONS = [
  { key: "admin",      label: "Administrador",    sub: "Acceso total al sistema",    color: "#1a3a6b" },
  { key: "ejecutivo1", label: "Asesor 1 — Carlos",  sub: "Ejecutivo de campo",       color: "#065f46" },
  { key: "ejecutivo2", label: "Asesor 2 — Daniela", sub: "Ejecutivo de campo",       color: "#7c3aed" },
];

function useNavItems(role: string | undefined): NavItem[] {
  if (role === "admin")     return adminNav;
  if (role === "executive") return execNav;
  return clientNav;
}

function useSidebarNavItems(role: string | undefined): NavItem[] {
  if (role === "admin") return [...adminNav, ...adminNavExtra];
  return useNavItems(role);
}

function isActive(path: string, current: string) {
  if (path === "/admin" && current === "/admin") return true;
  if (path === "/dashboard" && current === "/dashboard") return true;
  if (path !== "/admin" && path !== "/dashboard") return current.startsWith(path);
  return false;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, demoLogin, logout } = useAuth();
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const navItems = useNavItems(user?.role);
  const sidebarItems = useSidebarNavItems(user?.role);

  const roleLabel: Record<string, string> = {
    admin:     "Administrador",
    executive: "Asesor",
    client:    "Cliente",
  };

  return (
    <div className="flex h-full" style={{ background: "var(--surface-2)" }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full w-[260px] z-30"
        style={{ background: "var(--navy-900)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="text-white font-bold text-xl tracking-tight">HapiCredit</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Sistema de gestión
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            {roleLabel[user?.role ?? ""] ?? "Menú"}
          </div>
          {sidebarItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item mb-1 ${isActive(item.path, location) ? "active" : ""}`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar name={user?.fullName ?? "U"} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {roleLabel[user?.role ?? ""] ?? ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="nav-item w-full mb-1"
          >
            <RiSwapLine className="text-lg" />
            Cambiar rol
          </button>
          <button onClick={logout} className="nav-item w-full" style={{ color: "rgba(239,68,68,0.8)" }}>
            <RiLogoutBoxLine className="text-lg" />
            Salir
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--navy-900)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <div className="text-white font-bold text-base tracking-tight leading-none">HapiCredit</div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {user?.fullName ?? ""}
          </div>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center pressable"
          style={{ background: "rgba(255,255,255,0.1)" }}
          aria-label="Cambiar rol"
        >
          <RiLockLine className="text-white text-base" />
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-[260px] overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="md:p-8 min-h-full">
          {children}
        </div>
      </main>

      {/* ── Mobile BottomNav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex pb-safe"
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(15,31,61,0.08)",
          boxShadow: "0 -2px 16px rgba(15,31,61,0.08)",
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path, location);
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 pressable relative"
            >
              <span
                className="text-[22px] transition-colors"
                style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] transition-colors"
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Role Switcher Sheet ── */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Cambiar acceso demo">
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el rol con el que quieres navegar.
        </p>
        <div className="flex flex-col gap-3">
          {DEMO_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={async () => {
                setSheetOpen(false);
                await demoLogin(opt.key);
              }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 pressable text-left w-full"
              style={{
                background: user?.username === opt.key.replace("ejecutivo", "ejecutivo") ? "#f0f9ff" : "#f8fafc",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: opt.color }}
              >
                {opt.label[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={async () => { setSheetOpen(false); await logout(); }}
          className="flex items-center gap-3 w-full mt-4 p-4 rounded-2xl pressable text-left"
          style={{ background: "#fff5f5" }}
        >
          <RiLogoutBoxLine className="text-red-500 text-xl" />
          <span className="text-sm font-medium text-red-600">Cerrar sesión</span>
        </button>
      </BottomSheet>
    </div>
  );
}
