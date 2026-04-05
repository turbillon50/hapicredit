import { useState } from "react";
import { Link } from "wouter";
import { useCreatePublicRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  IconWhatsapp,
  IconEscudo,
  IconCelular,
  IconGrafica,
  IconFlecha,
  IconCheck,
} from "@/components/hapi/HapiIcons";

export default function PublicLanding() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const createRequest = useCreatePublicRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest.mutateAsync({ data: { name, phone, email, message } });
      toast({ title: "Mensaje enviado", description: "Un asesor se comunicará contigo pronto." });
      setName(""); setPhone(""); setEmail(""); setMessage("");
    } catch {
      toast({ title: "Error al enviar", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">

      <header className="sticky top-0 z-50 bg-white border-b border-border" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a3a6b" }}>
              <span className="text-white text-[11px] font-bold" style={{ fontFamily: "Georgia, serif" }}>HC</span>
            </div>
            <span className="font-bold text-[16px] text-foreground tracking-tight">HapiControl</span>
          </div>
          <Link href="/login">
            <button className="h-9 px-4 rounded-lg text-[13px] font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              Acceso interno
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1">

        <section className="px-5 py-16 md:py-24 max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-6" style={{ background: "#eef3fb", color: "#1a3a6b" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Microfinanzas digitales
            </div>
            <h1 className="text-[36px] md:text-[52px] font-bold text-foreground leading-[1.12] tracking-tight">
              Control total de tu cartera de créditos
            </h1>
            <p className="text-[16px] text-muted-foreground leading-relaxed mt-4 max-w-xl">
              HapiControl centraliza la gestión de tus microcréditos: clientes, pagos, cobranza y análisis financiero — todo desde tu celular.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/5213001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: "#16a34a" }}
              >
                <IconWhatsapp size={20} color="#fff" />
                WhatsApp
              </a>
              <button
                onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
                className="h-12 px-6 rounded-xl font-semibold text-[14px] text-foreground border border-border flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
              >
                Más información
                <IconFlecha size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-background">
          <div className="max-w-5xl mx-auto px-5 py-14">
            <h2 className="text-[22px] font-bold text-foreground text-center mb-10">Diseñado para equipos de cobranza</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: IconCelular,
                  title: "100% desde el celular",
                  desc: "Consulta saldos, registra pagos y visualiza tu cartera en tiempo real desde cualquier dispositivo.",
                },
                {
                  icon: IconEscudo,
                  title: "Transparencia total",
                  desc: "Cada movimiento queda registrado con fecha, hora y asesor responsable. Control antifraude integrado.",
                },
                {
                  icon: IconGrafica,
                  title: "Análisis en tiempo real",
                  desc: "Dashboards con cobros del día, índice de mora, proyecciones y ranking de asesores.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-white rounded-2xl p-6 shadow-card">
                    <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center" style={{ background: "#eef3fb" }}>
                      <Icon size={22} color="var(--accent)" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-[22px] font-bold text-foreground mb-2">Todo lo que necesitas en una sola herramienta</h2>
              <p className="text-[13px] text-muted-foreground mb-6">Olvídate de Excel, WhatsApp y hojas de cálculo separadas.</p>
              <div className="space-y-3">
                {[
                  "Cartera por ejecutivo con semáforo de estatus",
                  "Registro de pagos con actualización automática de saldo",
                  "Compromisos de pago y seguimiento",
                  "Score de riesgo automático por cliente",
                  "Alertas inteligentes de impago y atrasos",
                  "Flujo de caja y cobranza del día vs lo esperado",
                  "Ranking y métricas por ejecutivo",
                  "Historial completo del cliente",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconCheck size={12} color="var(--accent)" />
                    </div>
                    <span className="text-[13px] text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="contacto" className="bg-white rounded-2xl shadow-card p-6 border border-border">
              <h3 className="text-[17px] font-bold text-foreground mb-1">Solicitar información</h3>
              <p className="text-[12px] text-muted-foreground mb-5">Un asesor se comunicará a la brevedad.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  { label: "Nombre completo", val: name, set: setName, type: "text", ph: "Ej. Juan Pérez" },
                  { label: "Teléfono", val: phone, set: setPhone, type: "tel", ph: "10 dígitos" },
                  { label: "Correo (opcional)", val: email, set: setEmail, type: "email", ph: "tu@correo.com" },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <label className="text-[12px] font-medium text-foreground/75">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.ph}
                      required={f.label !== "Correo (opcional)"}
                      className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-foreground/75">Mensaje</label>
                  <textarea
                    placeholder="¿En qué podemos ayudarte?"
                    required
                    className="w-full h-20 px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={createRequest.isPending}
                  className="w-full h-11 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #1a3a6b, #2454a3)" }}
                >
                  {createRequest.isPending ? "Enviando..." : "Enviar mensaje"}
                </button>
              </form>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border py-6 text-center bg-white">
        <p className="text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} HapiControl — Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}
