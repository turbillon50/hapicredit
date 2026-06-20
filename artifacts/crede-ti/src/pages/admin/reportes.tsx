import React from "react";
import { IconCartera, IconMoneda, IconAlerta, IconBandeja, IconGrupo, IconGrafica } from "@/components/hapi/HapiIcons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import * as XLSX from "xlsx";

const API  = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("credeti_token")}`, "Content-Type": "application/json" });

function fmt(n: number | string | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(Number(n));
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

type Report = "cartera-activa" | "cobranza" | "morosos" | "solicitudes" | "comisiones" | "flujo-caja" | "cartera-riesgo";

const REPORTS: { id: Report; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "cartera-activa",  label: "Cartera activa",      icon: <IconCartera size={18} />,  desc: "Todos los créditos vigentes con saldos y próximos pagos" },
  { id: "cobranza",        label: "Cobranza del período", icon: <IconMoneda size={18} />,   desc: "Pagos recibidos en el rango de fechas seleccionado" },
  { id: "morosos",         label: "Morosos",              icon: <IconAlerta size={18} />,   desc: "Clientes con pagos vencidos o en riesgo" },
  { id: "solicitudes",     label: "Solicitudes",          icon: <IconBandeja size={18} />,  desc: "Todas las solicitudes con su estado actual" },
  { id: "comisiones",      label: "Comisiones por asesor",icon: <IconGrupo size={18} />,    desc: "Cartera y cobranza desglosada por asesor" },
  { id: "flujo-caja",      label: "Flujo de caja",        icon: <IconGrafica size={18} />,  desc: "Entradas vs salidas y proyección semanal" },
  { id: "cartera-riesgo",  label: "Cartera en riesgo",    icon: <IconAlerta size={18} />,   desc: "Clientes con alertas activas o estatus crítico" },
];

function downloadExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`; a.click();
}

