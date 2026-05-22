import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useCreateClient } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { IconPersonaMas } from "@/components/hapi/HapiIcons";

const fields = [
  { key: "fullName",        label: "Nombre completo",   type: "text",   required: true, ph: "Ej. María García López" },
  { key: "phone",           label: "Teléfono",          type: "tel",    required: true, ph: "10 dígitos" },
  { key: "altPhone",        label: "Tel. alternativo",  type: "tel",    required: false, ph: "Opcional" },
  { key: "curp",            label: "CURP",              type: "text",   required: false, ph: "XXXX000000XXXXXX00" },
];

const guarantorFields = [
  { key: "guarantorName",  label: "Nombre del aval",   type: "text",   required: false, ph: "Nombre completo" },
  { key: "guarantorPhone", label: "Teléfono del aval",  type: "tel",   required: false, ph: "10 dígitos" },
];

export default function ExecutiveClientNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const createClient = useCreateClient();

  const [form, setForm] = useState({
    fullName: "", phone: "", altPhone: "", address: "",
    curp: "", guarantorName: "", guarantorPhone: "", internalNotes: ""
  });

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = await createClient.mutateAsync({ data: { ...form, executiveId: user?.id } });
      toast({ title: "Cliente registrado correctamente" });
      setLocation(`/clients/${client.id}`);
    } catch {
      toast({ title: "No se pudo registrar el cliente", variant: "destructive" });
    }
  };

  return (
    <Layout title="Nuevo Cliente" back="/clients">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Datos personales</p>
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground/75">{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</label>
              <input
                type={f.type}
                required={f.required}
                placeholder={f.ph}
                className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                value={(form as any)[f.key]}
                onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground/75">Domicilio</label>
            <textarea
              placeholder="Calle, colonia, municipio"
              className="w-full h-20 px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              value={form.address}
              onChange={e => set("address", e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aval / Obligado solidario</p>
          {guarantorFields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground/75">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.ph}
                className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                value={(form as any)[f.key]}
                onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Notas internas</p>
          <textarea
            placeholder="Observaciones relevantes del cliente..."
            className="w-full h-20 px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
            value={form.internalNotes}
            onChange={e => set("internalNotes", e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={createClient.isPending}
          className="w-full h-12 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #1B5FBC, #2978D9)" }}
        >
          <IconPersonaMas size={20} color="#fff" />
          {createClient.isPending ? "Registrando..." : "Registrar cliente"}
        </button>
      </form>
    </Layout>
  );
}
