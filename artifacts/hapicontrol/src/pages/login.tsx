import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import logoImg from "@assets/IMG_0626_1775411853416.jpeg";

const API      = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "");

function roleHome(role: string) {
  if (role === "admin")     return "/admin";
  if (role === "executive") return "/dashboard";
  return "/mi-credito";
}

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [existingSession, setExistingSession] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Show banner if there's an active session — but don't auto-redirect
    // Eduardo needs to be able to switch between accounts manually
    const token = localStorage.getItem("hapi_token");
    const role  = localStorage.getItem("hapi_role");
    const user  = localStorage.getItem("hapi_user");
    if (token && role) {
      try {
        const u = user ? JSON.parse(user) : null;
        setExistingSession({ name: u?.fullName ?? u?.username ?? "Usuario", role });
      } catch {
        setExistingSession(null);
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { token?: string; user?: { role: string }; error?: string };
      if (!res.ok || !data.token || !data.user) { setError(data.error ?? "Credenciales incorrectas"); return; }
      localStorage.setItem("hapi_token", data.token);
      localStorage.setItem("hapi_role",  data.user.role);
      localStorage.setItem("hapi_user",  JSON.stringify(data.user));
      navigate(roleHome(data.user.role));
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && username.trim().length > 0 && password.length > 0;

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#fff",
    }}>

      {/* ── Top visual panel ── */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(150deg,#0c1428 0%,#142246 55%,#1a3468 100%)",
        flex: "0 0 42vh",
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "0 28px 40px",
      }}>
        {/* Decorative blobs */}
        <div style={{ position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,69,69,0.22) 0%,transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:30,right:60,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,69,69,0.10) 0%,transparent 70%)",pointerEvents:"none" }} />

        {/* Back link */}
        <a
          href="/"
          style={{
            position:"absolute",top:20,left:20,
            display:"flex",alignItems:"center",gap:6,
            color:"rgba(255,255,255,0.5)",textDecoration:"none",fontSize:13,fontWeight:600,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Inicio
        </a>

        {/* Logo + Brand */}
        <div style={{ display:"flex",alignItems:"center",gap:16 }}>
          <div style={{ width:72,height:72,borderRadius:20,overflow:"hidden",flexShrink:0,boxShadow:"0 8px 28px rgba(0,0,0,0.35)",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <img src={logoImg} alt="HapiCredit" style={{ width:"100%",height:"100%",objectFit:"contain" }} />
          </div>
          <div>
            <div style={{ fontWeight:900,fontSize:26,letterSpacing:"-0.05em",color:"#fff",lineHeight:1 }}>
              Hapi<span style={{ color:"#e84545" }}>Credit</span>
            </div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:4,fontWeight:500 }}>
              Tu credito, Tu impulso
            </div>
          </div>
        </div>
      </div>

      {/* ── Form sheet ── */}
      <div style={{
        flex: 1,
        background: "#fff",
        borderRadius: "28px 28px 0 0",
        marginTop: -28,
        padding: "32px 24px 40px",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.10)",
        position: "relative",
        zIndex: 2,
        overflowY: "auto",
      }}>
        {/* Drag handle */}
        <div style={{ width:40,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 28px" }} />

        {/* Active session banner */}
        {existingSession && (
          <div style={{
            background:"#fffbeb",border:"1px solid #fde68a",borderRadius:14,
            padding:"14px 16px",marginBottom:20,
          }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#92400e",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>
              Sesion activa
            </div>
            <div style={{ fontSize:14,color:"#78350f",marginBottom:10 }}>
              <strong>{existingSession.name}</strong> ({existingSession.role === "admin" ? "Administrador" : existingSession.role === "executive" ? "Asesor" : "Cliente"})
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button
                onClick={() => navigate(roleHome(existingSession.role))}
                style={{
                  flex:1,padding:"10px",background:"#e84545",color:"#fff",
                  border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",
                }}
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  setExistingSession(null);
                }}
                style={{
                  flex:1,padding:"10px",background:"#fff",color:"#78350f",
                  border:"1.5px solid #fde68a",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",
                }}
              >
                Cambiar usuario
              </button>
            </div>
          </div>
        )}

        <h2 style={{ fontSize:22,fontWeight:900,color:"#111",margin:"0 0 4px",letterSpacing:"-0.04em" }}>
          {existingSession ? "Iniciar con otra cuenta" : "Bienvenido de vuelta"}
        </h2>
        <p style={{ fontSize:14,color:"var(--text-secondary)",margin:"0 0 28px",lineHeight:1.5 }}>
          Ingresa con tu usuario y contrasena
        </p>

        <form onSubmit={handleLogin} style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {/* Username */}
          <div>
            <label style={labelSt}>Usuario</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              style={inputSt}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelSt}>Contrasena</label>
            <div style={{ position:"relative" }}>
              <input
                type={showPass?"text":"password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contrasena"
                autoComplete="current-password"
                style={{ ...inputSt,paddingRight:60 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",
                  color:"var(--text-muted)",fontSize:12,fontWeight:700,padding:0,
                }}
              >
                {showPass?"Ocultar":"Ver"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,
              padding:"12px 16px",color:"#dc2626",fontSize:13,fontWeight:500,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width:"100%",padding:"15px",marginTop:4,
              background: canSubmit?"#e84545":"var(--bg-warm)",
              color: canSubmit?"#fff":"var(--text-muted)",
              border:"none",borderRadius:14,
              fontWeight:700,fontSize:15,
              cursor: canSubmit?"pointer":"default",
              fontFamily:"inherit",
              boxShadow: canSubmit?"0 4px 20px rgba(232,69,69,0.32)":"none",
              transition:"background 0.15s,color 0.15s,box-shadow 0.15s",
              letterSpacing:"-0.01em",
            }}
          >
            {loading?"Verificando...":"Iniciar sesion"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display:"flex",alignItems:"center",gap:12,margin:"24px 0 20px" }}>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
          <span style={{ fontSize:11,color:"var(--text-muted)",fontWeight:600 }}>o</span>
          <div style={{ flex:1,height:1,background:"var(--border)" }} />
        </div>

        {/* Clerk email/passkey */}
        <a href={`${basePath}/sign-in`} style={{
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          width:"100%",padding:"14px",
          background:"var(--bg-warm)",color:"#111",
          borderRadius:14,fontWeight:700,fontSize:14,
          textDecoration:"none",
          border:"1.5px solid var(--border)",
          transition:"background 0.15s",
          letterSpacing:"-0.01em",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Continuar con correo o passkey
        </a>

        {/* Register link */}
        <div style={{ textAlign:"center",marginTop:28,paddingTop:24,borderTop:"1px solid var(--border)" }}>
          <span style={{ fontSize:14,color:"var(--text-secondary)" }}>No tienes cuenta? </span>
          <a href="/registro" style={{ fontSize:14,color:"#e84545",fontWeight:700,textDecoration:"none" }}>
            Registrate
          </a>
        </div>
      </div>
    </div>
  );
}

const labelSt: React.CSSProperties = {
  display:"block",fontSize:11,fontWeight:700,color:"#374151",
  textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8,
};

const inputSt: React.CSSProperties = {
  width:"100%",padding:"14px 16px",
  border:"1.5px solid var(--border-mid)",borderRadius:12,
  fontSize:15,boxSizing:"border-box",outline:"none",
  color:"#111",background:"var(--bg-warm)",
  fontFamily:"inherit",transition:"border-color 0.15s,box-shadow 0.15s",
};