// ── Tablas por reporte ─────────────────────────────────────────────────────
function TableCartera({ data }: { data: any[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
          {["Cliente","Teléfono","Asesor","Monto","Saldo","Pago/sem","Pagos","Plazo","Vence","Estado"].map(h => (
            <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
            <td style={{ padding: "10px", fontWeight: 600 }}>{r.client_name}</td>
            <td style={{ padding: "10px", color: "var(--text-muted)" }}>{r.client_phone}</td>
            <td style={{ padding: "10px", color: "var(--text-muted)" }}>{r.executive_name ?? "—"}</td>
            <td style={{ padding: "10px" }}>{fmt(r.amount)}</td>
            <td style={{ padding: "10px", fontWeight: 700, color: "#215DFF" }}>{fmt(r.remaining_balance)}</td>
            <td style={{ padding: "10px" }}>{fmt(r.weekly_payment)}</td>
            <td style={{ padding: "10px", textAlign: "center" }}>{r.payments_made}/{r.total_weeks}</td>
            <td style={{ padding: "10px", textAlign: "center" }}>{r.total_weeks} sem</td>
            <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{fmtDate(r.disbursement_date)}</td>
            <td style={{ padding: "10px" }}>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                background: r.status === "active" ? "var(--surface-3)" : "var(--surface-3)",
                color: r.status === "active" ? "#166534" : "var(--text-secondary)" }}>
                {r.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableCobranza({ data }: { data: any[] }) {
  const total = data.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  return (
    <>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total cobrado</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>{fmt(total)}</div>
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pagos</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{data.length}</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
            {["Fecha","Cliente","Asesor","Monto","Esperado","Mora","Estado","Crédito"].map(h => (
              <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
              <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{fmtDate(r.payment_date)}</td>
              <td style={{ padding: "10px", fontWeight: 600 }}>{r.client_name}</td>
              <td style={{ padding: "10px", color: "var(--text-muted)" }}>{r.executive_name ?? "—"}</td>
              <td style={{ padding: "10px", fontWeight: 700, color: "#059669" }}>{fmt(r.amount_paid)}</td>
              <td style={{ padding: "10px", color: "var(--text-muted)" }}>{fmt(r.amount_expected)}</td>
              <td style={{ padding: "10px", color: "#B91C1C" }}>{r.late_fee > 0 ? fmt(r.late_fee) : "—"}</td>
              <td style={{ padding: "10px" }}>
                <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: r.payment_status === "on_time" ? "var(--surface-3)" : r.payment_status === "late" ? "var(--surface-3)" : "#f3f4f6",
                  color: r.payment_status === "on_time" ? "#166534" : r.payment_status === "late" ? "var(--text-secondary)" : "var(--text-primary)" }}>
                  {r.payment_status === "on_time" ? "Puntual" : r.payment_status === "late" ? "Con mora" : r.payment_status}
                </span>
              </td>
              <td style={{ padding: "10px", color: "var(--text-muted)" }}>#{r.credit_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TableGeneric({ data }: { data: any[] }) {
  if (!data.length) return <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Sin datos</div>;
  const keys = Object.keys(data[0]);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
          {keys.map(k => (
            <th key={k} style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {k.replace(/_/g, " ")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
            {keys.map(k => (
              <td key={k} style={{ padding: "10px" }}>
                {r[k] == null ? "—" : typeof r[k] === "number" && (k.includes("amount") || k.includes("balance") || k.includes("payment") || k.includes("placed") || k.includes("collected") || k.includes("fee"))
                  ? fmt(r[k]) : String(r[k])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FlujoCaja({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[
          { label: "Desembolsado", val: data.disbursed, color: "#B91C1C" },
          { label: "Cobrado", val: data.collected, color: "#059669" },
          { label: "Pend. validar", val: data.pendingValidation, color: "#d97706" },
          { label: "Flujo neto", val: data.netFlow, color: data.netFlow >= 0 ? "#059669" : "#B91C1C" },
        ].map(item => (
          <div key={item.label} style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{fmt(item.val)}</div>
          </div>
        ))}
      </div>
      {data.weeklyProjection?.length > 0 && (
        <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Proyección próximas 4 semanas</div>
          {data.weeklyProjection.map((w: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Semana {i + 1} ({fmtDate(w.week_start)})</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{fmt(w.expected)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReportes() {
  const [selected, setSelected]   = useState<Report | null>(null);
  const [dateFrom, setDateFrom]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo]       = useState(() => new Date().toISOString().split("T")[0]);
  const [clientId, setClientId]   = useState("");

  const queryKey = selected === "flujo-caja" || selected === "cartera-activa" || selected === "morosos" || selected === "cartera-riesgo"
    ? [selected]
    : selected === "estado-cuenta" ? [selected, clientId]
    : [selected, dateFrom, dateTo];

  const url = selected === "flujo-caja" ? `${API}/reports/flujo-caja?from=${dateFrom}&to=${dateTo}`
    : selected === "cartera-activa"  ? `${API}/reports/cartera-activa`
    : selected === "morosos"         ? `${API}/reports/morosos`
    : selected === "cartera-riesgo"  ? `${API}/reports/cartera-riesgo`
    : selected === "cobranza"        ? `${API}/reports/cobranza?from=${dateFrom}&to=${dateTo}`
    : selected === "solicitudes"     ? `${API}/reports/solicitudes?from=${dateFrom}&to=${dateTo}`
    : selected === "comisiones"      ? `${API}/reports/comisiones?from=${dateFrom}&to=${dateTo}`
    : null;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!url) throw new Error("sin url");
      const r = await fetch(url, { headers: auth() });
      return r.json();
    },
    enabled: !!selected && !!url,
    staleTime: 0,
  });

  const info = REPORTS.find(r => r.id === selected);
  const isDateRange = selected && !["cartera-activa","morosos","cartera-riesgo"].includes(selected);
  const tableData = Array.isArray(data) ? data : [];

  return (
    <Layout title="Reportes">
      <div style={{ padding: "0 0 100px" }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>Reportes</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Genera y exporta reportes en tiempo real</div>
        </div>

        {/* Selector de reporte */}
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {REPORTS.map(r => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: "var(--r-xl)", border: "none",
                background: selected === r.id ? "var(--brand-blue)" : "var(--surface)",
                color: selected === r.id ? "#fff" : "var(--text-primary)",
                textAlign: "left", cursor: "pointer",
                boxShadow: selected === r.id ? "0 4px 16px rgba(33,93,255,0.3)" : "none",
              }}>
              <span style={{ fontSize: 20, minWidth: 28 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Panel de reporte */}
        {selected && (
          <div style={{ padding: "16px" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
              {/* Filtros */}
              <div style={{ padding: "16px 16px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, flex: 1 }}>{info?.icon} {info?.label}</div>
                {isDateRange && (
                  <>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="input-field" style={{ fontSize: 13, padding: "6px 10px" }} />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="input-field" style={{ fontSize: 13, padding: "6px 10px" }} />
                  </>
                )}
                {!isLoading && tableData.length > 0 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => downloadExcel(tableData, selected!)}
                      style={{ padding: "6px 14px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", background: "var(--surface-2)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Excel
                    </button>
                    <button onClick={() => window.print()}
                      style={{ padding: "6px 14px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", background: "var(--surface-2)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Imprimir
                    </button>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div style={{ padding: 16, overflowX: "auto" }}>
                {isLoading && <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</div>}
                {error && <div style={{ padding: 16, color: "#B91C1C", fontSize: 13 }}>Error al cargar el reporte</div>}
                {!isLoading && !error && data && (
                  selected === "cartera-activa"  ? <TableCartera data={tableData} /> :
                  selected === "cobranza"        ? <TableCobranza data={tableData} /> :
                  selected === "flujo-caja"      ? <FlujoCaja data={data} /> :
                  <TableGeneric data={tableData} />
                )}
                {!isLoading && !error && tableData.length === 0 && selected !== "flujo-caja" && (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Sin datos para el período seleccionado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
