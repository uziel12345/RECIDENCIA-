import { useEffect } from "react";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";

export function RoutePanel() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );
  const clearRoute = useBuildingStore((state) => state.clearRoute);

  const permission = useLocationStore((state) => state.permission);
  const geoPosition = useLocationStore((state) => state.geoPosition);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const errorMessage = useLocationStore((state) => state.errorMessage);

  useEffect(() => {
    if (!selectedBuilding) {
      clearRoute();
      return;
    }

    setRouteDestination(selectedBuilding);
  }, [selectedBuilding, setRouteDestination, clearRoute]);

  const hasValidLocation = permission === "granted" && mapPosition !== null;

  return (
    <div
      style={{
        width: "100%",
        background: "rgba(255, 255, 255, 0.96)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        backdropFilter: "blur(8px)",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Ruta desde tu ubicación
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Estado de ubicación
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            {permission === "granted"
              ? "Ubicación disponible"
              : permission === "denied"
              ? "Permiso denegado"
              : permission === "unsupported"
              ? "No soportado"
              : "Esperando permiso"}
          </div>

          {geoPosition && (
            <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
              Precisión actual:{" "}
              {geoPosition.accuracy !== null
                ? `${geoPosition.accuracy.toFixed(1)} m`
                : "sin dato"}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b45309",
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Origen
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {hasValidLocation ? "Tu ubicación actual" : "Ubicación no disponible"}
          </div>
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Destino
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {routeDestination
              ? routeDestination.name
              : selectedBuilding
              ? selectedBuilding.name
              : "Selecciona un edificio"}
          </div>
        </div>

        {hasValidLocation && routeDestination && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              color: "#166534",
              lineHeight: 1.6,
            }}
          >
            Ruta activa desde <strong>tu ubicación</strong> hacia{" "}
            <strong>{routeDestination.name}</strong>.
          </div>
        )}

        {!selectedBuilding && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              color: "#1d4ed8",
              lineHeight: 1.6,
            }}
          >
            Selecciona un edificio para generar la ruta automática.
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (selectedBuilding) {
                setRouteDestination(selectedBuilding);
              }
            }}
            disabled={!selectedBuilding}
            style={{
              border: "none",
              background: selectedBuilding ? "#2563eb" : "#cbd5e1",
              color: "#ffffff",
              padding: "12px 14px",
              borderRadius: 12,
              cursor: selectedBuilding ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: selectedBuilding
                ? "0 10px 20px rgba(37, 99, 235, 0.2)"
                : "none",
            }}
          >
            Generar ruta
          </button>

          <button
            type="button"
            onClick={clearRoute}
            style={{
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#111827",
              padding: "12px 14px",
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Limpiar ruta
          </button>
        </div>
      </div>
    </div>
  );
}