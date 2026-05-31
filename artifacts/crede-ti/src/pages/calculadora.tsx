import { useState, useMemo } from "react";

// ─── Reglas de negocio (espejo de api-server/routes/credits.ts) ───────────────
// Clientes nuevos:     $500–$1,000 | 4 semanas fijas | 30% interés plano
// Clientes existentes: $1,000–$30,000 | 4–48 semanas  | 60% TAN pro-rata
// ─────────────────────────────────────────────────────────────────────────────

type ClienteType = "nuevo" | "existente";

function calcular(monto: number, semanas: number, tipo: ClienteType) {
  const interes =
    tipo === "nuevo"
      ? monto * 0.30
      : monto * 0.60 * (semanas / 52);
  const total = monto + interes;
  const pago = total / semanas;
  return { interes, total, pago };
}

// ─── Slider + input sincronizados ─────────────────────────────────────────────
function Campo({
  label, valor, min, max, paso, prefijo = "", sufijo = "",
  onChange,
}: {
  label: string; valor: number; min: number; max: number; paso: number;
  prefijo?: string; sufijo?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>
          {prefijo}
          <input
            type="number"
            min={min}
            max={max}
            step={paso}
            value={valor}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            style={inputNumStyle}
          />
          {sufijo}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#2A3CD6", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={rangeLabel}>{prefijo}{min.toLocaleString("es-MX")}{sufijo}</span>
        <span style={rangeLabel}>{prefijo}{max.toLocaleString("es-MX")}{sufijo}</span>
      </div>
    </div>
  );
}

// ─── Fila de resultado ────────────────────────────────────────────────────────
function Fila({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: 14, color: "#6b7280" }}>{etiqueta}</span>
      <span style={{ fontSize: destacado ? 18 : 15, fontWeight: destacado ? 800 : 600, color: destacado ? "#15206E" : "#111" }}>
        {valor}
      </span>
    </div>
  );
}

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

// ─── Estilos ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  boxShadow: "0 4px 24px rgba(21,32,110,0.1)",
  padding: 24,
  marginBottom: 16,
};
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151" };
const valueStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#15206E", display: "flex", alignItems: "center", gap: 2 };
const inputNumStyle: React.CSSProperties = {
  border: "none", outline: "none", background: "transparent",
  fontSize: 13, fontWeight: 700, color: "#15206E",
  width: 72, textAlign: "right", padding: 0,
};
const rangeLabel: React.CSSProperties = { fontSize: 11, color: "#9ca3af" };
const toggleBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
  fontWeight: 700, fontSize: 14, transition: "all 0.15s",
  background: active ? "#2A3CD6" : "transparent",
  color: active ? "#fff" : "#6b7280",
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Calculadora() {
  const [tipo, setTipo] = useState<ClienteType>("existente");
  const [monto, setMonto] = useState(5000);
  const [semanas, setSemanas] = useState(12);

  const montoMin  = tipo === "nuevo" ? 500  : 1000;
  const montoMax  = tipo === "nuevo" ? 1000 : 30000;
  const semMin    = 4;
  const semMax    = tipo === "nuevo" ? 4 : 48;

  // Ajustar cuando cambia tipo
  function cambiarTipo(t: ClienteType) {
    setTipo(t);
    if (t === "nuevo") { setMonto(750); setSemanas(4); }
    else               { setMonto(5000); setSemanas(12); }
  }

  const { interes, total, pago } = useMemo(
    () => calcular(monto, semanas, tipo),
    [monto, semanas, tipo]
  );

  const tasaEfectiva = tipo === "nuevo"
    ? 30
    : parseFloat((0.60 * (semanas / 52) * 100).toFixed(1));

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#15206E 0%,#2A3CD6 55%,#3F51E6 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "env(safe-area-inset-top, 24px) 16px 32px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 440, marginBottom: 20, color: "#fff" }}>
        <button
          onClick={() => history.back()}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "4px 0 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}
        >
          ← Regresar
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em" }}>
          Calculadora de crédito
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          Simula tu crédito antes de solicitarlo
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Toggle tipo de cliente */}
        <div style={{ ...card, padding: 8 }}>
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 14, padding: 4, gap: 4 }}>
            <button style={toggleBtn(tipo === "nuevo")} onClick={() => cambiarTipo("nuevo")}>
              Cliente nuevo
            </button>
            <button style={toggleBtn(tipo === "existente")} onClick={() => cambiarTipo("existente")}>
              Cliente frecuente
            </button>
          </div>
        </div>

        {/* Controles */}
        <div style={card}>
          <Campo
            label="Monto del crédito"
            valor={monto}
            min={montoMin}
            max={montoMax}
            paso={tipo === "nuevo" ? 50 : 500}
            prefijo="$"
            onChange={setMonto}
          />
          <Campo
            label="Plazo"
            valor={semanas}
            min={semMin}
            max={semMax}
            paso={1}
            sufijo=" sem."
            onChange={setSemanas}
          />

          {/* Indicador de tasa */}
          <div style={{
            background: "rgba(42,60,214,0.07)", borderRadius: 12,
            padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: "#374151" }}>
              {tipo === "nuevo" ? "Interés plano" : "TAN (pro-rata del 60% anual)"}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#2A3CD6" }}>
              {tasaEfectiva}%
            </span>
          </div>
        </div>

        {/* Resultados */}
        <div style={card}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
            Resumen del crédito
          </p>
          <Fila etiqueta="Capital prestado"   valor={fmt(monto)} />
          <Fila etiqueta="Intereses"           valor={fmt(interes)} />
          <Fila etiqueta="Duración"            valor={`${semanas} semanas`} />
          <Fila etiqueta="Pago semanal"        valor={fmt(pago)} />
          <Fila etiqueta="Total a pagar"       valor={fmt(total)} destacado />
        </div>

        {/* Tabla de amortización simplificada */}
        <div style={card}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
            Tabla de pagos (primeras 4 semanas)
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#6b7280" }}>
                  {["Semana", "Pago", "Saldo restante"].map(h => (
                    <th key={h} style={{ textAlign: "right", padding: "6px 4px", fontWeight: 600, borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.min(semanas, 4) }).map((_, i) => {
                  const saldo = total - pago * (i + 1);
                  return (
                    <tr key={i}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}>{fmt(pago)}</td>
                      <td style={{ ...tdStyle, color: saldo <= 0.01 ? "#16a34a" : "#111" }}>
                        {saldo <= 0.01 ? "✓ Liquidado" : fmt(Math.max(0, saldo))}
                      </td>
                    </tr>
                  );
                })}
                {semanas > 4 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "8px 4px", fontSize: 12, color: "#9ca3af" }}>
                      …y {semanas - 4} semanas más al mismo pago
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <a
          href="/solicitar"
          style={{
            display: "block", width: "100%", padding: "16px 0",
            background: "#F0A93A", color: "#15206E",
            borderRadius: 16, border: "none", cursor: "pointer",
            fontWeight: 800, fontSize: 16, textAlign: "center",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(240,169,58,0.4)",
            boxSizing: "border-box",
          }}
        >
          Solicitar este crédito →
        </a>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>
          Cálculo estimado. El crédito final queda sujeto a aprobación.
        </p>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  textAlign: "right", padding: "8px 4px",
  borderBottom: "1px solid #f9fafb", color: "#111",
};
