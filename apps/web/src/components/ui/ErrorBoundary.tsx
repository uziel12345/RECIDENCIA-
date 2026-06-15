import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#7c2d12 100%)",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
              Algo salió mal
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#94a3b8" }}>
              {this.state.message || "Error inesperado al cargar esta sección."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                background: "#ea580c",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

