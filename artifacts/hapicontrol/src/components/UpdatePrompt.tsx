import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 30_000);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 80,
      left: 16,
      right: 16,
      zIndex: 9999,
      background: "#142246",
      color: "#fff",
      borderRadius: 16,
      padding: "16px 20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          Nueva version disponible
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Actualiza para ver los ultimos cambios
        </div>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#e84545",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 18px",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        Actualizar
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 14px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        Ahora no
      </button>
    </div>
  );
}
