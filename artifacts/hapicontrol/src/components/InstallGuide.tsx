import { useState } from "react";
import { IconCelular, IconCerrar, IconCompartir, IconPuntos, IconMas } from "@/components/hapi/HapiIcons";

export function InstallGuide() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 mx-auto mt-4 px-4 py-2 rounded-full transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <IconCelular size={14} color="rgba(255,255,255,0.5)" />
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Instalar en tu celular</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#0f1f3d" }}>
                <span className="text-white font-bold text-[13px]" style={{ fontFamily: "Georgia, serif" }}>HC</span>
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">Instalar HapiControl</p>
                <p className="text-[11px] text-muted-foreground">Acceso directo desde tu pantalla</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
              <IconCerrar size={16} color="#6b7280" />
            </button>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">iPhone / iPad</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">Safari</span>
            </div>
            <div className="space-y-2.5">
              <Step num={1} icon={<IconCompartir size={16} color="#3b82f6" />}>
                Abre esta página en <b>Safari</b> y toca el botón <b>Compartir</b> (cuadro con flecha hacia arriba)
              </Step>
              <Step num={2} icon={<IconMas size={16} color="#3b82f6" />}>
                Desliza hacia abajo y selecciona <b>"Agregar a pantalla de inicio"</b>
              </Step>
              <Step num={3} icon={<span className="text-[13px]">✓</span>}>
                Toca <b>"Agregar"</b> y listo — el ícono aparecerá en tu escritorio
              </Step>
            </div>
          </div>

          <div className="h-px bg-border mb-5" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Android</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">Chrome</span>
            </div>
            <div className="space-y-2.5">
              <Step num={1} icon={<IconPuntos size={16} color="#4b5563" />}>
                Abre esta página en <b>Chrome</b> y toca los <b>3 puntos</b> (esquina superior derecha)
              </Step>
              <Step num={2} icon={<IconCelular size={16} color="#4b5563" />}>
                Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a pantalla de inicio"</b>
              </Step>
              <Step num={3} icon={<span className="text-[13px]">✓</span>}>
                Confirma y listo — se instala como una app nativa
              </Step>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Al instalar, HapiControl se abrirá a pantalla completa sin barra de navegador, como una app nativa. Funciona incluso sin conexión para las pantallas ya visitadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ num, icon, children }: { num: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary">{num}</span>
      </div>
      <div className="flex items-start gap-2 pt-0.5">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <p className="text-[12px] text-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
