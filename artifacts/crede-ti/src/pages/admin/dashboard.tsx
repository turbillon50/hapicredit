import { Layout } from "@/components/layout/Layout";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SkeletonCard, SkeletonHero } from "@/components/hapi/Skeleton";
import {
  IconAlerta, IconMoneda, IconDesembolso, IconGrupo, IconFlecha,
  IconValidar, IconBandeja, IconCartera, IconFinanzas, IconCaja,
  IconMedalla, IconArbol, IconEquipo, IconCheck,
} from "@/components/hapi/HapiIcons";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdminDashboardData {
  totalPortfolio: number;
  clientsCurrent: number;
  activeClients: number;
  clientsAtRisk: number;
  clientsOverdue: number;
  clientsDefaulted: number;
  collectionToday: number;
  expectedToday: number;
  delinquencyRate: number;
  profitThisWeek: number;
  placementThisMonth: number;
  placementThisWeek: number;
  totalActiveExecutives: number;
  executivesWithAlerts: number;
  collectionWeek: number;
  disbursementsWeek: number;
  netFlowWeek: number;
  totalLateFees: number;
}

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);

const ACCESOS = [
  { path: "/admin/validar-pagos", icon: <IconValidar size={20} />,  label: "Validar pagos",         sub: "Pagos pendientes de aprobación",        iconBg: "#fef3c7", iconColor: "#92400e" },
  { path: "/admin/solicitudes",   icon: <IconBandeja size={20} />,  label: "Solicitudes",            sub: "Afiliaciones y créditos pendientes",     iconBg: "#dbeafe", iconColor: "#1e40af" },
  { path: "/admin/cartera",       icon: <IconCartera size={20} />,  label: "Cartera detallada",      sub: "Saldos, fechas y pagos por cliente",     iconBg: "#e0e7ff", iconColor: "#3730a3" },
  { path: "/admin/morosos",       icon: <IconAlerta size={20} />,   label: "Morosos y multas",       sub: "Clientes en atraso, 10% del pago atrasado", iconBg: "#fee2e2", iconColor: "#991b1b" },
  { path: "/admin/financiero",    icon: <IconFinanzas size={20} />, label: "Análisis financiero",    sub: "Utilidad, flujo de caja, proyecciones",  iconBg: "#d1fae5", iconColor: "#065f46" },
  { path: "/admin/asesores",      icon: <IconMedalla size={20} />,  label: "Ranking de asesores",    sub: "Colocación, cobranza y desempeño",       iconBg: "#f3e8ff", iconColor: "#6d28d9" },
  { path: "/admin/caja",          icon: <IconCaja size={20} />,     label: "Control de caja",        sub: "Cobros, desembolsos y diferencias",      iconBg: "#fef9c3", iconColor: "#854d0e" },
  { path: "/admin/arbol",         icon: <IconArbol size={20} />,    label: "Mi Red de Asesores",     sub: "Mapa de árbol interactivo",              iconBg: "#e0f2fe", iconColor: "#0369a1" },
  { path: "/admin/codigos",       icon: <IconEquipo size={20} />,   label: "Códigos de invitación",  sub: "Genera y comparte códigos de registro",  iconBg: "#fdf4ff", iconColor: "#7c3aed" },
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
  const { data, isLoading } = useGetAdminDashboard();
  const d = data as AdminDashboardData | undefined;

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["pending-validation"],
    queryFn: async () => {
      const r = await fetch(`${API}/payments/pending-validation`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar pagos pendientes");
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: pendingCreditsRaw = [] } = useQuery({
    queryKey: ["credits-pending-dashboard"],
    queryFn: async () => {
      const [pending, needsInfo] = await Promise.all([
        fetch(`${API}/credits?status=pending`,    { headers: auth() }).then(r => r.json()),
        fetch(`${API}/credits?status=needs_info`, { headers: auth() }).then(r => r.json()),
      ]);
      return [...(Array.isArray(pending) ? pending : []), ...(Array.isArray(needsInfo) ? needsInfo : [])];
    },
    staleTime: 30_000,
  });
  const pendingCreditsCount = Array.isArray(pendingCreditsRaw) ? pendingCreditsRaw.length : 0;
  const needsInfoCount = Array.isArray(pendingCreditsRaw) ? (pendingCreditsRaw as any[]).filter((c: any) => c.status === "needs_info").length : 0;
  const pendingAmount = Array.isArray(pendingCreditsRaw) ? (pendingCreditsRaw as any[]).reduce((s: number, c: any) => s + (parseFloat(c.amount) || 0), 0) : 0;

  const { data: collectionTrend = [] } = useQuery({
    queryKey: ["collection-trend"],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/collection-trend`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar tendencia");
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: agingData = [] } = useQuery({
    queryKey: ["portfolio-aging"],
    queryFn: async () => {
      const r = await fetch(`${API}/dashboard/portfolio-aging`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar antigüedad");
      return r.json();
    },
    staleTime: 60_000,
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
                background: "linear-gradient(140deg,#06143B 0%,#215DFF 50%,#19D7D7 100%)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute", top: -40, right: -40, width: 180, height: 180,
                  borderRadius: "50%", background: "rgba(14,104,204,0.06)",
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
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Cobranza del día</span>
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
        <div style={{ margin: "0 16px" }} className="anim-section anim-d2">
          {pendingCount > 0 ? (
            <Link href="/admin/validar-pagos">
              <div
                className="pressable"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 16,
                  background: "var(--warning-bg)",
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
                    Requieren tu aprobación antes de aplicarse
                  </div>
                </div>
                <IconFlecha size={16} color="#ca8a04" />
              </div>
            </Link>
          ) : (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 16,
                background: "var(--success-bg)",
                border: "1.5px solid #86efac",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCheck size={18} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Todo al día</div>
                <div style={{ fontSize: 11, color: "#166534", marginTop: 1 }}>Sin pagos pendientes de validar</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Pending credits approval alert ── */}
        {pendingCreditsCount > 0 && (
          <div style={{ margin: "0 16px" }} className="anim-section anim-d2">
            <Link href="/admin/solicitudes">
              <div
                className="pressable"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 16,
                  background: "#eff6ff",
                  border: "1.5px solid #93c5fd",
                  boxShadow: "0 2px 12px rgba(37,99,235,0.12)",
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: "#215DFF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(33,93,255,0.35)",
                    position: "relative",
                  }}
                >
                  <IconBandeja size={22} color="#fff" />
                  {needsInfoCount > 0 && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      background: "#f59e0b", color: "#fff",
                      fontSize: 9, fontWeight: 800, width: 16, height: 16,
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1.5px solid #fff",
                    }}>{needsInfoCount}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a" }}>
                    {pendingCreditsCount} crédito{pendingCreditsCount !== 1 ? "s" : ""} por aprobar — {fmt(pendingAmount)}
                  </div>
                  <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 1 }}>
                    {needsInfoCount > 0 ? `${needsInfoCount} esperando información del cliente` : "Pendientes de tu decisión"}
                  </div>
                </div>
                <IconFlecha size={16} color="#2563eb" />
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
                  label: "Índice de mora", value: `${moraPct.toFixed(1)}%`,
                  sub: `${(d?.clientsOverdue ?? 0) + (d?.clientsDefaulted ?? 0)} clientes`,
                },
                {
                  icon: <IconMoneda size={18} />, iconBg: "#d1fae5", iconColor: "#059669",
                  label: "Utilidad semanal", value: fmt(d?.profitThisWeek ?? 0),
                  sub: "Esta semana",
                },
                {
                  icon: <IconDesembolso size={18} />, iconBg: "#dbeafe", iconColor: "#2563eb",
                  label: "Colocación mes", value: fmt(d?.placementThisMonth ?? 0),
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

            {/* Cash flow card */}
            <div style={{ margin: "0 16px" }} className="anim-section anim-d4">
              <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
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

        {/* ── Collection Trend Chart ── */}
        {Array.isArray(collectionTrend) && collectionTrend.length > 0 && (
          <div style={{ margin: "0 16px" }} className="anim-section anim-d5">
            <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <IconFinanzas size={16} color="var(--accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                  Tendencia de cobranza — 8 semanas
                </span>
              </div>
              <div style={{ padding: "16px 4px 8px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={collectionTrend} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#215DFF" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#215DFF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#19D7D7" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#19D7D7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 9, fill: "#9ca3af", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(val: number, name: string) => [
                        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(val),
                        name === "collected" ? "Cobrado" : "Meta",
                      ]}
                    />
                    <Area type="monotone" dataKey="expected" stroke="#19D7D7" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gradExpected)" dot={false} />
                    <Area type="monotone" dataKey="collected" stroke="#215DFF" strokeWidth={2} fill="url(#gradCollected)" dot={{ r: 3, fill: "#215DFF", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, paddingTop: 4 }}>
                  {[
                    { color: "#215DFF", label: "Cobrado" },
                    { color: "#19D7D7", label: "Meta", dashed: true },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 20, height: 2, background: l.color, borderRadius: 1, borderTop: l.dashed ? "2px dashed currentColor" : undefined }} />
                      <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Portfolio Aging Chart ── */}
        {Array.isArray(agingData) && agingData.length > 0 && (
          <div style={{ margin: "0 16px" }} className="anim-section anim-d5">
            <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <IconCartera size={16} color="var(--accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                  Cartera por antigüedad
                </span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                {(agingData as { bucket: string; clientCount: number; totalAmount: number; percentage: number }[]).map((row, i) => {
                  const palette = [
                    { bar: "#34d399", bg: "#d1fae5", text: "#065f46" },
                    { bar: "#fbbf24", bg: "#fef3c7", text: "#92400e" },
                    { bar: "#f97316", bg: "#ffedd5", text: "#7c2d12" },
                    { bar: "#f87171", bg: "#fee2e2", text: "#991b1b" },
                  ];
                  const c = palette[Math.min(i, palette.length - 1)];
                  const total = (agingData as any[]).reduce((s: number, r: any) => s + r.clientCount, 0) || 1;
                  const pct = Math.round((row.clientCount / total) * 100);
                  return (
                    <div key={row.bucket} style={{ marginBottom: i < agingData.length - 1 ? 14 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c.bar, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{row.bucket}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.text }}>
                            {row.clientCount} clientes
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#111827", minWidth: 40, textAlign: "right" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%", borderRadius: 4, width: `${pct}%`,
                            background: c.bar,
                            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                          }}
                        />
                      </div>
                      <div style={{ textAlign: "right", fontSize: 10, color: "#9ca3af", marginTop: 3 }}>
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(row.totalAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Quick access ── */}
        <div style={{ padding: "4px 16px 0" }} className="anim-section anim-d6">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
            Control y gestión
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACCESOS.map(a => (
              <Link key={a.path} href={a.path}>
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

        {/* ── Network at a glance — total tree under this admin ── */}
        <div style={{ padding: "8px 16px 0" }} className="anim-section anim-d6">
          <div style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, #3A00C8, #215DFF)",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position:"absolute",top:-60,right:-60,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,168,47,0.20) 0%,transparent 70%)",pointerEvents:"none" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#19D7D7", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Mi red</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>
              Control completo de tu operación
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[
                { label: "Asesores", value: d?.totalActiveExecutives ?? 0 },
                { label: "Clientes",   value: d?.activeClients          ?? 0 },
                { label: "Alertas",    value: d?.executivesWithAlerts   ?? 0 },
              ].map(s => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12, padding: "10px 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 4, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Link href="/admin/arbol">
                <div className="pressable" style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                  Ver árbol completo →
                </div>
              </Link>
              <Link href="/admin/codigos">
                <div className="pressable" style={{ padding: "10px 12px", borderRadius: 12, background: "#19D7D7", color: "#0A2E8A", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                  Invitar al equipo
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Empresa: configuración y vistazo rápido ── */}
        <div style={{ padding: "8px 16px 0" }} className="anim-section anim-d7">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
            Empresa
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Cartera activa",  value: fmt(d?.totalPortfolio ?? 0),       sub: "Saldo total",       color: "#215DFF" },
              { label: "Cobrado semana",  value: fmt(d?.collectionWeek ?? 0),       sub: "Ingresos",          color: "#16a34a" },
              { label: "Desembolso sem",  value: fmt(d?.disbursementsWeek ?? 0),    sub: "Egresos",           color: "#d97706" },
              { label: "Flujo neto sem",  value: fmt(d?.netFlowWeek ?? 0),          sub: "Balance",           color: "#7c3aed" },
              { label: "Multas mora",     value: fmt(d?.totalLateFees ?? 0),        sub: "10% por cuota",     color: "#dc2626" },
              { label: "% Morosidad",     value: `${(d?.delinquencyRate ?? 0).toFixed(1)}%`, sub: "Cartera vencida", color: "#ea580c" },
            ].map(k => (
              <div key={k.label} style={{
                background: "var(--surface)", borderRadius: 14, padding: "12px 14px",
                border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
