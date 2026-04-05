import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/hapi/Avatar";
import { Badge, statusBadge } from "@/components/hapi/Badge";
import { ProgressBar } from "@/components/hapi/ProgressBar";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  IconAtras, IconTelefono, IconUbicacion, IconPersona,
  IconCheck, IconReloj, IconDocumento, IconAlerta,
  IconMoneda, IconCalendario, IconImagen, IconOjo,
  IconCerrar,
} from "@/components/hapi/HapiIcons";
import { useState } from "react";
import { Link } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const fmt = (n: number | string | null | undefined) => {
  const v = parseFloat(String(n ?? "0"));
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
};
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function AdminExpediente() {
  const { id } = useParams<{ id: string }>();
  const [docPreview, setDocPreview] = useState<any | null>(null);

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ["client", id],
    queryFn: () => fetch(`${API}/clients/${id}`, { headers: auth() }).then(r => r.json()),
    enabled: !!id,
  });

  if (isLoading) return (
    <Layout>
      <div className="px-4 py-4"><SkeletonList count={5} /></div>
    </Layout>
  );

  if (!client) return (
    <Layout>
      <div className="px-4 py-6">
        <EmptyState icon={<IconPersona />} title="Cliente no encontrado" description="El expediente no existe." />
      </div>
    </Layout>
  );

  const credits = client.credits ?? [];
  const payments = client.recentPayments ?? client.payments ?? [];
  const allNotes: any[] = client.recentNotes ?? client.notes ?? [];
  const docNotes = allNotes.filter((n: any) => n.noteType === "document");
  const notes = allNotes.filter((n: any) => n.noteType !== "document");
  const commitments = client.openCommitments ?? client.commitments ?? [];
  const activeCredit = credits.find((c: any) => c.status === "active");
  const paid = payments.filter((p: any) => p.paymentStatus === "completed" || p.status === "completed").length;
  const total = activeCredit?.termWeeks ?? 0;
  const pct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-4 pb-6">

        <div className="px-4 pt-4 md:pt-0 flex items-center gap-3">
          <Link href="/admin/cartera">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center pressable">
              <IconAtras size={16} color="#4b5563" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expediente</h1>
            <p className="text-xs text-gray-400">Perfil completo del cliente</p>
          </div>
        </div>

        <div className="mx-4 card">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={client.fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900">{client.fullName}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={statusBadge(client.status).variant} size="sm">
                  {statusBadge(client.status).label}
                </Badge>
                {client.daysOverdue > 0 && (
                  <Badge variant="danger" size="sm">{client.daysOverdue} días de atraso</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <IconTelefono size={14} color="#9ca3af" />
                <a href={`tel:${client.phone}`} className="text-blue-600 font-medium">{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 text-sm">
                <IconUbicacion size={14} color="#9ca3af" className="mt-0.5 shrink-0" />
                <span className="text-gray-600">{client.address}</span>
              </div>
            )}
            {client.curp && (
              <div className="flex items-center gap-2 text-sm">
                <IconPersona size={14} color="#9ca3af" />
                <span className="text-gray-600 font-mono text-xs">{client.curp}</span>
              </div>
            )}
          </div>
        </div>

        {activeCredit && (
          <div className="mx-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">Crédito activo</div>
            <div className="hero-gradient rounded-2xl p-5 text-white">
              <div className="text-3xl font-bold mb-1">{fmt(activeCredit.amount)}</div>
              <div className="text-sm opacity-70 mb-4">Monto del crédito</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Saldo pendiente", fmt(activeCredit.remainingBalance)],
                  ["Pago semanal", fmt(activeCredit.weeklyPayment)],
                  ["Plazo", `${activeCredit.termWeeks} semanas`],
                  ["Próximo pago", fmtDate(activeCredit.nextPaymentDate)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/10 rounded-xl p-2.5">
                    <div className="text-[10px] opacity-60 font-semibold uppercase tracking-wide">{k}</div>
                    <div className="text-sm font-bold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <ProgressBar value={pct} animate height={8} />
              <div className="text-xs opacity-60 mt-1.5">{paid} de {total} pagos realizados</div>
            </div>
          </div>
        )}

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Historial de créditos ({credits.length})
          </div>
          <div className="flex flex-col gap-2">
            {credits.length === 0 ? (
              <EmptyState icon={<IconMoneda />} title="Sin creditos" description="Este cliente no tiene creditos registrados." />
            ) : credits.map((c: any) => {
              const sb = statusBadge(c.status);
              return (
                <div key={c.id} className="card flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{fmt(c.amount)}</div>
                    <div className="text-xs text-gray-500">{c.termWeeks} semanas · {fmtDate(c.startDate)}</div>
                  </div>
                  <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Pagos ({payments.length})
          </div>
          {payments.length === 0 ? (
            <EmptyState icon={<IconCalendario />} title="Sin pagos" description="No hay pagos registrados." />
          ) : (
            <div className="flex flex-col gap-2">
              {payments.slice().reverse().slice(0, 10).map((p: any) => {
                const done = p.status === "completed";
                return (
                  <div key={p.id} className="card flex items-center gap-3 py-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: done ? "#d1fae5" : "#fef3c7", color: done ? "#065f46" : "#92400e" }}
                    >
                      {done ? <IconCheck size={16} /> : <IconReloj size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{fmt(p.amountPaid)}</div>
                      <div className="text-xs text-gray-500">
                        {p.paymentDate ? fmtDate(p.paymentDate) : "Pendiente"}
                      </div>
                    </div>
                    <Badge variant={done ? "success" : "warning"} size="sm">
                      {done ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>
                );
              })}
              {payments.length > 10 && (
                <div className="text-xs text-center text-gray-400 py-1">
                  +{payments.length - 10} pagos adicionales
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentos del expediente */}
        {docNotes.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Documentos cargados ({docNotes.length})
            </div>
            <div className="grid grid-cols-2 gap-3">
              {docNotes.map((n: any) => {
                let parsed: any = null;
                try { parsed = JSON.parse(n.content); } catch {}
                if (!parsed) return null;
                const isImage = parsed.mimeType?.startsWith("image/");
                return (
                  <div
                    key={n.id}
                    className="card p-0 overflow-hidden cursor-pointer pressable"
                    onClick={() => isImage && setDocPreview(parsed)}
                  >
                    {isImage ? (
                      <img
                        src={`data:${parsed.mimeType};base64,${parsed.base64}`}
                        alt={parsed.label}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <IconDocumento size={28} color="#9ca3af" />
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <div className="text-xs font-semibold text-gray-800 truncate">{parsed.label}</div>
                      <div className="text-[10px] text-gray-400">
                        {n.authorName ?? "Cliente"} · {fmtDate(parsed.uploadedAt?.split("T")[0])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Notas ({notes.length})
            </div>
            <div className="flex flex-col gap-2">
              {notes.map((n: any) => (
                <div key={n.id} className="card py-3">
                  <div className="text-sm text-gray-700">{n.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtDate(n.createdAt?.split("T")[0])} · {n.authorName ?? "Sistema"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {commitments.length > 0 && (
          <div className="px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              Compromisos ({commitments.length})
            </div>
            <div className="flex flex-col gap-2">
              {commitments.map((c: any) => (
                <div key={c.id} className="card flex items-start gap-3 py-3">
                  <IconAlerta
                    size={16}
                    color={c.status === "kept" ? "var(--success)" : c.status === "broken" ? "var(--danger)" : "var(--warning)"}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{c.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(c.promisedDate)}</div>
                  </div>
                  <Badge
                    variant={c.status === "kept" ? "success" : c.status === "broken" ? "danger" : "warning"}
                    size="sm"
                  >
                    {c.status === "kept" ? "Cumplido" : c.status === "broken" ? "Roto" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Doc preview modal */}
      {docPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setDocPreview(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setDocPreview(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10"
            >
              <IconCerrar size={18} color="#1f2937" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900 px-4 py-3">
                <div className="text-white text-sm font-semibold">{docPreview.label}</div>
                <div className="text-gray-400 text-xs">{docPreview.filename}</div>
              </div>
              <img
                src={`data:${docPreview.mimeType};base64,${docPreview.base64}`}
                alt={docPreview.label}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
