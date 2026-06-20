import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchCalcConfig() {
  const r = await fetch("/api/config/public");
  if (!r.ok) throw new Error("cfg");
  return r.json() as Promise<Record<string, string>>;
}

import { motion, AnimatePresence } from "framer-motion";

// ─── Reglas de negocio ────────────────────────────────────────────────────────
type ClienteType = "nuevo" | "existente";

function calcular(monto: number, plazo: number, tipo: ClienteType, tasaNuevo = 30, tasaExist = 5, plazoNuevo = 4) {
  // nuevo: plazo fijo, interés % plano
  // existente: plazo N semanas, tasa % mensual × meses
  const interes = tipo === "nuevo"
    ? monto * (tasaNuevo / 100)
    : monto * (tasaExist / 100) * (plazo / 4);
  const total = monto + interes;
  const pago  = total / (tipo === "nuevo" ? plazoNuevo : plazo);
  return { interes, total, pago };
}

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── Colores ──────────────────────────────────────────────────────────────────
const AZUL   = "#215DFF";
const AZUL2  = "#0A2E8A";
const AMARILLO = "#19D7D7";
const VERDE  = "var(--success)";

// ─── Componentes pequeños ─────────────────────────────────────────────────────
function SliderCampo({
  label, valor, min, max, paso, prefijo = "", sufijo = "", onChange,
}: {
  label: string; valor: number; min: number; max: number; paso: number;
  prefijo?: string; sufijo?: string; onChange: (v: number) => void;
}) {
  const pct = ((valor - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-end" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
        <motion.span
          key={valor}
          initial={{ scale: 1.15, color: AZUL }}
          animate={{ scale: 1, color: AZUL2 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 20, fontWeight: 900, display: "inline-block" }}
        >
          {prefijo}{typeof valor === "number" && paso < 1
            ? valor.toFixed(1)
            : valor.toLocaleString("es-MX")}{sufijo}
        </motion.span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 99, background: "var(--border)" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${AZUL}, ${AMARILLO})`,
          transition: "width 0.15s",
        }} />
        <input
          type="range" min={min} max={max} step={paso} value={valor}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{prefijo}{min.toLocaleString("es-MX")}{sufijo}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{prefijo}{max.toLocaleString("es-MX")}{sufijo}</span>
      </div>
    </div>
  );
}

function NumAnimado({ valor, fmt: fmtFn }: { valor: number; fmt: (n: number) => string }) {
  return (
    <motion.span
      key={Math.round(valor * 100)}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: "inline-block" }}
    >
      {fmtFn(valor)}
    </motion.span>
  );
}

function FilaResultado({
  etiqueta, valor, grande = false, color,
}: { etiqueta: string; valor: string; grande?: boolean; color?: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: "1px solid #f3f4f6",
    }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{etiqueta}</span>
      <motion.span
        key={valor}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontSize: grande ? 20 : 15, fontWeight: grande ? 900 : 700,
          color: color ?? (grande ? AZUL2 : "var(--text-primary)"),
        }}
      >
        {valor}
      </motion.span>
    </div>
  );
}

// ─── Tarjeta de info del 5% mensual ──────────────────────────────────────────
function InfoTasa({ semanas, monto, tasaEfectiva, interes }: {
  semanas: number; monto: number; tasaEfectiva: number; interes: number;
}) {
  const mesesEquiv = (semanas / 4).toFixed(1);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg,var(--surface-3),rgba(33,93,255,0.10))",
        border: "1px solid var(--surface-3)", borderRadius: "var(--r-xl)",
        padding: "18px 20px", marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: AZUL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 16 }}>%</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, color: AZUL2 }}>¿Cómo se calcula tu interés?</span>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7 }}>
        <p style={{ margin: "0 0 8px" }}>
          credeti cobra <strong>5% mensual</strong>. Solo pagas la parte proporcional
          al número de semanas de tu crédito:
        </p>

        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "12px 14px",
          border: "1px solid var(--surface-3)", fontFamily: "monospace",
          fontSize: 12, color: "var(--brand-blue)", lineHeight: 2,
        }}>
          <div>Meses equiv. = {semanas} sem ÷ 4 sem/mes = {mesesEquiv} meses</div>
          <div>Tasa = 5% × {mesesEquiv} = <NumAnimado valor={tasaEfectiva} fmt={fmtPct} /></div>
          <div style={{ borderTop: "1px solid var(--surface-3)", marginTop: 6, paddingTop: 6 }}>
            Interés = {fmt(monto)} × {fmtPct(tasaEfectiva)} = <NumAnimado valor={interes} fmt={fmt} />
          </div>
        </div>

        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
          A menor plazo → menos interés total. A mayor plazo → pago semanal más accesible.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Barra de progreso de interés ─────────────────────────────────────────────
function BarraProporciones({ monto, interes }: { monto: number; interes: number }) {
  const total = monto + interes;
  const pctCapital = (monto / total) * 100;
  const pctInteres = (interes / total) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Composición del total</span>
      </div>
      <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", gap: 2 }}>
        <motion.div
          animate={{ width: `${pctCapital}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ background: AZUL, borderRadius: "99px 0 0 99px" }}
        />
        <motion.div
          animate={{ width: `${pctInteres}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ background: AMARILLO, borderRadius: "0 99px 99px 0" }}
        />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: AZUL }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Capital {fmtPct(pctCapital)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: AMARILLO }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Interés {fmtPct(pctInteres)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tabla de amortización ────────────────────────────────────────────────────
function TablaAmort({ pago, total, periodos, etiqueta }: { pago: number; total: number; periodos: number; etiqueta: string }) {
  const filas = Math.min(periodos, 5);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {[etiqueta, "Pago", "Saldo restante"].map(h => (
              <th key={h} style={{ textAlign: "right", padding: "6px 4px", fontWeight: 700, color: "var(--text-muted)", borderBottom: "2px solid #f3f4f6", fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: filas }).map((_, i) => {
            const saldo = Math.max(0, total - pago * (i + 1));
            const esUltima = i + 1 === periodos;
            return (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ textAlign: "right", padding: "9px 4px", borderBottom: "1px solid #f9fafb", color: "var(--text-primary)", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ textAlign: "right", padding: "9px 4px", borderBottom: "1px solid #f9fafb", color: AZUL, fontWeight: 700 }}>{fmt(pago)}</td>
                <td style={{ textAlign: "right", padding: "9px 4px", borderBottom: "1px solid #f9fafb", color: esUltima || saldo < 0.01 ? VERDE : "var(--text-primary)", fontWeight: esUltima ? 700 : 400 }}>
                  {saldo < 0.01 ? "✓ Liquidado" : fmt(saldo)}
                </td>
              </motion.tr>
            );
          })}
          {periodos > 5 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "10px 4px", fontSize: 12, color: "var(--text-muted)" }}>
                ··· y {periodos - 5} {etiqueta.toLowerCase()}s más al mismo pago de {fmt(pago)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Calculadora() {
  const [tipo, setTipo]   = useState<ClienteType>("existente");
  const { data: cfgRaw } = useQuery({ queryKey: ["calc-config"], queryFn: fetchCalcConfig, staleTime: 60_000 });
  const c = cfgRaw ?? {};

  // Dynamic config — fall back to hardcoded defaults if API not ready
  const nuevoMin      = Number(c.calc_nuevo_min)          || 500;
  const nuevoMax      = Number(c.calc_nuevo_max)          || 2000;
  const nuevoPlazo    = Number(c.calc_nuevo_plazo)        || 4;
  const nuevoTasa     = Number(c.calc_nuevo_tasa)         || 30;
  const existMin      = Number(c.calc_exist_min)          || 1000;
  const existMax      = Number(c.calc_exist_max)          || 30000;
  const existPlazoMin = Number(c.calc_exist_plazo_min)    || 4;
  const existPlazoMax = Number(c.calc_exist_plazo_max)    || 48;
  const existTasa     = Number(c.calc_exist_tasa_mensual) || 5;

  const [monto, setMonto] = useState(5000);
  const [semanas, setSemanas] = useState(12);

  const montoMin   = tipo === "nuevo" ? nuevoMin  : existMin;
  const montoMax   = tipo === "nuevo" ? nuevoMax  : existMax;
  const semanasMax = existPlazoMax;

  function cambiarTipo(t: ClienteType) {
    setTipo(t);
    if (t === "nuevo") setMonto(750);
    else               { setMonto(Math.round((existMin + existMax) / 2 / 500) * 500); setSemanas(existPlazoMin + Math.round((existPlazoMax - existPlazoMin) / 3)); }
  }

  const { interes, total, pago } = useMemo(
    () => calcular(monto, semanas, tipo),
    [monto, semanas, tipo],
  );

  const tasaEfectiva = tipo === "nuevo" ? nuevoTasa : existTasa * (semanas / 4);

  return (
    <div style={{
      minHeight: "100dvh",
      background: `linear-gradient(150deg, #06143B 0%, ${AZUL} 55%, ${AMARILLO} 100%)`,
      fontFamily: "Montserrat, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 40,
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "env(safe-area-inset-top,20px) 20px 0", maxWidth: 460, margin: "0 auto" }}>
        <button
          onClick={() => history.back()}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", padding: "12px 0", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
        >
          ← Regresar
        </button>
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}
        >
          Calculadora de crédito
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ margin: "4px 0 20px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}
        >
          Simula tu crédito sin compromiso
        </motion.p>
      </div>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 16px" }}>

        {/* ── Toggle tipo ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: 8, marginBottom: 12, boxShadow: "var(--shadow-md)" }}
        >
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: 4, gap: 4 }}>
            {(["nuevo", "existente"] as ClienteType[]).map(t => (
              <button
                key={t}
                onClick={() => cambiarTipo(t)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: "var(--r-lg)", border: "none",
                  cursor: "pointer", fontWeight: 700, fontSize: 14, position: "relative",
                  background: "transparent", color: tipo === t ? "#fff" : "var(--text-muted)",
                  transition: "color 0.2s",
                }}
              >
                {tipo === t && (
                  <motion.div
                    layoutId="tab-bg"
                    style={{ position: "absolute", inset: 0, borderRadius: "var(--r-lg)", background: AZUL, zIndex: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {t === "nuevo" ? "Cliente nuevo" : "Cliente frecuente"}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Sliders ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "24px 20px 16px", marginBottom: 12, boxShadow: "var(--shadow-md)" }}
        >
          <SliderCampo
            label="Monto del crédito"
            valor={monto} min={montoMin} max={montoMax}
            paso={tipo === "nuevo" ? Math.max(50, Math.round((nuevoMax - nuevoMin) / 20)) : 500}
            prefijo="$" onChange={setMonto}
          />
          {tipo === "existente" ? (
            <SliderCampo
              label="Plazo (semanas)"
              valor={semanas} min={4} max={semanasMax}
              paso={1} sufijo=" sem"
              onChange={setSemanas}
            />
          ) : (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Plazo</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: AZUL2 }}>{nuevoPlazo} semanas</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: `linear-gradient(90deg, ${AZUL}, ${AMARILLO})` }} />
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Plazo fijo para primer crédito</div>
            </div>
          )}

          {/* Badge de tasa */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tipo}-${semanas}-badge`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: tipo === "nuevo" ? "var(--surface-3)" : "var(--surface-3)",
                border: `1px solid ${tipo === "nuevo" ? "var(--surface-3)" : "var(--surface-3)"}`,
                borderRadius: "var(--r-lg)", padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: 13, color: tipo === "nuevo" ? "var(--success)" : "var(--brand-blue)", fontWeight: 600 }}>
                {tipo === "nuevo" ? "Interés fijo (30% único)" : `Tasa efectiva (5% mensual)`}
              </span>
              <span style={{ fontSize: 17, fontWeight: 900, color: tipo === "nuevo" ? "var(--success)" : AZUL }}>
                <NumAnimado valor={tasaEfectiva} fmt={fmtPct} />
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Explicación 60% (solo cliente frecuente) ── */}
        <AnimatePresence>
          {tipo === "existente" && (
            <motion.div
              key="info-tasa"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InfoTasa semanas={semanas} monto={monto} tasaEfectiva={tasaEfectiva} interes={interes} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Resultados ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "20px 20px 12px", marginBottom: 12, boxShadow: "var(--shadow-md)" }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Resumen
          </p>
          <BarraProporciones monto={monto} interes={interes} />
          <FilaResultado etiqueta="Capital prestado" valor={fmt(monto)} />
          <FilaResultado etiqueta="Intereses totales" valor={fmt(interes)} color="var(--warning)" />
          <FilaResultado etiqueta="Plazo" valor={tipo === "nuevo" ? "4 semanas (30 días)" : `${semanas} semanas`} />
          <FilaResultado etiqueta="Pago semanal" valor={fmt(pago)} color={AZUL} />
          <FilaResultado etiqueta="Total a pagar" valor={fmt(total)} grande color={AZUL2} />
        </motion.div>

        {/* ── Tabla de amortización ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "20px 20px 16px", marginBottom: 16, boxShadow: "var(--shadow-md)" }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Calendario de pagos
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={`${semanas}-${pago}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <TablaAmort pago={pago} total={total} periodos={tipo === "nuevo" ? 4 : semanas} etiqueta="Semana" />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── CTA ── */}
        <motion.a
          href="/solicitar"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          style={{
            display: "block", width: "100%", padding: "17px 0",
            background: AMARILLO, color: AZUL2,
            borderRadius: "var(--r-lg)", border: "none", cursor: "pointer",
            fontWeight: 900, fontSize: 17, textAlign: "center",
            textDecoration: "none", boxSizing: "border-box",
            boxShadow: "var(--shadow-md)",
          }}
        >
          Solicitar {fmt(monto)} →
        </motion.a>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 14, lineHeight: 1.6 }}>
          Cálculo estimado. El crédito final queda sujeto a aprobación.<br />
          Sin comisión por apertura · 5% mensual · Hasta 48 semanas
        </p>
      </div>
    </div>
  );
}
