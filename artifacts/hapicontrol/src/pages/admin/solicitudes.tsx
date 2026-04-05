import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge } from "@/components/hapi/Badge";
import { EmptyState } from "@/components/hapi/EmptyState";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { BottomSheet } from "@/components/hapi/BottomSheet";
import {
  RiInboxLine, RiCheckLine, RiCloseLine, RiEyeLine,
  RiMoneyDollarCircleLine, RiCalendarLine, RiPhoneLine,
  RiFileTextLine, RiUserLine, RiLoader4Line, RiGroupLine,
  RiIdCardLine,
} from "react-icons/ri";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type PublicApp = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  createdAt: string;
};

type PendingCredit = {
  id: number;
  clientId: number;
  clientName: string | null;
  amount: number;
  termWeeks: number;
  weeklyPayment: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

function parseApp(app: PublicApp) {
  try {
    const data = JSON.parse(app.message);
    if (data.type === "credit_application") return data;
  } catch {}
  return null;
}

export default function AdminSolicitudes() {
  const [tab, setTab] = useState<"public" | "internal">("public");
  const [selected, setSelected] = useState<PublicApp | PendingCredit | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: publicApps = [], isLoading: loadingPublic } = useQuery<PublicApp[]>({
    queryKey: ["public-requests"],
    queryFn: () => fetch(`${API}/public/requests`, { headers: auth() }).then(r => r.json()),
  });

  const { data: pendingCredits = [], isLoading: loadingInternal } = useQuery<PendingCredit[]>({
    queryKey: ["credits", "pending"],
    queryFn: () =>
      fetch(`${API}/credits?status=pending`, { headers: auth() })
        .then(r => r.json())
        .then((rows: any[]) => rows.map(r => ({ ...r, clientName: r.clientName ?? `Cliente #${r.clientId}` }))),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      fetch(`${API}/credits/${id}/review`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      setSelected(null);
      setReviewing(null);
    },
  });

  const publicFiltered = (publicApps as PublicApp[]).filter(a => {
    try { const d = JSON.parse(a.message); return d.type === "credit_application"; } catch { return true; }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-4">

        <div className="px-4 pt-4 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {publicFiltered.length} públicas · {(pendingCredits as PendingCredit[]).length} internas pendientes
          </p>
        </div>

        <div className="px-4 flex gap-2">
          {[
            { key: "public",   label: `Afiliaciones (${publicFiltered.length})` },
            { key: "internal", label: `Internas (${(pendingCredits as PendingCredit[]).length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all pressable ${tab === t.key ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={tab === t.key ? { background: "var(--accent)" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4">
          {tab === "public" && (
            loadingPublic ? <SkeletonList count={4} /> :
            publicFiltered.length === 0 ? (
              <EmptyState icon={<RiInboxLine />} title="Sin solicitudes" description="Aún no hay afiliaciones recibidas." />
            ) : (
              <div className="flex flex-col gap-3">
                {publicFiltered.slice().reverse().map((app: PublicApp) => {
                  const parsed = parseApp(app);
                  const info = parsed?.personalInfo ?? {};
                  const credit = parsed?.creditRequest ?? {};
                  return (
                    <div
                      key={app.id}
                      className="card pressable"
                      onClick={() => { setSelected(app); setIsPublic(true); }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={app.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{app.name}</div>
                          <div className="text-xs text-gray-500">{app.phone}</div>
                        </div>
                        <Badge variant="warning" size="sm">Nueva</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Monto</div>
                          <div className="text-xs font-bold text-gray-800">{fmt(credit.requestedAmount)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Plazo</div>
                          <div className="text-xs font-bold text-gray-800">{credit.termWeeks ?? "—"} sem</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl py-2">
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Fecha</div>
                          <div className="text-xs font-bold text-gray-800">
                            {new Date(app.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === "internal" && (
            loadingInternal ? <SkeletonList count={3} /> :
            (pendingCredits as PendingCredit[]).length === 0 ? (
              <EmptyState icon={<RiFileTextLine />} title="Sin solicitudes internas" description="No hay créditos pendientes de aprobación." />
            ) : (
              <div className="flex flex-col gap-3">
                {(pendingCredits as PendingCredit[]).map((credit: PendingCredit) => (
                  <div
                    key={credit.id}
                    className="card pressable"
                    onClick={() => { setSelected(credit); setIsPublic(false); }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={credit.clientName ?? "C"} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{credit.clientName}</div>
                        <div className="text-xs text-gray-500">Crédito #{credit.id}</div>
                      </div>
                      <Badge variant="warning" size="sm">Pendiente</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Monto</div>
                        <div className="text-xs font-bold text-gray-800">{fmt(credit.amount)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Plazo</div>
                        <div className="text-xs font-bold text-gray-800">{credit.termWeeks} sem</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Semanal</div>
                        <div className="text-xs font-bold text-gray-800">{fmt(credit.weeklyPayment)}</div>
                      </div>
                    </div>
                    {credit.notes && (
                      <div className="mt-2 text-xs text-gray-500 italic truncate">"{credit.notes}"</div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={!!selected}
        onClose={() => { setSelected(null); setReviewing(null); }}
        title={isPublic ? "Solicitud de afiliación" : "Solicitud interna"}
      >
        {selected && isPublic && (() => {
          const app = selected as PublicApp;
          const parsed = parseApp(app);
          const info = parsed?.personalInfo ?? {};
          const gtor = parsed?.guarantor ?? {};
          const credit = parsed?.creditRequest ?? {};
          const docsMeta = parsed?.documents ?? {};
          const refNum = `HC-${String(app.id).padStart(5, "0")}`;
          return (
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar name={app.name} size="lg" />
                <div>
                  <div className="text-base font-bold text-gray-900">{app.name}</div>
                  <div className="text-sm text-gray-500">{app.phone}</div>
                  <div className="text-xs text-gray-400">Ref: <strong>{refNum}</strong> · {fmtDate(app.createdAt)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Monto solicitado</div>
                  <div className="text-lg font-extrabold text-blue-700">{fmt(credit.requestedAmount)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Plazo · Semanal</div>
                  <div className="text-base font-bold text-gray-800">
                    {credit.termWeeks} sem · {fmt((credit.requestedAmount * 1.10) / credit.termWeeks)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Datos personales</div>
                {[
                  [<RiUserLine />, "CURP", info.curp || "No proporcionado"],
                  [<RiMapPinLine />, "Domicilio", info.address],
                  [<RiPhoneLine />, "Tel. alt.", info.altPhone || "—"],
                  [<RiFileTextLine />, "Destino", credit.purpose],
                ].map(([icon, label, val]) => (
                  <div key={String(label)} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 mt-0.5 text-base">{icon}</span>
                    <span className="text-gray-500 shrink-0">{String(label)}:</span>
                    <span className="font-medium text-gray-800">{String(val)}</span>
                  </div>
                ))}
              </div>

              {gtor.name && (
                <div className="flex flex-col gap-1.5 bg-purple-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Aval</div>
                  <div className="text-sm font-semibold text-gray-800">{gtor.name}</div>
                  <div className="text-sm text-gray-500">{gtor.phone} · {gtor.relationship || "Sin especificar"}</div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Documentos cargados</div>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "ine_front", label: "INE frente" },
                    { key: "ine_back", label: "INE reverso" },
                    { key: "curp_doc", label: "CURP" },
                    { key: "domicilio", label: "Comprobante domicilio" },
                    { key: "ingresos", label: "Comprobante ingresos" },
                  ].map(d => (
                    <div key={d.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{d.label}</span>
                      {docsMeta[d.key]?.provided
                        ? <span className="text-green-600 font-semibold flex items-center gap-1"><RiCheckLine className="text-xs" /> Cargado</span>
                        : <span className="text-gray-400 text-xs">No enviado</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {docsMeta && Object.entries(docsMeta).some(([, v]: any) => v?.preview) && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Imágenes</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(docsMeta).map(([key, val]: any) =>
                      val?.preview ? (
                        <div key={key} className="rounded-xl overflow-hidden border border-gray-200">
                          <img src={val.preview} alt={key} className="w-full h-24 object-cover" />
                          <div className="text-[10px] text-center text-gray-500 py-1 bg-gray-50">{key.replace("_", " ")}</div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs text-gray-400 text-center mb-1">
                  Esta es una solicitud pública. Crea al cliente en el sistema para procesar el crédito.
                </div>
                <a
                  href={`tel:${app.phone}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 pressable"
                >
                  <RiPhoneLine /> Llamar a {info.fullName?.split(" ")[0] ?? app.name}
                </a>
              </div>
            </div>
          );
        })()}

        {selected && !isPublic && (() => {
          const credit = selected as PendingCredit;
          return (
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar name={credit.clientName ?? "C"} size="lg" />
                <div>
                  <div className="text-base font-bold text-gray-900">{credit.clientName}</div>
                  <div className="text-xs text-gray-400">Crédito #{credit.id} · {fmtDate(credit.createdAt)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Monto</div>
                  <div className="text-lg font-extrabold text-blue-700">{fmt(credit.amount)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Pago semanal</div>
                  <div className="text-base font-bold text-gray-800">{fmt(credit.weeklyPayment)}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                {[
                  ["Plazo", `${credit.termWeeks} semanas`],
                  ["Total a pagar", fmt(credit.amount * 1.10)],
                  ["Propósito", credit.notes ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => reviewMut.mutate({ id: credit.id, action: "approve" })}
                  disabled={reviewMut.isPending}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold pressable"
                  style={{ background: "#10b981" }}
                >
                  {reviewMut.isPending && reviewing === credit.id
                    ? <RiLoader4Line className="animate-spin" />
                    : <RiCheckLine />
                  }
                  Aprobar crédito
                </button>
                <button
                  onClick={() => reviewMut.mutate({ id: credit.id, action: "reject" })}
                  disabled={reviewMut.isPending}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold pressable border-2 border-red-200 text-red-600"
                >
                  <RiCloseLine /> Rechazar solicitud
                </button>
              </div>
            </div>
          );
        })()}
      </BottomSheet>
    </Layout>
  );
}
