import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  RiHome4Line, RiHome4Fill,
  RiTeamLine, RiTeamFill,
  RiAlarmWarningLine, RiAlarmWarningFill,
  RiCalendarCheckLine, RiCalendarCheckFill,
  RiPieChart2Line, RiPieChart2Fill,
  RiUserSettingsLine, RiUserSettingsFill,
  RiMoneyDollarCircleLine, RiMoneyDollarCircleFill,
  RiLineChartLine, RiLineChartFill,
  RiFileWarningLine, RiFileWarningFill,
} from "react-icons/ri";

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  iconActive: React.ElementType;
};

const executiveLinks: NavLink[] = [
  { href: "/dashboard", label: "Inicio", icon: RiHome4Line, iconActive: RiHome4Fill },
  { href: "/clients", label: "Cartera", icon: RiTeamLine, iconActive: RiTeamFill },
  { href: "/payments/new", label: "Cobrar", icon: RiMoneyDollarCircleLine, iconActive: RiMoneyDollarCircleFill },
  { href: "/commitments", label: "Compromisos", icon: RiCalendarCheckLine, iconActive: RiCalendarCheckFill },
  { href: "/alerts", label: "Alertas", icon: RiAlarmWarningLine, iconActive: RiAlarmWarningFill },
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Resumen", icon: RiPieChart2Line, iconActive: RiPieChart2Fill },
  { href: "/admin/portfolio-detail", label: "Cartera", icon: RiTeamLine, iconActive: RiTeamFill },
  { href: "/admin/morosos", label: "Morosos", icon: RiFileWarningLine, iconActive: RiFileWarningFill },
  { href: "/admin/executives", label: "Asesores", icon: RiUserSettingsLine, iconActive: RiUserSettingsFill },
  { href: "/admin/financiero", label: "Financiero", icon: RiLineChartLine, iconActive: RiLineChartFill },
];

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const links =
    user.role === "admin" ? adminLinks :
    user.role === "executive" ? executiveLinks :
    [];

  if (links.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border pb-safe"
      style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -4px 16px rgba(15,25,50,0.07)" }}
    >
      <nav className="flex justify-around items-center h-[58px] max-w-lg mx-auto px-1">
        {links.map((link) => {
          const isActive =
            location === link.href ||
            (link.href !== "/dashboard" && link.href !== "/admin" && location.startsWith(link.href));
          const Icon = isActive ? link.iconActive : link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-[3px] flex-1 h-full relative transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full bg-primary" />
              )}
              <Icon className="w-[21px] h-[21px]" />
              <span className={`text-[9px] font-semibold leading-none tracking-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
