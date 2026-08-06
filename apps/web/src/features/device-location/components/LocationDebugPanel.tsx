import { useState, type CSSProperties } from "react";
import { useDeviceLocation } from "../hooks/useDeviceLocation";

const PANEL_STYLE: CSSProperties = {
  position: "absolute",
  top: 116,
  right: 16,
  zIndex: 70,
  width: "min(360px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 132px)",
  overflowY: "auto",
  padding: 14,
  border: "1px solid rgba(148, 163, 184, 0.45)",
  borderRadius: 14,
  background: "rgba(15, 23, 42, 0.94)",
  color: "#e2e8f0",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.28)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  lineHeight: 1.45,
};

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(110px, auto) 1fr",
  gap: "4px 10px",
  marginTop: 10,
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid #64748b",
  borderRadius: 8,
  background: "#1e293b",
  color: "#f8fafc",
  padding: "7px 9px",
  cursor: "pointer",
  fontSize: 11,
};

function formatNumber(value: number | null | undefined, digits = 3) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "—";
}

function formatDate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value).toLocaleString("es-MX")
    : "—";
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ overflowWrap: "anywhere" }}>{value}</span>
    </>
  );
}

type LocationDebugPanelProps = {
  defaultCollapsed?: boolean;
};

export function LocationDebugPanel({
  defaultCollapsed = false,
}: LocationDebugPanelProps) {
  const location = useDeviceLocation();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isRequestingPermission =
    location.status === "requesting-permission";

  const copyCurrentData = async () => {
    if (!navigator.clipboard) {
      setCopyStatus("Portapapeles no disponible.");
      return;
    }
    const snapshot = {
      status: location.status,
      permission: location.permission,
      isTracking: location.isTracking,
      rawPosition: location.rawPosition,
      filteredPosition: location.filteredPosition,
      localPosition: location.localPosition,
      campusPosition: location.campusPosition,
      accuracyQuality: location.accuracyQuality,
      lastUpdateAt: location.lastUpdateAt,
      calibration: {
        status: location.calibrationStatus,
        message: location.calibrationMessage,
        scaleModelUnitsPerMeter: location.calibrationScale,
        rotationRadians: location.calibrationRotationRadians,
      },
      filter: {
        reason: location.lastFilterReason,
        estimatedSpeedMetersPerSecond:
          location.estimatedSpeedMetersPerSecond,
      },
      errorMessage: location.errorMessage,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopyStatus("Datos copiados.");
    } catch {
      setCopyStatus("No fue posible copiar los datos.");
    }
  };

  const raw = location.rawPosition;

  if (collapsed) {
    return (
      <button
        type="button"
        className="ito-location-debug-launcher"
        onClick={() => setCollapsed(false)}
        aria-expanded="false"
      >
        <span aria-hidden="true">⌖</span>
        Calibrar GPS
      </button>
    );
  }

  return (
    <aside
      className="ito-location-debug-panel"
      style={PANEL_STYLE}
      aria-label="Depuración de ubicación del dispositivo"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>GPS del dispositivo · v2</div>
        <button
          type="button"
          style={{ ...BUTTON_STYLE, padding: "4px 8px" }}
          onClick={() => setCollapsed(true)}
          aria-label="Minimizar panel de calibración GPS"
          title="Minimizar"
        >
          —
        </button>
      </div>
      <div style={{ color: "#fbbf24", marginTop: 3 }}>
        Datos solo en memoria; no se envían al servidor.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => void location.requestPermission()}
          disabled={location.isTracking || isRequestingPermission}
        >
          {isRequestingPermission ? "Solicitando…" : "Solicitar ubicación"}
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => void location.startTracking()}
          disabled={location.isTracking}
        >
          Iniciar
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => void location.stopTracking()}
          disabled={!location.isTracking}
        >
          Detener
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => void location.resetLocation()}
        >
          Limpiar
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => void copyCurrentData()}>
          Copiar datos
        </button>
      </div>

      {location.errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            marginTop: 10,
            padding: "10px 11px",
            border: "1px solid rgba(248, 113, 113, 0.55)",
            borderRadius: 10,
            background: "rgba(127, 29, 29, 0.35)",
            color: "#fecaca",
          }}
        >
          <strong style={{ display: "block", color: "#fca5a5" }}>
            No fue posible activar tu ubicación
          </strong>
          <span style={{ display: "block", marginTop: 3 }}>
            {location.errorMessage}
          </span>
          <span style={{ display: "block", marginTop: 6, color: "#e2e8f0" }}>
            Comprueba que abriste el sitio por HTTPS, que la ubicación/GPS del
            dispositivo está encendida y que el navegador tiene permiso para
            este sitio.
          </span>
        </div>
      )}

      {location.permission === "granted" &&
        location.status === "ready" && (
          <div
            role="status"
            style={{ marginTop: 8, color: "#86efac", fontWeight: 700 }}
          >
            Permiso concedido. Pulsa Iniciar para mostrar tu posición.
          </div>
        )}

      {copyStatus && <div style={{ marginTop: 6, color: "#7dd3fc" }}>{copyStatus}</div>}

      <div style={GRID_STYLE}>
        <DebugRow label="Estado" value={location.status} />
        <DebugRow label="Permiso" value={location.permission} />
        <DebugRow label="Seguimiento" value={location.isTracking ? "activo" : "detenido"} />
        <DebugRow label="Latitud" value={formatNumber(raw?.latitude, 8)} />
        <DebugRow label="Longitud" value={formatNumber(raw?.longitude, 8)} />
        <DebugRow label="Precisión" value={`${formatNumber(raw?.accuracy, 1)} m`} />
        <DebugRow label="Calidad" value={location.accuracyQuality ?? "—"} />
        <DebugRow label="Altitud" value={`${formatNumber(raw?.altitude, 1)} m`} />
        <DebugRow label="Dirección" value={`${formatNumber(raw?.heading, 1)}°`} />
        <DebugRow label="Velocidad GPS" value={`${formatNumber(raw?.speed, 2)} m/s`} />
        <DebugRow label="Velocidad estimada" value={`${formatNumber(location.estimatedSpeedMetersPerSecond, 2)} m/s`} />
        <DebugRow label="Filtro" value={location.lastFilterReason ?? "—"} />
        <DebugRow label="Timestamp GPS" value={formatDate(raw?.timestamp)} />
        <DebugRow label="Última lectura" value={formatDate(location.lastUpdateAt)} />
        <DebugRow label="Este local" value={`${formatNumber(location.localPosition?.eastMeters, 2)} m`} />
        <DebugRow label="Norte local" value={`${formatNumber(location.localPosition?.northMeters, 2)} m`} />
        <DebugRow label="Modelo X" value={formatNumber(location.campusPosition?.x, 3)} />
        <DebugRow label="Modelo Y" value={formatNumber(location.campusPosition?.y, 3)} />
        <DebugRow label="Modelo Z" value={formatNumber(location.campusPosition?.z, 3)} />
        <DebugRow label="Escala" value={`${formatNumber(location.calibrationScale, 6)} u/m`} />
        <DebugRow label="Rotación" value={`${formatNumber(location.calibrationRotationRadians, 6)} rad`} />
        <DebugRow label="Calibración" value={`${location.calibrationStatus}: ${location.calibrationMessage}`} />
        <DebugRow label="Error" value={location.errorMessage ?? "—"} />
      </div>
    </aside>
  );
}
