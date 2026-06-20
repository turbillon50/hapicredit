import { Component, type ReactNode } from "react";

interface State { error: Error | null; }

// App-level boundary so a single component throwing doesn't leave the user
// staring at a blank cream page. Renders a minimal recovery card with the
// error message and a "Recargar" button. Also dumps the stack to console so
// it shows up in Vercel runtime logs / iOS Safari console.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] crash:", error, info.componentStack);
  }

  reset = () => {
    try { localStorage.clear(); } catch { /* ignore */ }
    window.location.href = "/";
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100dvh",
        padding: "max(24px, env(safe-area-inset-top)) 24px 24px",
        background: "#f7f5f0",
        fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          maxWidth: 360, width: "100%",
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: 22,
          boxShadow: "var(--shadow-lg)",
          border: "1px solid #e8e4dc",
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#19D7D7", textTransform: "uppercase", marginBottom: 8 }}>
            ● credeti
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#215DFF", marginBottom: 8 }}>
            Algo se atoró
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
            La app tuvo un error al cargar. Casi siempre se arregla recargando.
          </div>
          {this.state.error.message && (
            <pre style={{
              background: "#f8fafc", border: "1px solid var(--border)",
              borderRadius: "var(--r-md)", padding: "10px 12px",
              fontSize: 11, color: "var(--text-secondary)",
              maxHeight: 140, overflow: "auto", marginBottom: 16,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{this.state.error.message}</pre>
          )}
          <button onClick={this.reset}
            style={{
              width: "100%", padding: "12px 16px",
              background: "#215DFF", color: "#fff",
              border: "none", borderRadius: "var(--r-lg)",
              fontWeight: 800, fontSize: 14, cursor: "pointer",
            }}>
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
