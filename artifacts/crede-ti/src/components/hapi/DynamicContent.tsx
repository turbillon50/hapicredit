import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

/**
 * Carrusel de banners dinámicos configurados por el admin.
 * Se muestra al cliente. Si no hay banners activos, no renderiza nada.
 */
export function DynamicBanners() {
  const { data: banners = [] } = useQuery<any[]>({
    queryKey: ["public-banners"],
    queryFn: async () => { const r = await fetch(`${API}/content/banners/active`); if (!r.ok) return []; return r.json(); },
    staleTime: 60_000,
  });

  if (!banners.length) return null;

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <div className="snap-x-carousel" style={{ gap: 12 }}>
        {(banners as any[]).map(b => (
          <div
            key={b.id}
            className="card"
            style={{
              minWidth: banners.length > 1 ? "85%" : "100%",
              background: "linear-gradient(135deg, var(--brand-blue-deep) 0%, var(--brand-blue) 100%)",
              border: "none", padding: "18px 20px", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>{b.title}</div>
              {b.body && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 5, lineHeight: 1.5 }}>{b.body}</div>}
              {b.cta_label && (
                <a
                  href={b.cta_url || "#"}
                  style={{
                    display: "inline-flex", marginTop: 12, padding: "8px 16px",
                    background: "#fff", color: "var(--brand-blue)", borderRadius: 100,
                    fontWeight: 700, fontSize: 13, textDecoration: "none",
                  }}
                >
                  {b.cta_label}
                </a>
              )}
            </div>
            {/* Glow decorativo */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(25,215,215,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Lista de notificaciones generales activas. Para mi-credito o perfil.
 */
export function DynamicNotifications() {
  const { data: avisos = [] } = useQuery<any[]>({
    queryKey: ["public-notifications"],
    queryFn: async () => { const r = await fetch(`${API}/content/notifications/active`); if (!r.ok) return []; return r.json(); },
    staleTime: 60_000,
  });

  if (!avisos.length) return null;

  return (
    <div style={{ padding: "0 16px", marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {(avisos as any[]).slice(0, 5).map(n => (
        <div key={n.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--surface-3)", color: "var(--brand-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{n.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.45 }}>{n.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
