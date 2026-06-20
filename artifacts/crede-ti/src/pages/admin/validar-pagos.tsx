import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge } from "@/components/hapi/Badge";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { BottomSheet } from "@/components/hapi/BottomSheet";
import {
  IconValidar, IconCheck, IconCerrar, IconLoader,
  IconMoneda, IconCalendario, IconAlerta,
  IconAlerta as IconWarning, IconPersona,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const fmt = (n: number | null | undefined) =>
  n == null ? "$0" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

type PendingPayment = {
  id: number;
  clientId: number;
  creditId: number;
  paymentNumber: number;
  paymentDate: string;
  amountPaid: number;
  amountExpected: number;
  lateFee: number | null;
  updatedBalance: number;
  paymentStatus: string;
  executiveId: number | null;
  clientName: string | null;
  executiveName: string | null;
  notes: string | null;
  createdAt: string;
};

export default function ValidarPagos() {
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<PendingPayment[]>({
    queryKey: ["pending-validation"],
    queryFn: () => fetch(`${API}/payments/pending-validation`, { headers: auth() }).then(r => {
      if (!r.ok) throw new Error("Error");
      return r.json();
    }),
  });

  const validateMut = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      fetch(`${API}/payments/${id}/validate`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then(r => {
        if (!r.ok) throw new Error("Error al validar");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-validation"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["portfolio-detail"] });
      setSelected(null);
    },
  });

  const totalPending = (payments as PendingPayment[]).reduce((s, p) => s + p.amountPaid, 0);

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Validar pagos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {(payments as PendingPayment[]).length} pago{(payments as PendingPayment[]).length !== 1 ? "s" : ""} pendiente{(payments as PendingPayment[]).length !== 1 ? "s" : ""} de validación
          </p>
        </div>

        {(payments as PendingPayment[]).length > 0 && (
          <div className="mx-4 rounded-2xl p-4" style={{ background: "var(--surface-3)", border: "2px solid #fbbf24" }}>
            <div className="flex items-center gap-3">
              <IconAlerta size={24} color="#a16207" />
              <div>
                <div className="text-sm font-bold text-yellow-900">
                  {fmt(totalPending)} por validar
                </div>
                <div className="text-xs text-yellow-700">
                  Estos pagos NO se reflejan en saldo hasta que los apruebes
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4">
          {isLoading ? (
            <SkeletonList count={4} />
          ) : (payments as PendingPayment[]).length === 0 ? (
            <EmptyState
              icon={<IconValidar size={18} />}
              title="Todo validado"
              description="No hay pagos pendientes de validación. Los ejecutivos no han registrado pagos nuevos."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {(payments as PendingPayment[]).map((p) => (
                <div
                  key={p.id}
                  className="card pressable"
                  onClick={() => setSelected(p)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={p.clientName ?? "C"} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{p.clientName ?? `Cliente #${p.clientId}`}</div>
                      <div className="text-xs text-gray-500">
                        Registrado por: {p.executiveName ?? "Sin ejecutivo"}
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">Por validar</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl py-2">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Monto</div>
                      <div className="text-sm font-bold text-gray-800">{fmt(p.amountPaid)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Pago #</div>
                      <div className="text-sm font-bold text-gray-800">{p.paymentNumber}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Fecha</div>
                      <div className="text-xs font-bold text-gray-800">
                        {fmtDate(p.paymentDate)}
                      </div>
                    </div>
                  </div>

                  {p.lateFee != null && p.lateFee > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-700">
                      <IconAlerta size={14} /> Incluye multa: {fmt(p.lateFee)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Validar pago"
      >
        {selected && (() => {
          const p = selected;
          return (
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar name={p.clientName ?? "C"} size="lg" />
                <div>
                  <div className="text-base font-bold text-gray-900">{p.clientName ?? `Cliente #${p.clientId}`}</div>
                  <div className="text-xs text-gray-400">
                    Pago #{p.paymentNumber} · Crédito #{p.creditId}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Monto pagado</div>
                  <div className="text-xl font-extrabold text-blue-700">{fmt(p.amountPaid)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Monto esperado</div>
                  <div className="text-lg font-bold text-gray-800">{fmt(p.amountExpected)}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha de pago</span>
                  <span className="font-medium text-gray-800">{fmtDate(p.paymentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ejecutivo</span>
                  <span className="font-medium text-gray-800">{p.executiveName ?? "—"}</span>
                </div>
                {p.lateFee != null && p.lateFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Multa por atraso</span>
                    <span className="font-bold text-orange-600">{fmt(p.lateFee)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo de pago</span>
                  <span className="font-medium text-gray-800">
                    {p.amountPaid >= p.amountExpected ? "Completo" : "Parcial"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saldo antes</span>
                  <span className="font-medium text-gray-800">{fmt(p.updatedBalance)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <div className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                  <IconAlerta size={14} /> Validación requerida
                </div>
                <div className="text-xs text-yellow-700 leading-relaxed">
                  Verifica que el depósito realmente llegó a la cuenta y que el monto es correcto antes de aprobar.
                  Solo después de aprobado se actualizará el saldo real del crédito.
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => validateMut.mutate({ id: p.id, action: "approve" })}
                  disabled={validateMut.isPending}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold pressable"
                  style={{ background: "#10b981" }}
                >
                  {validateMut.isPending
                    ? <IconLoader size={16} />
                    : <IconCheck size={16} />
                  }
                  Aprobar pago — Aplicar al saldo
                </button>
                <button
                  onClick={() => validateMut.mutate({ id: p.id, action: "reject" })}
                  disabled={validateMut.isPending}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold pressable border-2 border-red-200 text-red-600"
                >
                  <IconCerrar size={16} /> Rechazar pago
                </button>
              </div>
            </div>
          );
        })()}
      </BottomSheet>
    </Layout>
  );
}
