import { Layout } from "@/components/layout/Layout";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SkeletonCard, SkeletonHero } from "@/components/hapi/Skeleton";
import {
  IconAlerta, IconMoneda, IconDesembolso, IconGrupo, IconFlecha,
  IconValidar, IconBandeja, IconCartera, IconFinanzas, IconCaja,
  IconMedalla, IconArbol, IconEquipo,
} from "@/components/hapi/HapiIcons";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const ACCESOS = [
  { path: "/admin/validar-pagos", icon: <IconValidar size={20} />,  label: "Validar pagos",         sub: "Pagos pendientes de aprobacion",        iconBg: "#fef3c7", iconColor: "#92400e" },
  { path: "/admin/solicitudes",   icon: <IconBandeja size={20} />,  label: "Solicitudes",            sub: "Afiliaciones y creditos pendientes",     iconBg: "#dbeafe", iconColor: "#1e40af" },
  { path: "/admin/cartera",       icon: <IconCartera size={20} />,  label: "Cartera detallada",      sub: "Saldos, fechas y pagos por cliente",     iconBg: "#e0e7ff", iconColor: "#3730a3" },
  { path: "/admin/morosos",       icon: <IconAlerta size={20} />,   label: "Morosos y multas",       sub: "Clientes en atraso, $200/dia multa",     iconBg: "#fee2e2", iconColor: "#991b1b" },
  { path: "/admin/financiero",    icon: <IconFinanzas size={20} />, label: "Analisis financiero",    sub: "Utilidad, flujo de caja, proyecciones",  iconBg: "#d1fae5", iconColor: "#065f46" },
  { path: "/admin/asesores",      icon: <IconMedalla size={20} />,  label: "Ranking de asesores",    sub: "Colocacion, cobranza y desempeno",       iconBg: "#f3e8ff", iconColor: "#6d28d9" },
  { path: "/admin/caja",          icon: <IconCaja size={20} />,     label: "Control de caja",        sub: "Cobros, desembolsos y diferencias",      iconBg: "#fef9c3", iconColor: "#854d0e" },
  { path: "/admin/arbol",         icon: <IconArbol size={20} />,    label: "Mi Red de Asesores",     sub: "Mapa de arbol interactivo",              iconBg: "#e0f2fe", iconColor: "#0369a1" },
  { path: "/admin/codigos",       icon: <IconEquipo size={20} />,   label: "Codigos de invitacion",  sub: "Genera y comparte codigos de registro",  iconBg: "#fdf4ff", iconColor: "#7c3aed" },
];

