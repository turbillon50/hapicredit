import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}` });

const CATEGORIES = [
  { value: "general",    label: "General" },
  { value: "uso",        label: "Uso de la app" },
  { value: "cuenta",     label: "Mi cuenta" },
  { value: "credito",    label: "Créditos" },
  { value: "pagos",      label: "Pagos" },
  { value: "invitacion", label: "Invitaciones" },
  { value: "soporte",    label: "Soporte" },
];

function IconBack({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IconPlus({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconEdit({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconTrash({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
}
function IconToggle({ active }: { active: boolean }) {
  return (
    <div style={{
      width: 38, height: 22, borderRadius: 11,
      background: active ? "#215DFF" : "var(--text-muted)",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: active ? 19 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }} />
    </div>
  );
}

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM = { question: "", answer: "", category: "general", sortOrder: 0, isActive: true };

export default function AdminFaq() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["faq-admin"],
    queryFn: async () => {
      const r = await fetch(`${API}/faq/all`, { headers: auth() });
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const createMut = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) =>
      fetch(`${API}/faq`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faq-admin"] }); qc.invalidateQueries({ queryKey: ["faq-public"] }); resetForm(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<typeof EMPTY_FORM> }) =>
      fetch(`${API}/faq/${id}`, { method: "PATCH", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faq-admin"] }); qc.invalidateQueries({ queryKey: ["faq-public"] }); resetForm(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`${API}/faq/${id}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faq-admin"] }); qc.invalidateQueries({ queryKey: ["faq-public"] }); setDeleteId(null); },
  });

  function resetForm() { setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); }

  function openEdit(item: FaqItem) {
    setEditItem(item);
    setForm({ question: item.question, answer: item.answer, category: item.category, sortOrder: item.sortOrder, isActive: item.isActive });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    if (editItem) {
      updateMut.mutate({ id: editItem.id, body: form });
    } else {
      createMut.mutate(form);
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  const catLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 16px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="pressable"
              onClick={() => window.history.back()}
              style={{ width: 38, height: 38, borderRadius: "var(--r-lg)", background: "var(--surface-2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}
            >
              <IconBack />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>FAQ — Administrar</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{(items as FaqItem[]).length} preguntas</div>
            </div>
          </div>
          <button
            className="pressable"
            onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--r-lg)", background: "#215DFF", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            <IconPlus size={15} /> Nueva
          </button>
        </div>

        {/* FAQ list */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: "var(--r-xl)", background: "var(--surface-2)" }} />)}
          </div>
        ) : (items as FaqItem[]).length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-secondary)", marginBottom: 6 }}>Sin preguntas aún</div>
            <div style={{ fontSize: 13 }}>Toca "Nueva" para agregar la primera pregunta frecuente.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(items as FaqItem[]).map(item => (
              <div
                key={item.id}
                style={{
                  borderRadius: "var(--r-xl)",
                  background: "#fff",
                  border: `1.5px solid ${item.isActive ? "var(--border)" : "var(--surface-3)"}`,
                  padding: "14px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: item.isActive ? "var(--text-primary)" : "var(--text-muted)", lineHeight: 1.4, marginBottom: 4 }}>
                      {item.question}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: "var(--surface-2)", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>{catLabel(item.category)}</span>
                      {!item.isActive && <span style={{ background: "var(--surface-3)", color: "var(--danger)", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>Inactiva</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      className="pressable"
                      onClick={() => updateMut.mutate({ id: item.id, body: { isActive: !item.isActive } })}
                      style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "#f8fafc", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title={item.isActive ? "Desactivar" : "Activar"}
                    >
                      <IconToggle active={item.isActive} />
                    </button>
                    <button
                      className="pressable"
                      onClick={() => openEdit(item)}
                      style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--surface-3)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}
                    >
                      <IconEdit />
                    </button>
                    <button
                      className="pressable"
                      onClick={() => setDeleteId(item.id)}
                      style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "#fff0f0", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, borderTop: "1px solid var(--surface-2)", paddingTop: 8 }}>
                  {item.answer.length > 120 ? item.answer.slice(0, 120) + "..." : item.answer}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form sheet */}
        {showForm && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}
            onClick={e => { if (e.target === e.currentTarget) resetForm(); }}
          >
            <div style={{ width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 20 }}>
                {editItem ? "Editar pregunta" : "Nueva pregunta"}
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Pregunta *</label>
                  <textarea
                    value={form.question}
                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                    rows={2}
                    placeholder="¿Cómo puedo...?"
                    required
                    style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", fontSize: 14, color: "var(--text-primary)", outline: "none", resize: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Respuesta *</label>
                  <textarea
                    value={form.answer}
                    onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                    rows={4}
                    placeholder="Explica detalladamente la respuesta..."
                    required
                    style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", fontSize: 14, color: "var(--text-primary)", outline: "none", resize: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Categoría</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", fontSize: 14, color: "var(--text-primary)", outline: "none", background: "#fff" }}
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Orden</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                      style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", fontSize: 14, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "var(--r-lg)", background: "#f8fafc" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Visible para usuarios</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                    <IconToggle active={form.isActive} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="pressable"
                    style={{ flex: 1, padding: "13px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "#f8fafc", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="pressable"
                    style={{ flex: 2, padding: "13px", borderRadius: "var(--r-lg)", border: "none", background: "#215DFF", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? "Guardando..." : editItem ? "Guardar cambios" : "Crear pregunta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteId !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: "var(--r-xl)", padding: "28px 24px", maxWidth: 320, width: "100%" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 10 }}>Eliminar pregunta</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>Esta acción no se puede deshacer. ¿Confirmas eliminar esta pregunta?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDeleteId(null)}
                  className="pressable"
                  style={{ flex: 1, padding: "12px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)", background: "#f8fafc", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMut.mutate(deleteId)}
                  disabled={deleteMut.isPending}
                  className="pressable"
                  style={{ flex: 1, padding: "12px", borderRadius: "var(--r-lg)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
