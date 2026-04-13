import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { IconEquipo, IconPerfil, IconMaletin, IconAdmin } from "@/components/hapi/HapiIcons";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const ROLE_CFG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  admin:     { label: "Admin",      bg: "#ede9fe", color: "#7c3aed", border: "#c4b5fd", icon: <IconAdmin size={14} /> },
  executive: { label: "Asesor",     bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", icon: <IconMaletin size={14} /> },
  client:    { label: "Acreditado", bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", icon: <IconPerfil size={14} /> },
};

const STATUS_COLOR: Record<string, string> = {
  current: "#16a34a", at_risk: "#d97706", overdue: "#dc2626", defaulted: "#7f1d1d", inactive: "#6b7280",
};
const STATUS_LABEL: Record<string, string> = {
  current: "Al corriente", at_risk: "En riesgo", overdue: "Vencido", defaulted: "Incumplimiento", inactive: "Inactivo",
};

type TreeNode = {
  id: number;
  fullName: string;
  role: string;
  email?: string | null;
  username?: string;
  phone?: string;
  status?: string;
  isActive?: boolean;
  clientCount?: number;
  createdAt?: string;
  registeredAt?: string;
  children: TreeNode[];
};

type Tree = { id: number; children: TreeNode[] };

function NodeCard({ node, depth = 0, defaultOpen = true }: { node: TreeNode; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = ROLE_CFG[node.role] ?? ROLE_CFG.client;
  const hasChildren = node.children.length > 0;
  const isClientRecord = node.role === "client" && !node.username;
  const statusColor = node.status ? STATUS_COLOR[node.status] : undefined;

  return (
    <div style={{ marginLeft: depth * 14, marginBottom: 8 }}>
      <div
        style={{ background: "white", borderRadius: 14, padding: "13px 15px", border: `1.5px solid ${cfg.border}`, cursor: hasChildren ? "pointer" : "default", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
            {cfg.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 2 }}>{node.fullName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              {node.username && <span style={{ fontSize: 11, color: "#94a3b8" }}>@{node.username}</span>}
              {node.phone && !node.username && <span style={{ fontSize: 11, color: "#94a3b8" }}>{node.phone}</span>}
              {statusColor && <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{STATUS_LABEL[node.status!] ?? node.status}</span>}
              {node.isActive === false && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>Inactivo</span>}
            </div>
            {node.clientCount !== undefined && node.clientCount > 0 && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{node.clientCount} acreditado{node.clientCount !== 1 ? "s" : ""}</div>
            )}
          </div>
          {hasChildren && (
            <div style={{ fontSize: 12, color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>▼</div>
          )}
        </div>
      </div>

      {open && hasChildren && (
        <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `2px solid ${cfg.border}`, marginLeft: 18 }}>
          {node.children.map(child => (
            <NodeCard key={`${child.role}-${child.id}`} node={child} depth={0} defaultOpen={node.children.length <= 8} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminArbol() {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}"); } catch { return {}; } })();
  const userRole    = localStorage.getItem("hapi_role") ?? "executive";

  const { data: tree, isLoading, error } = useQuery<Tree>({
    queryKey: ["my-tree"],
    queryFn: async () => {
      const r = await fetch(`${API}/users/my-tree`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar arbol");
      return r.json();
    },
  });

  const level1 = tree?.children ?? [];
  const totalExecs    = level1.filter(n => n.role === "executive").length;
  const totalClientes = level1.reduce((s, n) => s + (n.role === "client" ? 1 : 0) + (n.children?.length ?? 0), 0);
  const totalAll = level1.reduce((s, n) => s + 1 + (n.children?.length ?? 0), 0);

  return (
    <Layout>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#142246" }}>
            {userRole === "admin" ? "Mi Arbol" : "Mi Red"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            {userRole === "admin" ? "Todos los asesores y acreditados de tu organizacion" : "Acreditados que registraste"}
          </p>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#142246" }}>{totalAll}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
          </div>
          {userRole === "admin" && (
            <>
              <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af" }}>{totalExecs}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Asesores</div>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#065f46" }}>{totalClientes}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Acreditados</div>
              </div>
            </>
          )}
          {userRole !== "admin" && (
            <div style={{ background: "white", borderRadius: 12, padding: "12px", textAlign: "center", border: "1px solid #f1f5f9", gridColumn: "2 / -1" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#065f46" }}>{totalClientes}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Acreditados</div>
            </div>
          )}
        </div>

        {isLoading && <SkeletonList count={3} />}

        {error && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#ef4444" }}>Error al cargar el arbol</p>
          </div>
        )}

        {!isLoading && !error && level1.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <IconEquipo size={44} color="#cbd5e1" />
            <p style={{ color: "#94a3b8", marginTop: 14, fontWeight: 700, fontSize: 16 }}>Tu red esta vacia</p>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 6, lineHeight: 1.5, maxWidth: 260, margin: "6px auto 0" }}>
              Genera codigos de invitacion desde tu perfil y compartellos por WhatsApp para agregar miembros.
            </p>
            <a
              href="/perfil"
              style={{ display: "inline-block", marginTop: 18, padding: "11px 22px", background: "#e84545", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Ir a mi perfil
            </a>
          </div>
        )}

        {/* Root node + tree */}
        {!isLoading && level1.length > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#142246", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconAdmin size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{currentUser.fullName || "Tu cuenta"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                    {userRole === "admin" ? "Administrador — Raiz del arbol" : "Asesor — Tu red"}
                  </div>
                </div>
              </div>
              <div style={{ width: 2, height: 12, background: "#e2e8f0", marginLeft: 36 }} />
            </div>

            <div>
              {level1.map(node => (
                <NodeCard key={`${node.role}-${node.id}`} node={node} depth={0} defaultOpen={level1.length <= 6} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
