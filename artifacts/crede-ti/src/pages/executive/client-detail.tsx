import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetClientQueryKey,
  useGetClient,
  getListCreditsQueryKey,
  useListCredits,
} from "@workspace/api-client-react";
import {
  IconTelefono,
  IconUbicacion,
  IconMoneda,
  IconCalendario,
} from "@/components/hapi/HapiIcons";

const statusLabels: Record<string, string> = {
  current: "Al corriente",
  overdue: "En atraso",
  at_risk: "En riesgo",
  defaulted: "Vencido",
  inactive: "Inactivo",
};

const statusClass: Record<string, string> = {
  current: "status-current",
  overdue: "status-overdue",
  at_risk: "status-at_risk",
  defaulted: "status-defaulted",
  inactive: "status-inactive",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const text = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return <span className="text-[26px] font-bold text-white uppercase">{text}</span>;
}

export default function ExecutiveClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);

  const { data: client, isLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) }
  });

  const { data: credits } = useListCredits(
    { clientId },
    { query: { enabled: !!clientId, queryKey: getListCreditsQueryKey({ clientId }) } }
  );

  const activeCredit = credits?.find((c: any) => c.status === "active");

  const qc = useQueryClient();
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatNotes: any[] = (((client as any)?.recentNotes ?? []) as any[]).filter((n) => n.noteType === "mensaje_cliente");

  async function sendMsg() {
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const r = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, noteType: "mensaje_cliente", content: msgText.trim() }),
      });
      if (r.ok) {
        setMsgText("");
        qc.invalidateQueries({ queryKey: getGetClientQueryKey(clientId) });
      }
    } finally {
      setSendingMsg(false);
    }
  }

  if (isLoading || !client) {
    return (
      <Layout title="Perfil del Cliente" back="/dashboard/clientes">
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-white rounded-2xl shadow-card" />
          <div className="h-28 bg-white rounded-2xl shadow-card" />
          <div className="h-20 bg-white rounded-2xl shadow-card" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Perfil del Cliente" back="/dashboard/clientes">
      <div className="space-y-4">

        <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #1A4FE0, #215DFF)" }}>
            <Initials name={client.fullName} />
          </div>
          <h2 className="text-[18px] font-bold text-foreground">{client.fullName}</h2>
          {client.riskLevel && (
            <p className="text-[11px] text-muted-foreground mt-1">Nivel de riesgo: <span className="font-bold text-primary">{client.riskLevel}</span></p>
          )}
          <span className={`mt-2 text-[11px] font-semibold px-3 py-1 rounded-full ${statusClass[client.status] ?? ""}`}>
            {statusLabels[client.status] ?? client.status}
          </span>
        </div>

        {activeCredit && (
          <div className="rounded-2xl p-5 shadow-card-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1A4FE0, #215DFF)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Crédito activo</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[26px] font-bold text-white leading-none">{fmt(activeCredit.remainingBalance ?? 0)}</p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Saldo pendiente</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-white">{fmt(activeCredit.weeklyPayment ?? 0)}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Pago semanal</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex gap-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Monto otorgado</p>
                <p className="text-[13px] font-semibold text-white">{fmt(activeCredit.amount)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Semanas</p>
                <p className="text-[13px] font-semibold text-white">{activeCredit.termWeeks}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datos de contacto</p>
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <IconTelefono size={18} color="var(--accent)" />
              </div>
              <span className="text-[14px] text-foreground">{client.phone}</span>
            </a>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <IconUbicacion size={18} color="var(--accent)" />
              </div>
              <span className="text-[13px] text-muted-foreground leading-relaxed">{client.address}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href={`/dashboard/cobrar`}>
            <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2 text-center active:bg-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconMoneda size={20} color="var(--accent)" />
              </div>
              <span className="text-[12px] font-semibold text-foreground">Registrar pago</span>
            </div>
          </Link>
          <Link href="/dashboard/compromisos">
            <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2 text-center active:bg-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <IconCalendario size={20} color="#B26A00" />
              </div>
              <span className="text-[12px] font-semibold text-foreground">Compromiso</span>
            </div>
          </Link>
        </div>


        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Mensajes con cliente</p>
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {chatNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Sin mensajes — inicia la conversación
                </div>
              ) : (
                chatNotes.map((n: any) => {
                  const fromClient = n.isFromClient != null ? n.isFromClient : (n.authorName === client.fullName);
                  const isAdvisor = !fromClient;
                  return (
                    <div key={n.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdvisor ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%", padding: "9px 13px",
                        borderRadius: isAdvisor ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isAdvisor ? "var(--accent)" : "var(--surface-2)",
                        color: isAdvisor ? "#fff" : "var(--text-primary)",
                        fontSize: 14, lineHeight: 1.5,
                      }}>
                        {n.content}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                        {isAdvisor ? (n.authorName ?? "Asesor") : client.fullName} · {new Date(n.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", display: "flex", gap: 8, padding: "10px 12px" }}>
              <input
                type="text"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={`Mensaje a ${client.fullName.split(" ")[0]}...`}
                style={{ flex: 1, borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", fontSize: 14, padding: "8px 12px", outline: "none" }}
              />
              <button
                onClick={sendMsg}
                disabled={!msgText.trim() || sendingMsg}
                style={{ borderRadius: "var(--r-md)", border: "none", cursor: msgText.trim() && !sendingMsg ? "pointer" : "default", background: msgText.trim() && !sendingMsg ? "var(--accent)" : "var(--border)", color: msgText.trim() && !sendingMsg ? "#fff" : "var(--text-muted)", padding: "0 14px", fontWeight: 700, fontSize: 14 }}
              >
                {sendingMsg ? "…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
