import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/hapi/Badge";
import { SkeletonList } from "@/components/hapi/Skeleton";
import { EmptyState } from "@/components/hapi/EmptyState";
import {
  IconCarpeta, IconSubir, IconDocumento as IconArchivo,
  IconCamara as IconImagen, IconDocumento, IconBorrar,
  IconCheck, IconLoader, IconOjo, IconCerrar,
} from "@/components/hapi/HapiIcons";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const DOCUMENT_LABELS: Record<string, string> = {
  ine_front:  "INE — Frente",
  ine_back:   "INE — Reverso",
  curp_doc:   "CURP",
  domicilio:  "Comprobante de domicilio",
  ingresos:   "Comprobante de ingresos",
  foto:       "Fotografía reciente",
  otro:       "Otro documento",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function docIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <IconImagen size={16} color="#3b82f6" />;
  if (mimeType === "application/pdf")  return <IconDocumento size={16} color="#ef4444" />;
  return <IconArchivo size={16} color="#6b7280" />;
}

type Doc = {
  id: number;
  content: string;
  createdAt: string;
  authorName: string | null;
};

type ParsedDoc = {
  filename: string;
  mimeType: string;
  base64: string;
  label: string;
  uploadedAt: string;
};

function parseDoc(doc: Doc): ParsedDoc | null {
  try { return JSON.parse(doc.content); } catch { return null; }
}

export default function ClientExpediente() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [labelKey, setLabelKey] = useState("ine_front");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedDoc | null>(null);

  const { data: client } = useQuery<any>({
    queryKey: ["me-client"],
    queryFn: () => fetch(`${API}/me/client`, { headers: auth() }).then(r => r.json()),
  });

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["client-docs", client?.id],
    queryFn: () => fetch(`${API}/clients/${client!.id}/documents`, { headers: auth() }).then(r => r.json()),
    enabled: !!client?.id,
  });

  const deleteMut = useMutation({
    mutationFn: (docId: number) =>
      fetch(`${API}/clients/${client!.id}/documents/${docId}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-docs", client?.id] }),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client?.id) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`${API}/clients/${client.id}/documents`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64,
          label: DOCUMENT_LABELS[labelKey] ?? labelKey,
        }),
      });
      if (!res.ok) throw new Error("Error al subir");
      await qc.invalidateQueries({ queryKey: ["client-docs", client?.id] });
      setUploadMsg("Documento cargado correctamente");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setUploadMsg("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  const required = Object.entries(DOCUMENT_LABELS).filter(([k]) => k !== "otro");
  const uploadedLabels = (docs as Doc[]).map(d => parseDoc(d)?.label ?? "");

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-6 px-4 pt-4 md:pt-0">

        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi Expediente</h1>
          <p className="text-sm text-gray-500 mt-0.5">Documentos e identificaciones cargados a tu cuenta</p>
        </div>

        {/* Progreso de documentos */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-800">Expediente completo</div>
            <Badge
              variant={uploadedLabels.length >= required.length ? "success" : "warning"}
              size="sm"
            >
              {uploadedLabels.length}/{required.length} documentos
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {required.map(([key, label]) => {
              const uploaded = uploadedLabels.some(l => l === label);
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  {uploaded
                    ? <span className="flex items-center gap-1 text-green-600 font-semibold text-xs"><IconCheck size={14} /> Cargado</span>
                    : <span className="text-gray-400 text-xs">Pendiente</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload */}
        <div className="card border-2 border-dashed border-blue-200" style={{ background: "#f0f7ff" }}>
          <div className="flex items-center gap-2 mb-3">
            <IconSubir size={20} color="#3b82f6" />
            <div className="text-sm font-bold text-gray-800">Cargar nuevo documento</div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Tipo de documento</label>
              <select
                value={labelKey}
                onChange={e => setLabelKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--accent)" } as any}
              >
                {Object.entries(DOCUMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="doc-upload"
            />
            <label
              htmlFor="doc-upload"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold pressable cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff", opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? <IconLoader size={16} className="animate-spin" /> : <IconSubir size={16} />}
              {uploading ? "Subiendo..." : "Seleccionar foto o archivo"}
            </label>

            {uploadMsg && (
              <div
                className={`text-xs font-medium px-3 py-2 rounded-xl ${uploadMsg.includes("error") || uploadMsg.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}
              >
                {uploadMsg}
              </div>
            )}
          </div>
        </div>

        {/* Lista de documentos */}
        <div>
          <div className="text-sm font-bold text-gray-700 mb-3">Documentos cargados</div>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : (docs as Doc[]).length === 0 ? (
            <EmptyState
              icon={<IconCarpeta size={24} />}
              title="Expediente vacío"
              description="Aún no has cargado ningún documento. Usa el botón de arriba para empezar."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {(docs as Doc[]).slice().reverse().map((doc) => {
                const parsed = parseDoc(doc);
                if (!parsed) return null;
                const isImage = parsed.mimeType.startsWith("image/");
                return (
                  <div key={doc.id} className="card flex items-center gap-3">
                    {isImage ? (
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 cursor-pointer"
                        onClick={() => setPreview(parsed)}
                      >
                        <img
                          src={`data:${parsed.mimeType};base64,${parsed.base64}`}
                          alt={parsed.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                        {docIcon(parsed.mimeType)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{parsed.label}</div>
                      <div className="text-xs text-gray-400">{parsed.filename}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(parsed.uploadedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {isImage && (
                        <button
                          onClick={() => setPreview(parsed)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center pressable"
                          style={{ background: "#f0f7ff" }}
                        >
                          <IconOjo size={16} color="#3b82f6" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMut.mutate(doc.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center pressable"
                        style={{ background: "#fff0f0" }}
                      >
                        <IconBorrar size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10"
            >
              <IconCerrar size={20} color="#1f2937" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900 px-4 py-3">
                <div className="text-white text-sm font-semibold">{preview.label}</div>
                <div className="text-gray-400 text-xs">{preview.filename}</div>
              </div>
              <img
                src={`data:${preview.mimeType};base64,${preview.base64}`}
                alt={preview.label}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
