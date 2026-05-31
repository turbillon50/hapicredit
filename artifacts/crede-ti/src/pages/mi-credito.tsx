import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Badge } from "@/components/hapi/Badge";
import { SkeletonHero } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  IconTarjeta, IconCalendario, IconCheck, IconReloj,
  IconAlerta, IconFlecha, IconMas, IconWhatsapp,
} from "@/components/hapi/HapiIcons";
import { Link } from "wouter";

interface Credit {
  id: number;
  status: "active" | "pending" | "rejected" | "closed";
  amount: number;
  termWeeks: number;
  weeklyPayment: number;
  remainingBalance: number;
  nextPaymentDate: string | null;
  notes?: string;
}

interface Payment {
  id: number;
  paymentStatus?: string;
  status?: string;
  amountPaid?: string;
  amount?: string;
  paymentDate?: string;
}

interface ClientProfile {
  id: number;
  fullName: string;
}

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "\u2014";
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt.getTime())) return "\u2014";
  return dt.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
};

const daysDiff = (d: string | null | undefined) => {
  if (!d) return null;
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
};

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  active:   { label: "Activo",      variant: "success" },
  pending:  { label: "En revision", variant: "warning" },
  rejected: { label: "Rechazado",   variant: "danger"  },
  closed:   { label: "Liquidado",   variant: "info"    },
};

function CreditCard({ credit, paid, total, pct, clientName }: {
  credit: Credit; paid: number; total: number; pct: number; clientName: string;
}) {
  const radius = 44;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;

  return (
    <div
      style={{
        borderRadius: 24, padding: "24px 22px",
        background: "linear-gradient(140deg,#15206E 0%,#2A3CD6 50%,#3F51E6 100%)",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(8,15,31,0.35)",
      }}
    >
      {/* Shine overlay */}
      <div className="credit-card-shine" />

      {/* Decorative circles */}
      <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(14,104,204,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -60, left: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.02)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>
            Crédito activo
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            #{credit.id} · {clientName}
          </div>
        </div>
        <Badge variant="success" size="sm">Activo</Badge>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        {/* Balance + weekly */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Saldo pendiente
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.06em", lineHeight: 1 }}>
            {fmt(credit.remainingBalance)}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Pago semanal: <strong style={{ color: "rgba(255,255,255,0.65)" }}>{fmt(credit.weeklyPayment)}</strong>
          </div>
        </div>

        {/* Circular progress ring */}
        <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
          <svg width={92} height={92} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }}
            />
          </svg>
          <div
            style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>{Math.round(pct)}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>pagado</div>
          </div>
        </div>
      </div>

      {/* Payments mini indicator */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{paid} de {total} pagos completados</span>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: Math.min(total, 13) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 5, height: 5, borderRadius: 2,
                background: i < paid
                  ? "#34d399"
                  : i === paid
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
          {total > 13 && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: "5px" }}>+{total - 13}</span>}
        </div>
      </div>
    </div>
  );
}

