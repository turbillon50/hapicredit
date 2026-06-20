import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetExecutiveDashboard } from "@workspace/api-client-react";
import { SkeletonHero, SkeletonCard } from "@/components/hapi/Skeleton";
import { Badge } from "@/components/hapi/Badge";
import { Link } from "wouter";
import {
  IconGrupo, IconAlerta, IconMoneda, IconCalendario,
  IconFlecha, IconPersona, IconMas, IconFinanzas, IconBandeja,
} from "@/components/hapi/HapiIcons";

interface ExecDashboardData {
  totalCollectedToday: number;
  totalExpectedToday: number;
  commissionThisMonth: number;
  commissionAllTime: number;
  totalAssignedClients: number;
  clientsOverdue: number;
  placementThisMonth: number;
  clientsDueToday: number;
  collectionThisMonth: number;
  targetMonth: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const today = () =>
  new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

const mesActual = () =>
  new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetExecutiveDashboard();
  const d = data as ExecDashboardData | undefined;

  const firstName  = user?.fullName?.split(" ")[0] ?? "Asesor";
  const collectPct = d
    ? Math.min(100, (d.totalCollectedToday / Math.max(1, d.totalExpectedToday)) * 100)
    : 0;
  const monthPct = d && d.targetMonth > 0
    ? Math.min(100, (d.collectionThisMonth / d.targetMonth) * 100)
    : 0;

  const barColor = (pct: number) =>
    pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24 }}>

        {/* ── Hero ── */}
        {isLoading ? (
          <div style={{ margin: "12px 16px 0" }}><SkeletonHero /></div>
        ) : (
          <div style={{ margin: "12px 16px 0" }} className="anim-section anim-d1">
            <div
              style={{
                borderRadius: 22, padding: "20px",
                background: "linear-gradient(150deg,#06143B 0%,#0A2E8A 50%,#215DFF 100%)",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* decorative blob */}
              <div
                style={{
                  position: "absolute", top: -30, right: -30, width: 160, height: 160,
                  borderRadius: "50%", background: "rgba(147,197,253,0.05)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize", letterSpacing: "0.02em", marginBottom: 6 }}>
                {today()}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Hola, {firstName}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20, marginTop: 2 }}>
                Resumen del día
              </div>

              {/* Daily collection */}
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                      Cobrado hoy
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>
                      {fmt(d?.totalCollectedToday ?? 0)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                      Esperado
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.03em" }}>
                      {fmt(d?.totalExpectedToday ?? 0)}
                    </div>
                  </div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%", borderRadius: 4, width: `${collectPct}%`,
                      background: barColor(collectPct),
                      transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: 5, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                  {collectPct.toFixed(0)}% de la meta diaria
                </div>
              </div>

              {/* Commission */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  borderRadius: 16, padding: "14px 16px",
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.15)",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconMoneda size={20} color="#a7f3d0" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#a7f3d0", marginBottom: 2 }}>
                    Tu comisión — {mesActual()}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {fmt(d?.commissionThisMonth ?? 0)}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(167,243,208,0.7)", marginTop: 2 }}>
                    Total acumulado: {fmt(d?.commissionAllTime ?? 0)}
                  </div>
                </div>
                <Link href="/dashboard/comisiones">
                  <div className="pressable" style={{ color: "rgba(167,243,208,0.6)", display: "flex" }}>
                    <IconFlecha size={18} color="currentColor" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat grid ── */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }} className="anim-section anim-d2">
            {[
              { icon: <IconGrupo size={18} />,    iconBg: "rgba(33,93,255,0.10)", iconColor: "var(--brand-blue)", label: "Clientes asignados", value: d?.totalAssignedClients ?? 0, sub: "Total en cartera" },
              { icon: <IconAlerta size={18} />,   iconBg: "var(--surface-3)", iconColor: "#B91C1C", label: "En mora",            value: d?.clientsOverdue ?? 0,       sub: "Requieren visita" },
              { icon: <IconFinanzas size={18} />, iconBg: "var(--surface-3)", iconColor: "#059669", label: "Colocación mes",     value: fmt(d?.placementThisMonth ?? 0), sub: "Monto colocado" },
              { icon: <IconCalendario size={18} />, iconBg: "var(--surface-3)", iconColor: "#d97706", label: "Cobros hoy",       value: d?.clientsDueToday ?? 0,       sub: "Clientes por cobrar" },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: "var(--surface)", borderRadius: 16, padding: "16px",
                  border: "1px solid var(--border)", boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: s.iconBg, color: s.iconColor, marginBottom: 10 }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Monthly target ── */}
        {!isLoading && (d?.targetMonth ?? 0) > 0 && (
          <div style={{ margin: "0 16px" }} className="anim-section anim-d3">
            <div style={{ background: "var(--surface)", borderRadius: 18, padding: "16px 18px", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 3 }}>
                    Meta de cobro mensual
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                    {fmt(d?.collectionThisMonth ?? 0)}{" "}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>/ {fmt(d?.targetMonth ?? 0)}</span>
                  </div>
                </div>
                <Badge variant={monthPct >= 80 ? "success" : monthPct >= 50 ? "warning" : "danger"} size="md">
                  {monthPct.toFixed(0)}%
                </Badge>
              </div>
              <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", borderRadius: 4, width: `${monthPct}%`,
                    background: barColor(monthPct),
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div style={{ padding: "4px 16px 0" }} className="anim-section anim-d4">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
            Acciones rápidas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { href: "/dashboard/clientes",     icon: <IconPersona size={18} />, iconBg: "rgba(33,93,255,0.10)",  iconColor: "var(--brand-blue)", title: "Mis clientes",    sub: `${d?.totalAssignedClients ?? 0} clientes en cartera` },
              { href: "/dashboard/cobrar",        icon: <IconMoneda size={18} />,  iconBg: "var(--surface-3)",  iconColor: "var(--text-secondary)", title: "Registrar cobro", sub: "Registrar pago de un cliente" },
              { href: "/dashboard/alta-cliente",  icon: <IconMas size={18} />,     iconBg: "var(--surface-3)",  iconColor: "var(--text-secondary)", title: "Alta de cliente", sub: "Registrar nuevo cliente y crédito" },
              { href: "/dashboard/comisiones",    icon: <IconMoneda size={18} />,  iconBg: "var(--surface-3)",  iconColor: "#0B7A53", title: "Mis comisiones",  sub: `Este mes: ${fmt(d?.commissionThisMonth ?? 0)}` },
              { href: "/dashboard/codigos",       icon: <IconBandeja size={18} />, iconBg: "var(--surface-3)",  iconColor: "var(--text-secondary)", title: "Mis códigos",     sub: "Invitar nuevos clientes" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div
                  className="pressable"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 16,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: item.iconBg, color: item.iconColor }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <IconFlecha size={16} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
