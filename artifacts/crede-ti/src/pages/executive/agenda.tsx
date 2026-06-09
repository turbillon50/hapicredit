import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { IconCheck, IconMoneda, IconReloj, IconAlerta } from "@/components/hapi/HapiIcons";
import { Link } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function getPaymentDay(disbursementDate: string): number {
  // Parse date as local date (not UTC) to avoid timezone shifts
  const [y, m, d] = disbursementDate.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function wasPaymentMadeThisWeek(payments: any[], creditId: number): boolean {
  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return payments.some(p =>
    p.creditId === creditId &&
    new Date(p.paymentDate) >= monday &&
    p.paymentStatus !== "rejected"
  );
}

export default function ExecAgenda() {
  const { user } = useAuth();
  const todayDow = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayDow);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["exec-clients", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/clients`, { headers: auth() });
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user?.id,
  });

  const { data: credits = [], isLoading: creditsLoading } = useQuery<any[]>({
    queryKey: ["exec-credits-agenda", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/credits?status=active`, { headers: auth() });
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ["exec-payments-week", user?.id],
    queryFn: async () => {
      const r = await fetch(`${API}/payments`, { headers: auth() });
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user?.id,
  });

  const isLoading = clientsLoading || creditsLoading;

  const clientMap = new Map<number, any>();
  (clients as any[]).forEach(c => clientMap.set(c.id, c));

  // Group active credits by payment day
  const byDay: Record<number, any[]> = {};
  (credits as any[]).forEach(credit => {
    if (!credit.disbursementDate) return;
    const dow = getPaymentDay(credit.disbursementDate);
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(credit);
  });

  const dayCredits = byDay[selectedDay] ?? [];

  const dayTotals = DAYS.map((_, dow) => {
    const cs = byDay[dow] ?? [];
    return {
      count: cs.length,
      total: cs.reduce((s: number, c: any) => s + parseFloat(c.weeklyPayment), 0),
      paid: cs.filter(c => wasPaymentMadeThisWeek(payments, c.id)).length,
    };
  });

  const totalSelected = dayCredits.reduce((s, c) => s + parseFloat(c.weeklyPayment), 0);
  const paidSelected = dayCredits.filter(c => wasPaymentMadeThisWeek(payments, c.id)).length;

  return (
    <Layout>
      <div className="pb-24">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">Agenda de cobros</h1>
          <p className="text-sm text-gray-400">Clientes por día de pago semanal</p>
        </div>

        {/* Day selector */}
        <div className="px-4 mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {DAYS_SHORT.map((d, dow) => {
              const info = dayTotals[dow];
              const isToday = dow === todayDow;
              const isSelected = dow === selectedDay;
              return (
                <button
                  key={dow}
                  onClick={() => setSelectedDay(dow)}
                  className="flex flex-col items-center rounded-2xl px-3 py-2.5 min-w-[56px] transition-all pressable shrink-0"
                  style={{
                    background: isSelected ? "var(--navy)" : isToday ? "#fff0f0" : "#f3f4f6",
                    border: isToday && !isSelected ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
                    {d}
                  </span>
                  <span className="text-lg font-black my-0.5" style={{ color: isSelected ? "#fff" : "#111" }}>
                    {info.count}
                  </span>
                  {info.count > 0 && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{
                      background: isSelected ? "rgba(255,255,255,0.15)" : "#e5e7eb",
                      color: isSelected ? "#fff" : "#6b7280",
                    }}>
                      {info.paid}/{info.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary bar */}
        {dayCredits.length > 0 && (
          <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "var(--navy)" }}>
            <div>
              <div className="text-xs text-white/60 font-semibold uppercase tracking-wide">{DAYS[selectedDay]}</div>
              <div className="text-base font-extrabold text-white mt-0.5">{fmt(totalSelected)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 font-semibold">Cobrados</div>
              <div className="text-base font-extrabold" style={{ color: paidSelected === dayCredits.length ? "#4ade80" : "#fb923c" }}>
                {paidSelected} / {dayCredits.length}
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="px-4 flex flex-col gap-2">
          {isLoading ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-400">Cargando cartera...</div>
          ) : dayCredits.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-sm font-semibold text-gray-700">Sin cobros los {DAYS[selectedDay].toLowerCase()}s</div>
              <div className="text-xs text-gray-400 mt-1">No hay créditos activos con día de pago en este día</div>
            </div>
          ) : (
            dayCredits.map(credit => {
              const client = clientMap.get(credit.clientId);
              const paid = wasPaymentMadeThisWeek(payments, credit.id);
              const weekLabel = `${credit.currentPaymentNumber + 1} de ${credit.termWeeks}`;
              const isLastPayment = credit.currentPaymentNumber + 1 >= credit.termWeeks;
              return (
                <Link key={credit.id} href={`/dashboard/expediente/${credit.clientId}`}>
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3 pressable"
                    style={{
                      background: paid ? "#f0fdf4" : "#fff",
                      border: paid ? "1.5px solid #86efac" : "1.5px solid #f3f4f6",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: paid ? "#d1fae5" : isLastPayment ? "#fff3cd" : "var(--surface-2)" }}
                    >
                      {paid
                        ? <IconCheck size={18} color="#22c55e" />
                        : isLastPayment
                          ? <IconMoneda size={18} color="#f59e0b" />
                          : <IconReloj size={18} color="#9ca3af" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {client?.fullName ?? `Cliente #${credit.clientId}`}
                        </span>
                        {isLastPayment && !paid && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">ULTIMO</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Semana {weekLabel} · {client?.phone ?? ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold" style={{ color: paid ? "#22c55e" : "var(--navy)" }}>
                        {fmt(parseFloat(credit.weeklyPayment))}
                      </div>
                      {paid && (
                        <div className="text-[10px] text-green-600 font-semibold">Cobrado</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Weekly total */}
        {!isLoading && (credits as any[]).length > 0 && (
          <div className="mx-4 mt-5 rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Resumen semanal</div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_SHORT.map((d, dow) => {
                const info = dayTotals[dow];
                const isToday = dow === todayDow;
                return (
                  <button
                    key={dow}
                    onClick={() => setSelectedDay(dow)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="text-[9px] font-bold text-gray-400 uppercase">{d}</div>
                    <div
                      className="w-full rounded-lg py-1.5 text-center"
                      style={{
                        background: dow === selectedDay ? "var(--navy)" : isToday ? "#fff0f0" : "#e5e7eb",
                        border: isToday && dow !== selectedDay ? "1px solid var(--accent)" : "none",
                      }}
                    >
                      <div className="text-[10px] font-black" style={{ color: dow === selectedDay ? "#fff" : "#374151" }}>
                        {info.count}
                      </div>
                    </div>
                    {info.count > 0 && (
                      <div className="text-[8px] text-gray-400 font-medium">{fmt(info.total).replace("$", "")}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
