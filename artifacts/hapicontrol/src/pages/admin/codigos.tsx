import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { IconEquipo, IconMas } from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const ROLE_LABEL: Record<string, string> = { admin: "Administrador", executive: "Asesor", client: "Acreditado" };
const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  admin:     { bg: "#ede9fe", color: "#7c3aed" },
  executive: { bg: "#dbeafe", color: "#1e40af" },
  client:    { bg: "#dcfce7", color: "#166534" },
};

type Code = {
  id: number; code: string; role: string; isActive: boolean;
  expiresAt: string; createdAt: string; usedAt: string | null; usedByName: string | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminCodigos() {
  const [generating, setGenerating] = useState(false);
  const [newRole, setNewRole] = useState<"executive" | "client">("executive");
  const [copied, setCopied] = useState<string | null>(null);
  const qc = useQueryClient();

  const userRole = (() => { try { return JSON.parse(localStorage.getItem("hapi_user") || "{}").role; } catch { return ""; } })();

  const { data: codes = [], isLoading } = useQuery<Code[]>({
    queryKey: ["invite-codes-mine"],
    queryFn: async () => {
      const res = await fetch(`${API}/invite-codes/mine`, { headers: auth() });
      if (!res.ok) throw new Error("Error al cargar códigos");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch(`${API}/invite-codes/generate`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invite-codes-mine"] }); setGenerating(false); },
  });

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const shareText = (code: string, role: string) =>
    `Te invito a registrarte en HapiCredit como ${ROLE_LABEL[role]}.\nUsa este código: ${code}\nhttps://hapicredit.live/registro`;

  const pendingCodes = codes.filter(c => !c.usedAt && c.isActive);
  const usedCodes = codes.filter(c => c.usedAt);

  return (
    <Layout>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy-800)" }}>Códigos de invitación</h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Genera y comparte códigos para registrar nuevos usuarios</p>
          </div>
          <button
            onClick={() => setGenerating(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            <IconMas size={16} /> Nuevo
          </button>
        </div>

        {/* Generate modal */}
        {generating && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Generar código</h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Selecciona el rol para el que generarás el código:</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {(userRole === "admin" ? ["executive", "client"] : ["client"]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewRole(r as "executive" | "client")}
                    style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${newRole === r ? ROLE_COLOR[r].color : "#e2e8f0"}`, background: newRole === r ? ROLE_COLOR[r].bg : "white", cursor: "pointer", textAlign: "left", fontWeight: 600, color: newRole === r ? ROLE_COLOR[r].color : "#374151" }}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setGenerating(false)} style={{ flex: 1, padding: "12px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button
                  onClick={() => generateMutation.mutate(newRole)}
                  disabled={generateMutation.isPending}
                  style={{ flex: 2, padding: "12px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: generateMutation.isPending ? 0.7 : 1 }}
                >
                  {generateMutation.isPending ? "Generando..." : "Generar"}
                </button>
              </div>
              {generateMutation.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(generateMutation.error as Error).message}</p>}
            </div>
          </div>
        )}

        {isLoading && <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>Cargando...</p>}

        {/* Pending codes */}
        {pendingCodes.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Disponibles ({pendingCodes.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingCodes.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 14, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1.5px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.12em", color: "var(--navy-800)", fontFamily: "monospace" }}>{c.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: ROLE_COLOR[c.role]?.bg, color: ROLE_COLOR[c.role]?.color }}>{ROLE_LABEL[c.role]}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Expira: {formatDate(c.expiresAt)}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => copyCode(c.code)} style={{ flex: 1, padding: "9px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: copied === c.code ? "#f0fdf4" : "white", color: copied === c.code ? "#166534" : "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {copied === c.code ? "Copiado" : "Copiar código"}
                    </button>
                    <button
                      onClick={() => navigator.share?.({ title: "Invitación HapiCredit", text: shareText(c.code, c.role) })}
                      style={{ flex: 1, padding: "9px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                    >
                      Compartir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Used codes */}
        {usedCodes.length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Usados ({usedCodes.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {usedCodes.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "#94a3b8", letterSpacing: "0.1em" }}>{c.code}</span>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{c.usedByName || "—"} · {c.usedAt ? formatDate(c.usedAt) : ""}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#f1f5f9", color: "#64748b" }}>{ROLE_LABEL[c.role]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && codes.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <IconEquipo size={40} color="#cbd5e1" />
            <p style={{ color: "#94a3b8", marginTop: 12 }}>Aun no has generado codigos</p>
            <p style={{ color: "#cbd5e1", fontSize: 13 }}>Toca "Nuevo" para crear tu primer codigo de invitacion</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