export default function MiCredito() {
  useRequireAuth(["client"]);

  const { data: client, isLoading } = useQuery<ClientProfile | null>({
    queryKey: ["me-client"],
    queryFn: async () => {
      const r = await fetch(`${API}/me/client`, { headers: auth() });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Error al cargar tu perfil");
      return r.json() as Promise<ClientProfile>;
    },
  });

  const { data: credits = [] } = useQuery<Credit[]>({
    queryKey: ["client-credits", client?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/credits?clientId=${client!.id}`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar creditos");
      return r.json() as Promise<Credit[]>;
    },
    enabled: !!client?.id,
  });

  const activeCredit   = credits.find(c => c.status === "active");
  const pendingCredits = credits.filter(c => c.status === "pending");
  const historicCredits = credits.filter(c => c.status === "closed" || c.status === "rejected");

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["client-payments", activeCredit?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/payments?creditId=${activeCredit!.id}`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar pagos");
      return r.json() as Promise<Payment[]>;
    },
    enabled: !!activeCredit?.id,
  });

  const paid  = payments.filter(p => ["on_time","completed","late","partial","approved","validated"].includes(p.paymentStatus ?? p.status ?? "")).length;
  const total = activeCredit?.termWeeks ?? 0;
  const pct   = total > 0 ? (paid / total) * 100 : 0;
  const nextDays = daysDiff(activeCredit?.nextPaymentDate);

  const isEmpty = !isLoading && !activeCredit && pendingCredits.length === 0 && credits.length === 0;

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

        {isLoading ? (
          <div style={{ padding: "16px 16px 0" }}><SkeletonHero /></div>
        ) : isEmpty ? (
          <div style={{ padding: "48px 16px 0" }}>
            <EmptyState
              icon={<IconTarjeta size={24} />}
              title="Sin créditos registrados"
              description="Aún no tienes un crédito con nosotros. Solicita uno para empezar."
            />
            <Link href="/solicitar">
              <button
                className="pressable"
                style={{
                  width: "100%", marginTop: 24, padding: "16px",
                  borderRadius: 16, border: "none", cursor: "pointer",
                  background: "var(--accent)", color: "#fff",
                  fontWeight: 700, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Solicitar crédito <IconFlecha size={16} color="#fff" />
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* ── Credit card hero ── */}
            {activeCredit && (
              <div style={{ padding: "16px 16px 0" }} className="anim-section anim-d1">
                <CreditCard
                  credit={activeCredit}
                  paid={paid}
                  total={total}
                  pct={pct}
                  clientName={client?.fullName ?? ""}
                />
              </div>
            )}

            {/* ── Next payment alert ── */}
            {activeCredit && nextDays !== null && (
              <div style={{ padding: "0 16px" }} className="anim-section anim-d2">
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 16,
                    background: nextDays <= 1 ? "#fff0f0" : nextDays <= 3 ? "#fffbeb" : "#f0fdf4",
                    border: `1.5px solid ${nextDays <= 1 ? "#fca5a5" : nextDays <= 3 ? "#fcd34d" : "#86efac"}`,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>
                    {nextDays <= 1
                      ? <IconAlerta size={22} color="#ef4444" />
                      : nextDays <= 3
                        ? <IconReloj size={22} color="#eab308" />
                        : <IconCalendario size={22} color="#22c55e" />
                    }
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      {nextDays < 0
                        ? `Pago vencido hace ${Math.abs(nextDays)} día${Math.abs(nextDays) !== 1 ? "s" : ""}`
                        : nextDays === 0
                          ? "Pago vence hoy"
                          : `Próximo pago en ${nextDays} día${nextDays !== 1 ? "s" : ""}`}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                      {fmtDate(activeCredit.nextPaymentDate)} · {fmt(activeCredit.weeklyPayment)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Quick action ── */}
            {activeCredit && (
              <div style={{ padding: "0 16px" }} className="anim-section anim-d3">
                <Link href="/solicitar">
                  <div
                    className="pressable"
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", borderRadius: 16,
                      background: "#fff",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--coral-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconMas size={18} color="var(--coral)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Solicitar renovación</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Aplica para un nuevo crédito</div>
                    </div>
                    <IconFlecha size={16} color="var(--text-muted)" />
                  </div>
                </Link>
              </div>
            )}

            {/* ── Pending requests ── */}
            {pendingCredits.length > 0 && (
              <div style={{ padding: "0 16px" }} className="anim-section anim-d4">
                {/* Top banner */}
                <div style={{
                  background: "linear-gradient(135deg, #fefce8, #fef9c3)",
                  border: "1.5px solid #fcd34d", borderRadius: 16,
                  padding: "16px 18px", marginBottom: 12,
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid #fcd34d" }}>
                    <IconReloj size={18} color="#ca8a04" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Solicitud en revisión</div>
                    <div style={{ fontSize: 12, color: "#a16207", marginTop: 2, lineHeight: 1.5 }}>
                      Tu solicitud fue recibida y está siendo evaluada. Te notificaremos cuando haya una resolución.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingCredits.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 16px", borderRadius: 16,
                        background: "#fff", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{fmt(c.amount)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Crédito #{c.id} · {c.termWeeks} semanas</div>
                      </div>
                      <Badge variant="warning" size="sm">En revisión</Badge>
                    </div>
                  ))}
                </div>

                <a
                  href="https://wa.me/529984292748"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: 12, padding: "12px 16px", borderRadius: 14,
                    background: "#25d366", color: "#fff",
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                  }}
                >
                  <IconWhatsapp size={16} color="#fff" /> Consultar estado con soporte
                </a>
              </div>
            )}

            {/* ── Credit history ── */}
            {historicCredits.length > 0 && (
              <div style={{ padding: "0 16px" }} className="anim-section anim-d5">
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Historial de créditos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {historicCredits.map((c) => {
                    const st = STATUS_MAP[c.status] ?? { label: c.status, variant: "info" as const };
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: "#fff", borderRadius: 16, padding: "16px",
                          border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Crédito #{c.id}</div>
                          <Badge variant={st.variant} size="sm">{st.label}</Badge>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                          {[
                            { label: "Monto",   value: fmt(c.amount) },
                            { label: "Plazo",   value: `${c.termWeeks} sem` },
                            { label: "Semanal", value: fmt(c.weeklyPayment) },
                          ].map(cell => (
                            <div key={cell.label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 4px" }}>
                              <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{cell.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>
                        {c.status === "rejected" && c.notes && (
                          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff1f2", borderRadius: 10, border: "1px solid #fecdd3" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#9f1239", textTransform: "uppercase", marginBottom: 3 }}>Motivo de rechazo</div>
                            <div style={{ fontSize: 12, color: "#be123c" }}>{c.notes}</div>
                          </div>
                        )}
                        {c.status === "rejected" && (
                          <a
                            href="https://wa.me/529984292748"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              marginTop: 10, fontSize: 12, color: "#25d366", fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <IconWhatsapp size={13} color="#25d366" /> ¿Dudas? Contacta a soporte
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recent payments ── */}
            {payments.length > 0 && (
              <div style={{ padding: "0 16px" }} className="anim-section anim-d6">
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Últimos pagos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {payments.slice(-5).reverse().map((p) => {
                    const st       = p.paymentStatus ?? p.status ?? "";
                    const isPaid   = ["on_time","completed","late","partial","approved","validated"].includes(st);
                    const isPending = st === "pending_validation";
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px", borderRadius: 14,
                          background: "#fff", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)",
                        }}
                      >
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isPaid ? "#d1fae5" : isPending ? "#fef9c3" : "var(--surface-3)",
                            color: isPaid ? "#059669" : isPending ? "#ca8a04" : "var(--text-muted)",
                          }}
                        >
                          {isPaid ? <IconCheck size={16} /> : <IconReloj size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {fmt(parseFloat(p.amountPaid ?? p.amount ?? "0"))}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                            {p.paymentDate
                              ? new Date(p.paymentDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
                              : "\u2014"}
                          </div>
                        </div>
                        <Badge
                          variant={isPaid ? "success" : isPending ? "warning" : "info"}
                          size="sm"
                        >
                          {isPaid ? "Pagado" : isPending ? "En validación" : "Pendiente"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
