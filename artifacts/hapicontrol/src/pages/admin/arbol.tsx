import { useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

type ClientNode = {
  id: number;
  fullName: string;
  phone: string;
  status: string;
  creditAmount: number;
  remainingBalance: number;
  weeklyPayment: number;
  termWeeks: number;
  paidWeeks: number;
  daysOverdue: number;
};

type ExecNode = {
  id: number;
  fullName: string;
  clients: ClientNode[];
  totalCartera: number;
  totalCobrado: number;
  clientCount: number;
};

const STATUS_MAP: Record<string, { color: string; bg: string; label: string; border: string }> = {
  current:   { color: "#065f46", bg: "#d1fae5", label: "Al corriente",    border: "#34d399" },
  at_risk:   { color: "#92400e", bg: "#fef3c7", label: "En riesgo",       border: "#fbbf24" },
  overdue:   { color: "#991b1b", bg: "#fee2e2", label: "En atraso",       border: "#f87171" },
  defaulted: { color: "#1e1e1e", bg: "#374151", label: "Cartera vencida", border: "#6b7280" },
};

function getStatusInfo(s: string) {
  return STATUS_MAP[s] || STATUS_MAP.current;
}

function semaphoreColor(s: string) {
  if (s === "current") return "#22c55e";
  if (s === "at_risk") return "#eab308";
  if (s === "overdue") return "#ef4444";
  return "#374151";
}

export default function AdminArbol() {
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.65 });
  const [expandedExec, setExpandedExec] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientNode | null>(null);

  const pinchRef = useRef({ startDist: 0, startScale: 1 });
  const panRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isPanning: false });

  const { data: execsRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["tree-executives"],
    queryFn: () => fetch(`${API}/dashboard/executive-ranking`, { headers: auth() }).then(r => r.json()),
  });

  const { data: allClients = [] } = useQuery<any[]>({
    queryKey: ["tree-clients"],
    queryFn: () => fetch(`${API}/clients`, { headers: auth() }).then(r => r.json()),
  });

  const { data: allCredits = [] } = useQuery<any[]>({
    queryKey: ["tree-credits"],
    queryFn: () => fetch(`${API}/credits`, { headers: auth() }).then(r => r.json()),
  });

  const executives: ExecNode[] = execsRaw.map((e: any) => {
    const myClients = allClients.filter((c: any) => c.executiveId === e.executiveId);
    const clientNodes: ClientNode[] = myClients.map((c: any) => {
      const credit = allCredits.find((cr: any) => cr.clientId === c.id && cr.status === "active");
      const now = new Date();
      let daysOverdue = 0;
      if (credit && (c.status === "overdue" || c.status === "defaulted" || c.status === "at_risk")) {
        const lastPayNum = credit.currentPaymentNumber || 0;
        const nextPayDate = new Date(credit.disbursementDate);
        nextPayDate.setDate(nextPayDate.getDate() + ((lastPayNum + 1) * 7));
        daysOverdue = Math.max(0, Math.floor((now.getTime() - nextPayDate.getTime()) / 86400000));
      }
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        status: c.status,
        creditAmount: credit ? parseFloat(credit.amount) : 0,
        remainingBalance: credit ? parseFloat(credit.remainingBalance) : 0,
        weeklyPayment: credit ? parseFloat(credit.weeklyPayment) : 0,
        termWeeks: credit?.termWeeks ?? 0,
        paidWeeks: credit?.currentPaymentNumber ?? 0,
        daysOverdue,
      };
    });
    return {
      id: e.executiveId,
      fullName: e.executiveName,
      clients: clientNodes,
      totalCartera: clientNodes.reduce((s, c) => s + c.remainingBalance, 0),
      totalCobrado: clientNodes.reduce((s, c) => s + (c.creditAmount - c.remainingBalance), 0),
      clientCount: clientNodes.length,
    };
  });

  const totalClients = executives.reduce((s, e) => s + e.clientCount, 0);
  const totalCartera = executives.reduce((s, e) => s + e.totalCartera, 0);

  const dist = (t1: Touch, t2: Touch) =>
    Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);

  const handleTouchStart = useCallback((ev: React.TouchEvent) => {
    if (ev.touches.length === 2) {
      pinchRef.current.startDist = dist(ev.touches[0], ev.touches[1]);
      pinchRef.current.startScale = transform.scale;
    } else if (ev.touches.length === 1) {
      panRef.current.startX = ev.touches[0].clientX - transform.x;
      panRef.current.startY = ev.touches[0].clientY - transform.y;
      panRef.current.isPanning = true;
    }
  }, [transform]);

  const handleTouchMove = useCallback((ev: React.TouchEvent) => {
    if (ev.touches.length === 2) {
      const d = dist(ev.touches[0], ev.touches[1]);
      const newScale = Math.max(0.3, Math.min(3, pinchRef.current.startScale * (d / pinchRef.current.startDist)));
      setTransform(t => ({ ...t, scale: newScale }));
    } else if (ev.touches.length === 1 && panRef.current.isPanning) {
      setTransform(t => ({
        ...t,
        x: ev.touches[0].clientX - panRef.current.startX,
        y: ev.touches[0].clientY - panRef.current.startY,
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    panRef.current.isPanning = false;
  }, []);

  const handleWheel = useCallback((ev: React.WheelEvent) => {
    ev.preventDefault();
    const delta = ev.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(3, t.scale * delta)) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 0.65 });

  if (isLoading) return <Layout><div className="p-4"><SkeletonList /></div></Layout>;

  return (
    <Layout>
      <div style={{ position: "relative", width: "100%", height: "calc(100dvh - 56px - 60px)", overflow: "hidden", background: "#0f172a" }}>
        <div
          style={{
            position: "absolute", top: 12, left: 12, right: 12, zIndex: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Red de Asesores</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
              {executives.length} asesores / {totalClients} acreditados / {fmt(totalCartera)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.3) }))}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: 18, fontWeight: 700 }}
            >+</button>
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale * 0.7) }))}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: 18, fontWeight: 700 }}
            >-</button>
            <button
              onClick={resetView}
              style={{ height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: 11, padding: "0 10px", fontWeight: 600 }}
            >Reset</button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 8, left: 12, zIndex: 10, display: "flex", gap: 12 }}>
          {[
            { c: "#22c55e", l: "Al corriente" },
            { c: "#eab308", l: "En riesgo" },
            { c: "#ef4444", l: "En atraso" },
            { c: "#374151", l: "Vencida" },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.c }} />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>{s.l}</span>
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ width: "100%", height: "100%", touchAction: "none" }}
        >
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: 70,
            }}
          >
            <div
              style={{
                width: 120, height: 50, borderRadius: 12,
                background: "linear-gradient(135deg, #1a2e5e, #2d4a8a)",
                border: "2px solid rgba(255,255,255,0.15)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>ADMIN</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 8 }}>Grupo CAFJA</div>
            </div>

            <div style={{ width: 2, height: 20, background: "rgba(255,255,255,0.15)" }} />

            <div style={{ width: Math.max(280, executives.length * 140), height: 2, background: "rgba(255,255,255,0.15)" }} />

            <div style={{ display: "flex", gap: 10, marginTop: 0 }}>
              {executives.map((exec) => {
                const isOpen = expandedExec === exec.id;
                const morosCount = exec.clients.filter(c => c.status === "overdue" || c.status === "defaulted").length;
                return (
                  <div key={exec.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 2, height: 16, background: "rgba(255,255,255,0.15)" }} />
                    <button
                      onClick={() => setExpandedExec(isOpen ? null : exec.id)}
                      style={{
                        width: 130, minHeight: 70, borderRadius: 12, border: "none",
                        background: isOpen
                          ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                          : "linear-gradient(135deg, #1e293b, #334155)",
                        padding: "10px 8px", cursor: "pointer",
                        boxShadow: isOpen ? "0 4px 20px rgba(124,58,237,0.3)" : "0 2px 10px rgba(0,0,0,0.3)",
                        outline: isOpen ? "2px solid #a78bfa" : "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
                        {exec.fullName.split(" ").slice(0, 2).join(" ")}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, marginTop: 2 }}>
                        {exec.clientCount} acreditados
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
                        {exec.clients.map(c => (
                          <div
                            key={c.id}
                            style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: semaphoreColor(c.status),
                            }}
                          />
                        ))}
                      </div>
                      {morosCount > 0 && (
                        <div style={{
                          marginTop: 4, fontSize: 9, fontWeight: 700,
                          color: "#fca5a5", background: "rgba(239,68,68,0.15)",
                          borderRadius: 4, padding: "1px 6px", display: "inline-block",
                        }}>
                          {morosCount} en mora
                        </div>
                      )}
                    </button>

                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 0 }}>
                        <div style={{ width: 2, height: 12, background: "rgba(255,255,255,0.15)" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {exec.clients.map((client) => {
                            const si = getStatusInfo(client.status);
                            const pct = client.termWeeks > 0 ? Math.round((client.paidWeeks / client.termWeeks) * 100) : 0;
                            return (
                              <button
                                key={client.id}
                                onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                                style={{
                                  width: 160, borderRadius: 10, border: "none",
                                  background: "#1e293b",
                                  borderLeft: `4px solid ${si.border}`,
                                  padding: "8px 10px", cursor: "pointer", textAlign: "left",
                                  boxShadow: selectedClient?.id === client.id
                                    ? `0 0 0 2px ${si.border}, 0 4px 15px rgba(0,0,0,0.3)`
                                    : "0 2px 8px rgba(0,0,0,0.2)",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ color: "#fff", fontSize: 10, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                                    {client.fullName.split(" ").slice(0, 2).join(" ")}
                                  </div>
                                  <div style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: semaphoreColor(client.status),
                                    flexShrink: 0, marginTop: 2, marginLeft: 4,
                                  }} />
                                </div>

                                <div style={{
                                  fontSize: 8, fontWeight: 600, marginTop: 3,
                                  color: si.color, background: si.bg,
                                  borderRadius: 3, padding: "1px 5px", display: "inline-block",
                                }}>
                                  {si.label}
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                                  <div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 7 }}>Saldo</div>
                                    <div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{fmt(client.remainingBalance)}</div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 7 }}>Pago</div>
                                    <div style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{fmt(client.weeklyPayment)}/sem</div>
                                  </div>
                                </div>

                                <div style={{ marginTop: 4 }}>
                                  <div style={{
                                    width: "100%", height: 3, borderRadius: 2,
                                    background: "rgba(255,255,255,0.08)",
                                  }}>
                                    <div style={{
                                      width: `${pct}%`, height: "100%", borderRadius: 2,
                                      background: semaphoreColor(client.status),
                                      transition: "width 0.3s ease",
                                    }} />
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 7, marginTop: 1 }}>
                                    {client.paidWeeks}/{client.termWeeks} sem ({pct}%)
                                  </div>
                                </div>

                                {client.daysOverdue > 0 && (
                                  <div style={{
                                    marginTop: 3, fontSize: 8, fontWeight: 700,
                                    color: "#fca5a5",
                                  }}>
                                    {client.daysOverdue}d atraso / Multa: {fmt(client.daysOverdue * 200)}
                                  </div>
                                )}

                                {selectedClient?.id === client.id && (
                                  <div
                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/expediente/${client.id}`); }}
                                    style={{
                                      marginTop: 6, textAlign: "center",
                                      background: "var(--brand-red, #e53935)", color: "#fff",
                                      borderRadius: 6, padding: "5px 0", fontSize: 10, fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Ver expediente
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
