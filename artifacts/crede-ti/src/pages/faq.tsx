import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useLocation } from "wouter";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

const CATEGORIES: Record<string, string> = {
  general:     "General",
  uso:         "Uso de la app",
  cuenta:      "Mi cuenta",
  credito:     "Créditos",
  pagos:       "Pagos",
  invitacion:  "Invitaciones",
  soporte:     "Soporte",
};

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.22s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IconBack({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function FaqItem({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: 16,
        background: open ? "var(--surface)" : "var(--surface-2)",
        border: `1.5px solid ${open ? "#215DFF" : "var(--border)"}`,
        overflow: "hidden",
        transition: "border-color 0.18s, background 0.18s",
      }}
    >
      <button
        className="pressable"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
          {item.question}
        </span>
        <span style={{ color: open ? "#215DFF" : "var(--text-muted)", flexShrink: 0 }}>
          <IconChevron open={open} />
        </span>
      </button>
      {open && (
        <div style={{
          padding: "0 16px 16px",
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          borderTop: "1px solid var(--surface-2)",
          paddingTop: 12,
        }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["faq-public"],
    queryFn: async () => {
      const r = await fetch(`${API}/faq`);
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const categories = useMemo(() => {
    const cats = new Set((items as any[]).map((i: any) => i.category));
    return Array.from(cats);
  }, [items]);

  const filtered = useMemo(() => {
    return (items as any[]).filter((item: any) => {
      const matchesQ = !query || item.question.toLowerCase().includes(query.toLowerCase()) || item.answer.toLowerCase().includes(query.toLowerCase());
      const matchesCat = !activeCategory || item.category === activeCategory;
      return matchesQ && matchesCat;
    });
  }, [items, query, activeCategory]);

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "16px 16px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="pressable"
            onClick={() => window.history.back()}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--surface-2)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0,
            }}
          >
            <IconBack size={20} />
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              Preguntas frecuentes
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>
              Encuentra respuestas rápidas
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
            <IconSearch size={17} />
          </span>
          <input
            type="text"
            placeholder="Buscar pregunta..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 38px",
              borderRadius: 14,
              border: "1.5px solid var(--border)",
              background: "var(--surface-inset)",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            <button
              className="pressable"
              onClick={() => setActiveCategory(null)}
              style={{
                padding: "7px 14px",
                borderRadius: 50,
                border: `1.5px solid ${!activeCategory ? "#215DFF" : "var(--border)"}`,
                background: !activeCategory ? "#215DFF" : "#f8fafc",
                color: !activeCategory ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className="pressable"
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 50,
                  border: `1.5px solid ${activeCategory === cat ? "#215DFF" : "var(--border)"}`,
                  background: activeCategory === cat ? "#215DFF" : "#f8fafc",
                  color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {CATEGORIES[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 52, borderRadius: 16, background: "var(--surface-2)", animation: "pulse 1.5s ease infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--surface-2)", margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconSearch size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-secondary)", marginBottom: 6 }}>
              {query ? "Sin resultados" : "No hay preguntas disponibles"}
            </div>
            <div style={{ fontSize: 13 }}>
              {query ? `No encontramos resultados para "${query}"` : "Vuelve pronto, estamos construyendo el contenido."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item: any) => (
              <FaqItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Support footer */}
        <div style={{
          borderRadius: 18,
          background: "linear-gradient(135deg,#215DFF 0%,#215DFF 100%)",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>¿No encontraste tu respuesta?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
            Contáctanos por correo o WhatsApp, con gusto te ayudamos.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <a
              href="mailto:hola@crede-ti.info"
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                textAlign: "center", textDecoration: "none",
              }}
            >
              Correo
            </a>
            <a
              href="https://wa.me/527223602587"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12,
                background: "#25d366",
                color: "#fff", fontSize: 12, fontWeight: 700,
                textAlign: "center", textDecoration: "none",
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    </Layout>
  );
}
