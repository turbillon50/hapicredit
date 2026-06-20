import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
}

type VipInvite = {
  code: string;
  inviteType: string;
  recipientName: string;
  recipientPhone: string | null;
  vipMessage: string | null;
  preApprovedAmount: number;
  preApprovedTermWeeks: number;
  preApprovedRate: number | null;
  preApprovedFee: number | null;
  expiresAt: string;
};

export default function Invitacion() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const [invite, setInvite]   = useState<VipInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!params?.code) return;
    fetch(`${API}/invite-codes/vip/${params.code}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setInvite(d);
      })
      .catch(() => setError("No se pudo cargar la invitación"))
      .finally(() => setLoading(false));
  }, [params?.code]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "linear-gradient(150deg,#06143B 0%,#0A2E8A 50%,#215DFF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Montserrat, sans-serif", fontSize: 14 }}>Cargando tu invitación…</div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div style={{ minHeight: "100dvh", background: "linear-gradient(150deg,#06143B 0%,#0A2E8A 50%,#215DFF 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Montserrat, sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}></div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Invitación no disponible</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", maxWidth: 280 }}>{error || "Esta invitación expiró o ya fue utilizada."}</div>
      </div>
    );
  }

  const totalToRepay = invite.preApprovedAmount * (1 + (invite.preApprovedRate ?? 30) / 100);
  const weeklyPayment = totalToRepay / invite.preApprovedTermWeeks;
  const delivers = invite.preApprovedAmount - (invite.preApprovedFee ?? 0);
  const isRenewal = invite.inviteType === "vip_renewal";
  const firstName = invite.recipientName.split(" ")[0];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#06143B 0%,#0A2E8A 50%,#215DFF 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 20px 40px",
      fontFamily: "Montserrat, Inter, -apple-system, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 8 }}>
          <defs><linearGradient id="vipg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3A00C8"/><stop offset="100%" stopColor="#215DFF"/></linearGradient></defs>
          <path d="M72 18C62 10 42 8 26 18C12 27 8 42 12 56C16 70 30 80 48 82C58 83 68 80 76 74" stroke="url(#vipg)" strokeWidth="14" strokeLinecap="round" fill="none"/>
          <circle cx="80" cy="18" r="9" fill="#19D7D7"/>
          <rect x="62" y="46" width="26" height="11" rx="5.5" fill="#19D7D7"/>
        </svg>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          crede<span style={{ color: "#19D7D7" }}>ti</span>
        </div>
      </div>

      {/* Badge */}
      <div style={{
        background: isRenewal ? "linear-gradient(135deg,var(--warning),#fbbf24)" : "linear-gradient(135deg,#10b981,#059669)",
        color: isRenewal ? "#451a03" : "#fff",
        fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
        padding: "5px 14px", borderRadius: 100, marginBottom: 20,
      }}>
        {isRenewal ? "Renovación especial" : "Crédito pre-aprobado"}
      </div>

      {/* Saludo */}
      <div style={{ color: "#fff", fontSize: 26, fontWeight: 900, textAlign: "center", marginBottom: 8, lineHeight: 1.2 }}>
        Hola, {firstName}
      </div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, textAlign: "center", marginBottom: 24, maxWidth: 300 }}>
        {invite.vipMessage ?? (isRenewal
          ? "Por tu excelente historial, tienes una renovación lista para ti."
          : "Has sido seleccionado para recibir un crédito personalizado."
        )}
      </div>

      {/* Card principal */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "var(--r-xl)", padding: "24px 20px",
        backdropFilter: "blur(20px)",
        marginBottom: 16,
      }}>
        {/* Monto */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Monto pre-aprobado
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {fmt(invite.preApprovedAmount)}
          </div>
        </div>

        {/* Condiciones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Plazo", val: `${invite.preApprovedTermWeeks} semanas` },
            { label: "Pago semanal", val: fmt(weeklyPayment) },
            { label: "Recibes", val: fmt(delivers), highlight: true },
            { label: "Total a pagar", val: fmt(totalToRepay) },
          ].map(item => (
            <div key={item.label} style={{
              background: "rgba(255,255,255,0.06)", borderRadius: "var(--r-lg)",
              padding: "12px 14px", textAlign: "center",
              border: item.highlight ? "1.5px solid rgba(25,215,215,0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: item.highlight ? "#19D7D7" : "#fff" }}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Expiración */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 20 }}>
          Oferta válida hasta {new Date(invite.expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            // Guardar el código VIP en localStorage para que el webhook lo use después del registro
            localStorage.setItem("credeti_vip_code", invite!.code);
            window.location.href = `${basePath}/sign-up`;
          }}
          style={{
            width: "100%", height: 56, borderRadius: "var(--r-xl)", border: "none",
            background: "linear-gradient(135deg,#19D7D7,#215DFF)",
            color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "var(--shadow-md)",
          }}>
          {isRenewal ? "Activar mi renovación" : "Reclamar mi crédito"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", maxWidth: 280 }}>
        Al registrarte aceptas los términos y condiciones de Crede-Ti. El crédito está sujeto a verificación final.
      </div>
    </div>
  );
}
