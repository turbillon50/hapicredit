import { Link } from "wouter";
import { IconAlerta } from "@/components/hapi/HapiIcons";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: "var(--surface-2)" }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--surface-3)" }}>
          <IconAlerta size={36} color="#ef4444" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Página no encontrada</h2>
        <p className="text-sm text-gray-500 mb-8">La ruta que buscas no existe.</p>
        <Link
          href="/admin"
          className="inline-flex items-center px-6 py-3 rounded-xl text-white text-sm font-semibold pressable"
          style={{ background: "var(--accent)" }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
