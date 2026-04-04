import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RiBankCardLine, RiShieldCheckLine, RiSmartphoneLine, RiWhatsappLine } from "react-icons/ri";
import { useCreatePublicRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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
      await createRequest.mutateAsync({
        data: { name, phone, email, message }
      });
      toast({ title: "Mensaje enviado", description: "Nos pondremos en contacto pronto." });
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast({ title: "Error al enviar mensaje", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-primary">
          <RiBankCardLine className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">HapiControl</span>
        </div>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Portal Login
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="px-6 py-16 md:py-24 text-center space-y-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 shadow-sm">
            Tu confianza nos respalda
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-2xl mx-auto">
            Control financiero <span className="text-primary">ágil y seguro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            HapiControl gestiona y administra operaciones de microcrédito con transparencia, tecnología móvil y seguridad bancaria.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
            <Button size="lg" className="rounded-full px-8 bg-success hover:bg-success/90 text-success-foreground h-12 text-base">
              <RiWhatsappLine className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Contáctanos
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card px-6 py-20 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">¿Por qué elegirnos?</h2>
              <p className="text-muted-foreground mt-2">Tecnología de punta para operaciones financieras.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <RiSmartphoneLine className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">Control Móvil</h3>
                <p className="text-muted-foreground leading-relaxed">Accede a tu estado de cuenta desde cualquier dispositivo en tiempo real. Gestión al alcance de tu mano.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <RiShieldCheckLine className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">Transparencia Total</h3>
                <p className="text-muted-foreground leading-relaxed">Sin cargos ocultos. Conoce exactamente cuánto y cuándo pagar con absoluta claridad.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <RiBankCardLine className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">Pagos Flexibles</h3>
                <p className="text-muted-foreground leading-relaxed">Múltiples opciones de pago adaptadas a los flujos de efectivo de tu negocio o actividad.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="px-6 py-20 bg-muted/30">
          <div className="max-w-xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-border">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Ponte en contacto</h2>
              <p className="text-muted-foreground mt-1 text-sm">Déjanos tus datos y un asesor se comunicará contigo.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} required type="tel" placeholder="10 dígitos" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo electrónico</label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="¿En qué podemos ayudarte?" className="min-h-[100px]" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={createRequest.isPending}>
                {createRequest.isPending ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border bg-card">
        <p>&copy; {new Date().getFullYear()} HapiControl. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
