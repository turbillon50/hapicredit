import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import logoImg from "@assets/IMG_0626_1775411853416.jpeg";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "");

type Role = "client" | "executive" | "admin";

const roles: { id: Role; label: string; sublabel: string; desc: string; color: string; bg: string; border: string }[] = [
  { id: "client",    label: "Acreditado",   sublabel: "Cliente de crédito",  desc: "Solicita y administra tus créditos personales o de negocio.", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  { id: "executive", label: "Asesor",        sublabel: "Ejecutivo de campo",  desc: "Gestiona clientes, cobra pagos y da seguimiento a tu cartera.", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "admin",     label: "Administrador", sublabel: "Control total",       desc: "Acceso completo a cartera, reportes, usuarios y árbol de red.", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
];

export default function Registro() {
  const [, navigate] = useLocation();

  // ── Invite code from URL ─────────────────────────────────────────────────────
  const [inviteCode,    setInviteCode]    = useState("");
  const [inviteValid,   setInviteValid]   = useState<boolean | null>(null);
  const [inviteCreator, setInviteCreator] = useState("");
  const [inviteRole,    setInviteRole]    = useState<Role | null>(null);
  const [validating,    setValidating]    = useState(false);

  const [step,          setStep]          = useState<1 | 2>(1);
  const [role,          setRole]          = useState<Role | null>(null);
  const [staffPass,     setStaffPass]     = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [staffError,    setStaffError]    = useState("");
  const [checkingPass,  setCheckingPass]  = useState(false);

  // Read invite code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get("inv");
    if (!inv) return;
    setInviteCode(inv);
    validateInviteCode(inv);
  }, []);

  async function validateInviteCode(code: string) {
    setValidating(true);
    setInviteValid(null);
    try {
      const r = await fetch(`${API}/invite-codes/validate/${encodeURIComponent(code)}`);
      if (!r.ok) { setInviteValid(false); return; }
      const data = await r.json();
      if (data.valid) {
        setInviteValid(true);
        setInviteCreator(data.creatorName ?? "HapiCredit");
        const r2: Role = data.role === "admin" ? "admin" : data.role === "executive" ? "executive" : "client";
        setInviteRole(r2);
        setRole(r2);
        localStorage.setItem("hapi_pending_code", code.toUpperCase());
        if (r2 === "admin" || r2 === "executive") {
          // Staff roles still require the institutional password — go to step 2
          localStorage.setItem("hapi_pending_role", r2);
          localStorage.removeItem("hapi_pending_staff_pass");
          setStep(2);
        } else {
          // Client: auto-proceed to Clerk sign-up
          localStorage.setItem("hapi_pending_role", r2);
          localStorage.removeItem("hapi_pending_staff_pass");
        }
      } else {
        setInviteValid(false);
      }
    } catch {
      setInviteValid(false);
    } finally {
      setValidating(false);
    }
  }

  function selectRole(r: Role) {
    setRole(r);
    setStaffPass(""); setStaffError("");
    if (r === "client") {
      // Clients without invite code go straight to Clerk sign-up
      localStorage.setItem("hapi_pending_role", r);
      localStorage.removeItem("hapi_pending_code");
      localStorage.removeItem("hapi_pending_staff_pass");
      window.location.href = `${basePath}/sign-up`;
    } else {
      setStep(2);
    }
  }

  async function validateStaffPass() {
    if (!staffPass.trim()) { setStaffError("Ingresa la contraseña de acceso"); return; }
    setCheckingPass(true);
    setStaffError("");
    try {
      const r = await fetch(`${API}/auth/check-staff-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffPassword: staffPass }),
      });
      if (!r.ok) {
        const d = await r.json();
        setStaffError(d.error ?? "Contraseña de acceso incorrecta");
        return;
      }
      // Password valid — store context and go to Clerk sign-up
      localStorage.setItem("hapi_pending_role",       role!);
      localStorage.setItem("hapi_pending_staff_pass", staffPass);
      localStorage.removeItem("hapi_pending_code");
      window.location.href = `${basePath}/sign-up`;
    } catch {
      setStaffError("Error de conexión, intenta de nuevo");
    } finally {
      setCheckingPass(false);
    }
  }

  // Once invite is validated, show a "continue" button
  function continueWithInvite() {
    window.location.href = `${basePath}/sign-up`;
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#0c1428 0%,#142246 55%,#1a3468 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", padding: "36px 20px 48px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 12px", overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.35)", background: "#fff" }}>
          <img src={logoImg} alt="HapiCredit" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em" }}>
          Hapi<span style={{ color: "#e84545" }}>Credit</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>
          {step === 1 ? "Crea tu cuenta" : "Contraseña institucional"}
        </div>
      </div>

      {/* Invite code status banner */}
      {validating && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, color: "rgba(255,255,255,0.7)", fontSize: 13, display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 420 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#e84545", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          Validando código de invitación...
        </div>
      )}
      {!validating && inviteCode && inviteValid === true && (
        <div style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, color: "#4ade80", fontSize: 13, textAlign: "center", width: "100%", maxWidth: 420 }}>
          Invitación de <strong>{inviteCreator}</strong> · Rol: <strong>{inviteRole === "admin" ? "Administrador" : inviteRole === "executive" ? "Asesor" : "Acreditado"}</strong>
        </div>
      )}
      {!validating && inviteCode && inviteValid === false && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 13, textAlign: "center", width: "100%", maxWidth: 420 }}>
          Código inválido o expirado. Solicita uno nuevo a tu asesor.
        </div>
      )}

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

        {/* ── Invite code valid: just show continue button ── */}
        {inviteValid === true && step === 1 && (
          <div style={{ padding: "28px 22px" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>Tu invitación está lista</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                Crea tu cuenta con correo y contraseña. Recibirás un código de verificación por correo.
              </div>
            </div>
            <div style={{ background: inviteRole === "executive" ? "#eff6ff" : "#f0fdf4", border: `1.5px solid ${inviteRole === "executive" ? "#bfdbfe" : "#bbf7d0"}`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: inviteRole === "executive" ? "#2563eb" : "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {inviteRole === "executive" ? <BriefcaseSvg /> : <UserSvg />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{inviteRole === "executive" ? "Asesor" : "Acreditado"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Invitado por {inviteCreator}</div>
              </div>
            </div>
            <button
              onClick={continueWithInvite}
              style={{ width: "100%", padding: "14px", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", background: "#e84545", color: "#fff", fontFamily: "inherit" }}
            >
              Continuar con correo →
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>¿Ya tienes cuenta? </span>
              <a href="/login" style={{ fontSize: 13, color: "#e84545", fontWeight: 700, textDecoration: "none" }}>Inicia sesión</a>
            </div>
          </div>
        )}

        {/* ── Step 1: Role selection (no invite code) ── */}
        {(inviteValid === null || inviteValid === false) && step === 1 && (
          <div style={{ padding: "28px 22px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>¿Cómo vas a usar HapiCredit?</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>Selecciona el tipo de cuenta que corresponde a tu rol</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {roles.map(r => (
                <button key={r.id} onClick={() => selectRole(r.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 16, border: `1.5px solid ${r.border}`, background: r.bg, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.id === "client"    && <UserSvg />}
                    {r.id === "executive" && <BriefcaseSvg />}
                    {r.id === "admin"     && <ShieldSvg />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{r.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: r.color, marginBottom: 2, marginTop: 1 }}>{r.sublabel}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                  <ChevronRightSvg />
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>¿Ya tienes cuenta? </span>
              <a href="/login" style={{ fontSize: 13, color: "#e84545", fontWeight: 700, textDecoration: "none" }}>Inicia sesión</a>
            </div>
          </div>
        )}

        {/* ── Step 2: Staff master password ── */}
        {step === 2 && (
          <div style={{ padding: "28px 22px" }}>
            <button onClick={() => { setStep(1); setRole(null); setStaffError(""); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0, fontWeight: 600 }}>
              <ChevronLeftSvg /> Cambiar rol
            </button>
            {role && (() => {
              const r = roles.find(x => x.id === role)!;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", borderRadius: 12, background: r.bg, border: `1px solid ${r.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {role === "executive" ? <BriefcaseSvg small /> : <ShieldSvg small />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.sublabel}</div>
                  </div>
                </div>
              );
            })()}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>Contraseña de acceso</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                Para registrarte como {role === "admin" ? "Administrador" : "Asesor"} necesitas la contraseña institucional proporcionada por tu organización.
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Contraseña de acceso
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={staffPass}
                  onChange={e => { setStaffPass(e.target.value); setStaffError(""); }}
                  onKeyDown={e => e.key === "Enter" && validateStaffPass()}
                  placeholder="Contraseña institucional"
                  autoFocus
                  style={{ width: "100%", padding: "13px 44px 13px 16px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 15, boxSizing: "border-box", outline: "none", color: "#111", background: "#f8fafc", fontFamily: "inherit" }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                  {showPass ? <EyeOffSvg /> : <EyeSvg />}
                </button>
              </div>
              {staffError && (
                <div style={{ marginTop: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 13px", color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
                  {staffError}
                </div>
              )}
            </div>
            <button
              onClick={validateStaffPass}
              disabled={!staffPass.trim() || checkingPass}
              style={{ width: "100%", padding: "14px", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: !staffPass.trim() || checkingPass ? "default" : "pointer", background: !staffPass.trim() || checkingPass ? "#e5e7eb" : "#e84545", color: !staffPass.trim() || checkingPass ? "#9ca3af" : "#fff", fontFamily: "inherit" }}
            >
              {checkingPass ? "Verificando..." : "Continuar →"}
            </button>
          </div>
        )}
      </div>

      {/* Informational note about email verification */}
      {(inviteValid === true || step === 2) && (
        <div style={{ marginTop: 16, textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12, maxWidth: 320, lineHeight: 1.5 }}>
          Recibirás un correo de verificación para confirmar tu cuenta
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Aviso de privacidad</a>
        <a href="/terminos"   style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>Términos y condiciones</a>
      </div>
    </div>
  );
}

/* ── SVG Helpers ─────────────────────────────────────────────────────────────── */
function UserSvg()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function BriefcaseSvg({ small }: { small?: boolean } = {}) { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>; }
function ShieldSvg({ small }: { small?: boolean } = {})    { const s = small ? 16 : 20; return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function ChevronRightSvg() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, alignSelf: "center" }}><path d="M9 18l6-6-6-6"/></svg>; }
function ChevronLeftSvg()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>; }
function EyeSvg()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffSvg() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