function dot(color: string) {
  return (
    <span
      className="pulse-dot"
      style={{
        display: "inline-block", width: 6, height: 6,
        borderRadius: "50%", background: color, marginRight: 5, flexShrink: 0,
      }}
    />
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard({ query: {} });
  const d = data as any;

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["pending-validation"],
    queryFn: () => fetch(`${API}/payments/pending-validation`, { headers: auth() }).then(r => r.json()),
  });

  const collectPct  = d ? Math.min(100, (d.collectionToday / Math.max(1, d.expectedToday)) * 100) : 0;
  const moraPct     = d ? (d.delinquencyRate ?? 0) : 0;
  const pendingCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24 }}>

        {/* ── Hero ── */}
        {isLoading ? (
          <div style={{ margin: "12px 16px 0" }}><SkeletonHero /></div>
        ) : (
          <div style={{ margin: "12px 16px 0" }}>
            <div
              className="anim-section anim-d1"
              style={{
                borderRadius: 22, padding: "20px",
                background: "linear-gradient(140deg,#080f1f 0%,#142246 50%,#1a3059 100%)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", top: -40, right: -40, width: 180, height: 180,
                  borderRadius: "50%", background: "rgba(232,69,69,0.06)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Cartera activa
              </div>
              <div style={{ color: "#fff", fontSize: 36, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 16 }} className="fade-up">
                {fmt(d?.totalPortfolio ?? 0)}
              </div>

              {/* Client health pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Al corriente", count: d?.clientsCurrent ?? d?.activeClients ?? 0, color: "#34d399" },
                  { label: "En riesgo",    count: d?.clientsAtRisk ?? 0,  color: "#fbbf24" },
                  { label: "En mora",      count: d?.clientsOverdue ?? 0, color: "#f97316" },
                  { label: "Vencidos",     count: d?.clientsDefaulted ?? 0, color: "#f87171" },
                ].map(s => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "4px 10px", borderRadius: 20,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {dot(s.color)}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                      {s.count} {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Daily collection bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Cobranza del dia</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
                    {fmt(d?.collectionToday ?? 0)} / {fmt(d?.expectedToday ?? 0)}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%", borderRadius: 4,
                      width: `${collectPct}%`,
                      background: collectPct >= 80 ? "#34d399" : collectPct >= 50 ? "#fbbf24" : "#f87171",
                      transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                  {collectPct.toFixed(0)}% de meta diaria
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pending validation alert ── */}
        {pendingCount > 0 && (
          <div style={{ margin: "0 16px" }} className="anim-section anim-d2">
            <Link href="/admin/validar-pagos">
              <div
                className="pressable"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 16,
                  background: "#fffbeb",
                  border: "1.5px solid #fcd34d",
                  boxShadow: "0 2px 12px rgba(245,158,11,0.15)",
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: "#f59e0b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
                  }}
                >
                  <IconValidar size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#78350f" }}>
                    {pendingCount} pago{pendingCount !== 1 ? "s" : ""} por validar
                  </div>
                  <div style={{ fontSize: 12, color: "#92400e", marginTop: 1 }}>
                    Requieren tu aprobacion antes de aplicarse
                  </div>
                </div>
                <IconFlecha size={16} color="#ca8a04" />
              </div>
            </Link>
          </div>
        )}

        {/* ── Stat cards ── */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }} className="anim-section anim-d3">
              {[
                {
                  icon: <IconAlerta size={18} />, iconBg: "#fee2e2", iconColor: "#dc2626",
                  label: "Indice de mora", value: `${moraPct.toFixed(1)}%`,
                  sub: `${(d?.clientsOverdue ?? 0) + (d?.clientsDefaulted ?? 0)} clientes`,
                },
                {
                  icon: <IconMoneda size={18} />, iconBg: "#d1fae5", iconColor: "#059669",
                  label: "Utilidad semanal", value: fmt(d?.profitThisWeek ?? 0),
                  sub: "Esta semana",
                },
                {
                  icon: <IconDesembolso size={18} />, iconBg: "#dbeafe", iconColor: "#2563eb",
                  label: "Colocacion mes", value: fmt(d?.placementThisMonth ?? 0),
                  sub: `Semana: ${fmt(d?.placementThisWeek ?? 0)}`,
                },
                {
                  icon: <IconGrupo size={18} />, iconBg: "#ede9fe", iconColor: "#7c3aed",
                  label: "Asesores activos", value: d?.totalActiveExecutives ?? 0,
                  sub: `${d?.executivesWithAlerts ?? 0} con alertas`,
                },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: "#fff", borderRadius: 16, padding: "16px",
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

            {/* Cash flow card */}
            <div style={{ margin: "0 16px" }} className="anim-section anim-d4">
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                  <IconFinanzas size={16} color="var(--accent)" />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                    Flujo de efectivo
                  </span>
                </div>
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Cobranza semana",     value: fmt(d?.collectionWeek ?? 0),   positive: true  },
                    { label: "Desembolsos semana",   value: fmt(d?.disbursementsWeek ?? 0), positive: false },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.positive ? "#059669" : "#dc2626" }}>
                        {row.positive ? "+" : "−"}{row.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Flujo neto</span>
                    <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.04em", color: (d?.netFlowWeek ?? 0) >= 0 ? "#059669" : "#dc2626" }}>
                      {fmt(d?.netFlowWeek ?? 0)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px dashed var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Multas acumuladas</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{fmt(d?.totalLateFees ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Quick access ── */}
        <div style={{ padding: "4px 16px 0" }} className="anim-section anim-d5">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
            Control y gestion
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACCESOS.map(a => (
              <Link key={a.path} href={a.path}>
                <div
                  className="pressable"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 16,
                    background: "#fff",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div
                    style={{
                      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: a.iconBg, color: a.iconColor,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{a.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{a.sub}</div>
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
