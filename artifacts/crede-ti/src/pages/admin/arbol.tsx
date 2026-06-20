import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { IconEquipo, IconPerfil, IconMaletin, IconAdmin } from "@/components/hapi/HapiIcons";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const ROLE_CFG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  admin:     { label: "Admin",      bg: "var(--surface-3)", color: "var(--text-secondary)", border: "var(--border)", icon: <IconAdmin size={14} /> },
  executive: { label: "Asesor",     bg: "rgba(33,93,255,0.10)", color: "var(--brand-blue)", border: "var(--border)", icon: <IconMaletin size={14} /> },
  client:    { label: "Acreditado", bg: "var(--surface-3)", color: "var(--text-secondary)", border: "var(--border)", icon: <IconPerfil size={14} /> },
};

const STATUS_COLOR: Record<string, string> = {
  current: "var(--success)", at_risk: "var(--warning)", overdue: "var(--danger)", defaulted: "var(--danger)", inactive: "var(--text-muted)",
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

// ── Trash icon
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// ── Delete confirmation modal
function DeleteModal({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 24px" }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Eliminar asesor</h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px", lineHeight: 1.5 }}>
          ¿Seguro que quieres eliminar a <strong>{name}</strong> y desactivar sus acreditados? Esta acción no se puede deshacer.
        </p>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ width: "100%", padding: "14px", border: "none", borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", background: "var(--danger)", color: "#fff", fontFamily: "inherit", marginBottom: 10, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          onClick={onCancel}
          style={{ width: "100%", padding: "14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontWeight: 600, fontSize: 15, cursor: "pointer", background: "transparent", color: "var(--text-secondary)", fontFamily: "inherit" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Edit name modal
function EditModal({ node, onSave, onCancel, loading }: { node: TreeNode; onSave: (name: string) => void; onCancel: () => void; loading: boolean }) {
  const [name, setName] = useState(node.fullName);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 24px" }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 20px", letterSpacing: "-0.03em" }}>Editar asesor</h3>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Nombre completo</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", padding: "13px 14px", fontSize: 15, fontFamily: "inherit", marginTop: 8, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
          autoFocus
        />
        <button
          onClick={() => onSave(name)}
          disabled={loading || !name.trim()}
          style={{ width: "100%", padding: "14px", border: "none", borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", background: "#215DFF", color: "#fff", fontFamily: "inherit", marginBottom: 10, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          onClick={onCancel}
          style={{ width: "100%", padding: "14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontWeight: 600, fontSize: 15, cursor: "pointer", background: "transparent", color: "var(--text-secondary)", fontFamily: "inherit" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function NodeCard({ node, depth = 0, defaultOpen = true, onDelete, onEdit, onCambiarSucursal }: {
  node: TreeNode;
  depth?: number;
  defaultOpen?: boolean;
  onDelete?: (node: TreeNode) => void;
  onEdit?: (node: TreeNode) => void;
  onCambiarSucursal?: (node: TreeNode) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = ROLE_CFG[node.role] ?? ROLE_CFG.client;
  const hasChildren = node.children.length > 0;
  const statusColor = node.status ? STATUS_COLOR[node.status] : undefined;
  const canEdit = node.role === "executive";

  return (
    <div style={{ marginLeft: depth * 14, marginBottom: 8 }}>
      <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "13px 15px", border: `1.5px solid ${cfg.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar */}
          <div
            style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0, cursor: hasChildren ? "pointer" : "default" }}
            onClick={() => hasChildren && setOpen(o => !o)}
          >
            {cfg.icon}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, cursor: hasChildren ? "pointer" : "default" }} onClick={() => hasChildren && setOpen(o => !o)}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{node.fullName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: "var(--r-xl)", background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              {node.username && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>@{node.username}</span>}
              {node.phone && !node.username && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{node.phone}</span>}
              {statusColor && <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{STATUS_LABEL[node.status!] ?? node.status}</span>}
              {node.isActive === false && <span style={{ fontSize: 10, color: "var(--danger)", fontWeight: 600 }}>Inactivo</span>}
            </div>
            {node.clientCount !== undefined && node.clientCount > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{node.clientCount} acreditado{node.clientCount !== 1 ? "s" : ""}</div>
            )}
          </div>

          {/* Actions (only for executives) */}
          {canEdit && (
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {onCambiarSucursal && (
                <button
                  onClick={() => onCambiarSucursal(node)}
                  title="Cambiar sucursal"
                  style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-blue)", cursor: "pointer" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4-4-4"/><path d="M3 12h18"/></svg>
                </button>
              )}
              <button
                onClick={() => onEdit?.(node)}
                style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", border: "1.5px solid var(--border)", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <EditIcon />
              </button>
              <button
                onClick={() => onDelete?.(node)}
                style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", border: "1.5px solid var(--surface-3)", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", cursor: "pointer" }}
              >
                <TrashIcon />
              </button>
            </div>
          )}

          {hasChildren && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0, cursor: "pointer" }}
              onClick={() => setOpen(o => !o)}
            >▼</div>
          )}
        </div>
      </div>

      {open && hasChildren && (
        <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `2px solid ${cfg.border}`, marginLeft: 18 }}>
          {node.children.map(child => (
            <NodeCard
              key={`${child.role}-${child.id}`}
              node={child}
              depth={0}
              defaultOpen={node.children.length <= 8}
              onDelete={child.role === "executive" ? onDelete : undefined}
              onEdit={child.role === "executive" ? onEdit : undefined}
              onCambiarSucursal={child.role === "executive" ? onCambiarSucursal : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminArbol() {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("credeti_user") || "{}"); } catch { return {}; } })();
  const userRole    = localStorage.getItem("credeti_role") ?? "executive";
  const qc          = useQueryClient();

  const [deleteTarget,          setDeleteTarget]          = useState<TreeNode | null>(null);
  const [editTarget,            setEditTarget]            = useState<TreeNode | null>(null);
  const [cambiarSucursalTarget, setCambiarSucursalTarget] = useState<TreeNode | null>(null);
  const [newParentId,           setNewParentId]           = useState<number | null>(null);

  const { data: tree, isLoading, error } = useQuery<Tree>({
    queryKey: ["my-tree"],
    queryFn: async () => {
      const r = await fetch(`${API}/users/my-tree`, { headers: auth() });
      if (!r.ok) throw new Error("Error al cargar arbol");
      return r.json();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: auth() });
      if (!r.ok) throw new Error("Error al eliminar");
      return r.json();
    },
    onSuccess: () => { setDeleteTarget(null); qc.invalidateQueries({ queryKey: ["my-tree"] }); },
  });

  const editUser = useMutation({
    mutationFn: async ({ id, fullName }: { id: number; fullName: string }) => {
      const r = await fetch(`${API}/users/${id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      return r.json();
    },
    onSuccess: () => { setEditTarget(null); qc.invalidateQueries({ queryKey: ["my-tree"] }); },
  });

  const { data: allAdmins } = useQuery<any[]>({
    queryKey: ["admins-list"],
    queryFn: () => fetch(`${API}/users?role=admin`, { headers: auth() }).then(r => r.json()),
    enabled: !!cambiarSucursalTarget,
  });

  const cambiarSucursalMut = useMutation({
    mutationFn: async ({ execId, parentId }: { execId: number; parentId: number }) => {
      const r = await fetch(`${API}/users/${execId}/parent`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ parentId }),
      });
      if (!r.ok) throw new Error("Error al cambiar sucursal");
      return r.json();
    },
    onSuccess: () => {
      setCambiarSucursalTarget(null);
      setNewParentId(null);
      qc.invalidateQueries({ queryKey: ["my-tree"] });
    },
  });

  const level1 = tree?.children ?? [];
  const totalExecs    = level1.filter(n => n.role === "executive").length;
  const totalClientes = level1.reduce((s, n) => s + (n.role === "client" ? 1 : 0) + (n.children?.length ?? 0), 0);
  const totalAll      = level1.reduce((s, n) => s + 1 + (n.children?.length ?? 0), 0);

  return (
    <Layout>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
            {userRole === "admin" ? "Mi Árbol" : "Mi Red"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {userRole === "admin" ? "Todos los asesores y acreditados de tu organización" : "Acreditados que registraste"}
          </p>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "12px", textAlign: "center", border: "1px solid var(--surface-2)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{totalAll}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
          </div>
          {userRole === "admin" && (
            <>
              <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "12px", textAlign: "center", border: "1px solid var(--surface-2)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{totalExecs}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Asesores</div>
              </div>
              <div style={{ background: "white", borderRadius: "var(--r-lg)", padding: "12px", textAlign: "center", border: "1px solid var(--surface-2)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{totalClientes}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Acreditados</div>
              </div>
            </>
          )}
        </div>

        {isLoading && <SkeletonList count={4} />}

        {error && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "var(--danger)" }}>Error al cargar el arbol</p>
          </div>
        )}

        {/* Tree is empty */}
        {!isLoading && !error && level1.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 50, padding: "0 8px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "var(--r-xl)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <IconEquipo size={32} color="var(--text-muted)" />
            </div>
            <p style={{ color: "var(--text-secondary)", marginTop: 0, fontWeight: 700, fontSize: 17 }}>Tu red está vacía</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6, lineHeight: 1.5, maxWidth: 280, margin: "6px auto 28px" }}>
              Genera códigos de invitación desde tu perfil para agregar asesores y acreditados a tu red.
            </p>
            <a
              href="/perfil"
              style={{ display: "inline-block", padding: "13px 28px", background: "#215DFF", color: "#fff", borderRadius: "var(--r-lg)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Ir a mi perfil — Códigos de invitación
            </a>
          </div>
        )}

        {/* Root node + tree */}
        {!isLoading && !error && level1.length > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#215DFF", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconAdmin size={16} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{currentUser.fullName || "Tu cuenta"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                    {userRole === "admin" ? "Administrador — Raiz del arbol" : "Asesor — Tu red"}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{totalAll} miembros</div>
              </div>
              <div style={{ width: 2, height: 12, background: "var(--border)", marginLeft: 36 }} />
            </div>

            <div>
              {level1.map(node => (
                <NodeCard
                  key={`${node.role}-${node.id}`}
                  node={node}
                  depth={0}
                  defaultOpen={level1.length <= 6}
                  onDelete={n => setDeleteTarget(n)}
                  onEdit={n => setEditTarget(n)}
                  onCambiarSucursal={n => { setCambiarSucursalTarget(n); setNewParentId(null); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.fullName}
          onConfirm={() => deleteUser.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteUser.isPending}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          node={editTarget}
          onSave={name => editUser.mutate({ id: editTarget.id, fullName: name })}
          onCancel={() => setEditTarget(null)}
          loading={editUser.isPending}
        />
      )}

      {/* Cambiar sucursal modal */}
      {cambiarSucursalTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>Cambiar sucursal</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
              Mover a <strong>{cambiarSucursalTarget.fullName}</strong> a una nueva sucursal
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {(allAdmins ?? []).filter((a: any) => a.role === "admin" && a.isActive).map((admin: any) => (
                <button
                  key={admin.id}
                  onClick={() => setNewParentId(admin.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: "var(--r-lg)",
                    border: `1.5px solid ${newParentId === admin.id ? "var(--text-secondary)" : "var(--border)"}`,
                    background: newParentId === admin.id ? "var(--surface-3)" : "#fff",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)" }}>
                    {admin.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{admin.fullName}</div>
                    {admin.username && <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{admin.username}</div>}
                  </div>
                  {newParentId === admin.id && (
                    <div style={{ marginLeft: "auto" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
              {(!allAdmins || allAdmins.filter((a: any) => a.role === "admin").length === 0) && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                  {allAdmins ? "No hay otros administradores disponibles" : "Cargando..."}
                </p>
              )}
            </div>
            <button
              onClick={() => newParentId && cambiarSucursalMut.mutate({ execId: cambiarSucursalTarget.id, parentId: newParentId })}
              disabled={!newParentId || cambiarSucursalMut.isPending}
              style={{ width: "100%", padding: 14, background: "#215DFF", color: "white", border: "none", borderRadius: "var(--r-lg)", fontWeight: 700, fontSize: 15, cursor: (!newParentId || cambiarSucursalMut.isPending) ? "default" : "pointer", marginBottom: 10, opacity: (!newParentId || cambiarSucursalMut.isPending) ? 0.5 : 1, fontFamily: "inherit" }}
            >
              {cambiarSucursalMut.isPending ? "Moviendo..." : "Cambiar sucursal"}
            </button>
            <button
              onClick={() => { setCambiarSucursalTarget(null); setNewParentId(null); }}
              style={{ width: "100%", padding: 14, background: "transparent", color: "var(--text-secondary)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
