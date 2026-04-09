import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { IconEquipo, IconPerfil, IconMaletin, IconAdmin } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  admin:     { label: "Admin",      bg: "#ede9fe", color: "#7c3aed", border: "#c4b5fd", icon: <IconAdmin size={14} /> },
  executive: { label: "Asesor",     bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", icon: <IconMaletin size={14} /> },
  client:    { label: "Acreditado", bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", icon: <IconPerfil size={14} /> },
};

type TreeNode = {
  id: number;
  fullName: string;
  role: string;
  email: string | null;
  username: string;
  isActive: boolean;
  createdAt: string;
  children: TreeNode[];
};

type Tree = {
  id: number;
  children: TreeNode[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function NodeCard({ node, depth = 0, defaultOpen = true }: { node: TreeNode; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = ROLE_CONFIG[node.role] ?? ROLE_CONFIG.client;
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: depth * 16, marginBottom: 8 }}>
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: "14px 16px",
          border: `1.5px solid ${cfg.border}`,
          cursor: hasChildren ? "pointer" : "default",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
            {cfg.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{node.fullName}</span>
              {!node.isActive && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>Inactivo</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>@{node.username}</span>
            </div>
            {node.email && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{node.email}</p>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {hasChildren && (
              <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>
                {node.children.length} {node.children.length === 1 ? "usuario" : "usuarios"}
              </div>
            )}
            {hasChildren && (
              <div style={{ fontSize: 12, color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                ▼
              </div>
            )}
          </div>
        </div>
      </div>

      {open && hasChildren && (
        <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `2px solid ${cfg.border}`, marginLeft: 18 }}>
          {node.children.map(child => (
            <NodeCard key={child.id} node={child} depth={0} defaultOpen={true} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminArbol() {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}"); } catch { return {}; } })();

  const { data: tree, isLoading, error } = useQuery<Tree>({
    queryKey: ["my-tree"],
    queryFn: async () => {
      const r = await fetch(`${API}/users/my-tree`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar arbol");
      return r.json();
    },
  });

  const totalUsers = tree?.children.reduce((s, c) => s + 1 + c.children.length, 0) ?? 0;
  const level1 = tree?.children ?? [];
  const level2Total = level1.reduce((s, c) => s + c.children.length, 0);

  return (
    <Layout>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)" }}>Mi Red</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Arbol genealogico de usuarios que registraste</p>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy-800)" }}>{totalUsers}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
          </div>
          <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af" }}>{level1.length}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Directos</div>
          </div>
          <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#065f46" }}>{level2Total}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Indirectos</div>
          </div>
        </div>

        {isLoading && <SkeletonList count={3} />}

        {error && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#ef4444" }}>Error al cargar el arbol</p>
          </div>
        )}

        {!isLoading && !error && level1.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <IconEquipo size={40} color="#cbd5e1" />
            <p style={{ color: "#94a3b8", marginTop: 12, fontWeight: 600 }}>Tu red esta vacia</p>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>
              Genera codigos de invitacion para agregar usuarios a tu red
            </p>
            <a
              href="/admin/codigos"
              style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", background: "var(--accent)", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              Ver codigos de invitacion
            </a>
          </div>
        )}

        {/* Me (root node) */}
        {!isLoading && level1.length > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy-800)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconAdmin size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{currentUser.fullName || "Tu cuenta"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Tu — raiz del arbol</div>
                </div>
              </div>
              <div style={{ width: 2, height: 12, background: "#e2e8f0", margin: "0 auto", marginLeft: 36 }} />
            </div>

            <div>
              {level1.map(node => (
                <NodeCard key={node.id} node={node} depth={0} defaultOpen={level1.length <= 5} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
