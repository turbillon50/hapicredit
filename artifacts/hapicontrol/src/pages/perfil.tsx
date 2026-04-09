import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Avatar } from "@/components/hapi/Avatar";
import {
  IconTelefono, IconUbicacion, IconID,
  IconInfo,
  IconSubir, IconCarpeta,
  IconDocumento, IconBorrar,
  IconOjo, IconCerrar, IconLoader,
} from "@/components/hapi/HapiIcons";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("hapi_token")}` });

const DOC_LABELS: Record<string, string> = {
  ine_front: "INE \u2014 Frente", ine_back: "INE \u2014 Reverso", curp_doc: "CURP",
  domicilio: "Comprobante de domicilio", ingresos: "Comprobante de ingresos",
  foto: "Fotografía reciente", otro: "Otro documento",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Perfil() {
  useRequireAuth(["client"]);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [labelKey, setLabelKey] = useState("ine_front");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["all-clients"],
    queryFn: async () => { const r = await fetch(`${API}/clients`, { headers: auth() }); if (!r.ok) throw new Error("Error al cargar clientes"); return r.json(); },
  });
  const client = (clients as any[])[0];

  const { data: docs = [], isLoading: loadingDocs } = useQuery<any[]>({
    queryKey: ["client-docs", client?.id],
    queryFn: async () => { const r = await fetch(`${API}/clients/${client!.id}/documents`, { headers: auth() }); if (!r.ok) throw new Error("Error al cargar documentos"); return r.json(); },
    enabled: !!client?.id,
  });

  const deleteMut = useMutation({
    mutationFn: (docId: number) =>
      fetch(`${API}/clients/${client!.id}/documents/${docId}`, { method: "DELETE", headers: auth() }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-docs", client?.id] }),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client?.id) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`${API}/clients/${client.id}/documents`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, base64, label: DOC_LABELS[labelKey] ?? labelKey }),
      });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ["client-docs", client?.id] });
      setUploadMsg("Documento cargado correctamente");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setUploadMsg("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5 pb-6 px-4 pt-4">

        {/* Profile card */}
        <div className="card flex flex-col items-center text-center py-6">
          <Avatar name={client?.fullName ?? "Usuario"} size="lg" />
          <div className="text-lg font-bold text-gray-900 mt-3">{client?.fullName ?? "Cliente"}</div>
          <div className="text-sm text-gray-500">{client?.phone ?? ""}</div>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              {client?.status === "current" ? "Al corriente" : client?.status ?? "Nuevo"}
            </span>
          </div>
        </div>

        {/* Info */}
        {client && (
          <div className="card flex flex-col gap-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información personal</div>
            {[
              [<IconTelefono size={16} />, "Teléfono",  client.phone],
              [<IconTelefono size={16} />, "Tel. alterno", client.altPhone || "\u2014"],
              [<IconUbicacion size={16} />, "Domicilio",  client.address || "\u2014"],
              [<IconID size={16} />, "CURP",       client.curp || "\u2014"],
            ].map(([icon, label, val]) => (
              <div key={String(label)} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 mt-0.5 text-base">{icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{String(label)}</div>
                  <div className="font-medium text-gray-800">{String(val)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document upload */}
        <div className="card border-2 border-dashed border-blue-200" style={{ background: "#f0f7ff" }}>
          <div className="flex items-center gap-2 mb-3">
            <IconSubir size={20} color="#3b82f6" />
            <div className="text-sm font-bold text-gray-800">Cargar documento</div>
          </div>
          <div className="flex flex-col gap-3">
            <select
              value={labelKey}
              onChange={e => setLabelKey(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:outline-none"
            >
              {Object.entries(DOC_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" id="doc-up" />
            <label
              htmlFor="doc-up"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold pressable cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff", opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? <IconLoader size={16} className="animate-spin" /> : <IconSubir size={16} />}
              {uploading ? "Subiendo..." : "Seleccionar archivo"}
            </label>
            {uploadMsg && (
              <div className={`text-xs font-medium px-3 py-2 rounded-xl ${uploadMsg.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                {uploadMsg}
              </div>
            )}
          </div>
        </div>

        {/* Documents list */}
        <div>
          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <IconCarpeta size={16} /> Mis documentos
          </div>
          {loadingDocs ? (
            <div className="text-xs text-gray-400 text-center py-6">Cargando...</div>
          ) : (docs as any[]).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="mx-auto mb-2"><IconCarpeta size={30} color="#9ca3af" /></span>
              <div className="text-sm">Sin documentos cargados</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(docs as any[]).slice().reverse().map((doc: any) => {
                let parsed: any = null;
                try { parsed = JSON.parse(doc.content); } catch { return null; }
                if (!parsed) return null;
                const isImage = parsed.mimeType?.startsWith("image/");
                return (
                  <div key={doc.id} className="card flex items-center gap-3">
                    {isImage ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 cursor-pointer" onClick={() => setPreview(parsed)}>
                        <img src={`data:${parsed.mimeType};base64,${parsed.base64}`} alt={parsed.label} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                        <IconDocumento size={24} color="#9ca3af" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{parsed.label}</div>
                      <div className="text-xs text-gray-400">{parsed.filename}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {isImage && (
                        <button onClick={() => setPreview(parsed)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#f0f7ff" }}>
                          <IconOjo size={14} color="#3b82f6" />
                        </button>
                      )}
                      <button onClick={() => deleteMut.mutate(doc.id)} className="w-8 h-8 rounded-lg flex items-center justify-center pressable" style={{ background: "#fff0f0" }}>
                        <IconBorrar size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* App info */}
        <div className="card flex items-start gap-3" style={{ background: "#f8fafc" }}>
          <span className="mt-0.5 shrink-0"><IconInfo size={20} color="#9ca3af" /></span>
          <div>
            <div className="text-sm font-semibold text-gray-700">HapiCredit v1.0</div>
            <div className="text-xs text-gray-400 leading-relaxed mt-1">
              Sistema de gestión de créditos de Grupo CAFJA. Para acceder como administrador, toca el candado en la esquina superior derecha.
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setPreview(null)}>
          <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
              <IconCerrar size={20} color="#1f2937" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-900 px-4 py-3">
                <div className="text-white text-sm font-semibold">{preview.label}</div>
              </div>
              <img src={`data:${preview.mimeType};base64,${preview.base64}`} alt={preview.label} className="w-full max-h-[60vh] object-contain bg-black" />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
