import { useState, useEffect } from "react";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}
function isIOSSafari() {
  return isIOS() && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SmartInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem("credeti_install_dismissed")) return;

    if (isIOSSafari()) {
      const t = setTimeout(() => setShowIOS(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      setTimeout(() => setShowAndroid(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("credeti_install_dismissed", "1");
    setShowAndroid(false);
    setShowIOS(false);
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem("credeti_install_dismissed", "1");
    setShowAndroid(false);
    setDeferredPrompt(null);
  }

  /* ── Android banner ─────────────────────────────────────────────────────── */
  if (showAndroid && deferredPrompt) {
    return (
      <div style={{
        position: "fixed", bottom: 88, left: 12, right: 12, zIndex: 200,
        background: "#215DFF", borderRadius: 20,
        padding: "14px 16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>Instalar credeti</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Acceso rápido desde tu inicio</div>
        </div>
        <button
          onClick={installAndroid}
          style={{
            padding: "8px 14px", borderRadius: 10,
            background: "#215DFF", color: "#fff",
            border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0,
          }}
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)",
            border: "none", cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    );
  }

  /* ── iOS bottom sheet ───────────────────────────────────────────────────── */
  if (showIOS) {
    return (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
        onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      >
        <div style={{
          width: "100%", background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 48px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1e293b" }}>Instala la app en tu iPhone</div>
            <button
              onClick={dismiss}
              style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18, lineHeight: 1.5 }}>
            Agrega credeti a tu pantalla de inicio para usarla como app nativa, sin abrir el navegador.
          </div>
          {[
            { num: 1, color: "#4f46e5", bg: "#e0e7ff", title: 'Toca el botón "Compartir"', sub: "El ícono de cuadro con flecha hacia arriba, en la barra inferior de Safari" },
            { num: 2, color: "#16a34a", bg: "#dcfce7", title: '"Agregar a pantalla de inicio"', sub: 'Desliza hacia abajo en el menú y selecciona esta opción' },
            { num: 3, color: "#ea580c", bg: "#fff7ed", title: 'Toca "Agregar"', sub: "Confirma y el ícono aparecerá en tu pantalla de inicio" },
          ].map(step => (
            <div key={step.num} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 16, background: "#f8fafc", border: "1.5px solid #e2e8f0", marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: step.color }}>{step.num}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{step.sub}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 4, padding: "11px 14px", borderRadius: 12, background: "#fef9f0", border: "1px solid #fed7aa" }}>
            <div style={{ fontSize: 12, color: "#92400e" }}>
              Asegúrate de abrir esta página en <strong>Safari</strong> — Chrome y otros navegadores no permiten instalación en iPhone.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
