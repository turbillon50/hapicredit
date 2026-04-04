import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { RiDashboardLine, RiTeamLine, RiMoneyDollarCircleLine, RiAlarmWarningLine, RiUserLine, RiBarChartBoxLine, RiSettings4Line, RiWallet3Line } from "react-icons/ri";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const isExecutive = user.role === "executive";
  const isAdmin = user.role === "admin";

  const executiveLinks = [
    { href: "/dashboard", label: "Dashboard", icon: RiDashboardLine },
    { href: "/clients", label: "Clients", icon: RiTeamLine },
    { href: "/payments/new", label: "Payment", icon: RiMoneyDollarCircleLine },
    { href: "/alerts", label: "Alerts", icon: RiAlarmWarningLine },
    { href: "/commitments", label: "Promises", icon: RiUserLine },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: RiDashboardLine },
    { href: "/admin/clients", label: "Clients", icon: RiTeamLine },
    { href: "/admin/executives", label: "Staff", icon: RiUserLine },
    { href: "/admin/caja", label: "Caja", icon: RiWallet3Line },
    { href: "/admin/reports", label: "Reports", icon: RiBarChartBoxLine },
  ];

  const links = isAdmin ? adminLinks : isExecutive ? executiveLinks : [];

  if (links.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <nav className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && location.startsWith(link.href));
          
          return (
            <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}`}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
