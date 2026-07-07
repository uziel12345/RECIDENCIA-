import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { Icon } from "../../../components/ui/Icons";
import { formatPositiveDistance, formatPositiveDuration } from "@ito-map/shared";
import {
  setSimulatedPosition,
  clearSimulatedPosition,
} from "../../location/services/geolocation";

const SIMULATED_LOCATION = {
  buildingId: "cc-simulado",
  buildingName: "Centro de Cómputo",
  x: -10.7109,
  z: -119.5335,
};

type RoutePanelProps = {
  compact?: boolean;
  canUseDemo?: boolean;
};

export function RoutePanel({ compact = false, canUseDemo = false }: RoutePanelProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setRouteDestination = useBuildingStore((state) => state.setRouteDestination);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);
  const clearRoute = useBuildingStore((state) => state.clearRoute);
  const routeStats = useBuildingStore((state) => state.routeStats);
  const routeError = useBuildingStore((state) => state.routeError);

  const permission = useLocationStore((state) => state.permission);
  const geoPosition = useLocationStore((state) => state.geoPosition);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const simulatedPosition = useLocationStore((state) => state.simulatedPosition);
  const nearestBuilding = useLocationStore((state) => state.nearestBuilding);

  const hasValidLocation = permission === "granted" && mapPosition !== null;
  const isSimulated = !!simulatedPosition;
  // Habilitado siempre que haya edificio seleccionado; el error de GPS lo muestra RouteLine
  const canGenerate = !!selectedBuilding;

  const distanceLabel = routeStats ? formatPositiveDistance(routeStats.totalDistance) : null;
  const durationLabel = routeStats ? formatPositiveDuration(routeStats.estimatedSeconds) : null;

  const statusInfo = (() => {
    if (permission === "granted") {
      if (nearestBuilding) {
        const isLowConfidence = nearestBuilding.confidence === "low";
        return {
          variant: isLowConfidence ? "warning" as const : "success" as const,
          text: `Ubicación: ${nearestBuilding.buildingName}`,
          hint:
            geoPosition?.accuracy !== null && geoPosition?.accuracy !== undefined
              ? `Precisión ${geoPosition.accuracy.toFixed(1)} m`
              : undefined,
        };
      }

      return {
        variant: "success" as const,
        text: "Ubicación disponible",
        hint:
          geoPosition?.accuracy !== null && geoPosition?.accuracy !== undefined
            ? `Precisión ${geoPosition.accuracy.toFixed(1)} m`
            : undefined,
      };
    }
    if (permission === "denied") {
      return {
        variant: "danger" as const,
        text: "Permiso de ubicación denegado",
        hint: "Habilítalo desde el navegador para trazar rutas.",
      };
    }
    if (permission === "unsupported") {
      return {
        variant: "warning" as const,
        text: "Geolocalización no soportada",
        hint: "Tu dispositivo no admite ubicación en tiempo real.",
      };
    }
    return {
      variant: "warning" as const,
      text: "Esperando permiso de ubicación",
      hint: "Acepta el permiso para usar la ruta.",
    };
  })();

  const destinationName = routeDestination?.name ?? selectedBuilding?.name ?? null;

  function handleClearAll() {
    clearRoute();
    setSelectedBuilding(null);
  }

  return (
    <section
      className="ito-route-panel"
      style={compact ? { boxShadow: "none" } : undefined}
      aria-label="Panel de ruta"
    >
      <div className="ito-route-panel__title">
        <Icon name="route" size={14} />
        <span>Ruta desde tu ubicación</span>
      </div>

      <div
        className={`ito-route-status ito-route-status--${statusInfo.variant}`}
        role="status"
      >
        <span className="ito-route-status__dot" aria-hidden="true" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{statusInfo.text}</span>
          {statusInfo.hint && (
            <span style={{ fontWeight: 500, opacity: 0.85 }}>
              {statusInfo.hint}
            </span>
          )}
        </div>
      </div>

      {canUseDemo && !hasValidLocation && (
        <button
          type="button"
          className="ito-btn ito-btn--ghost"
          style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
          onClick={() => setSimulatedPosition(SIMULATED_LOCATION)}
        >
          <Icon name="location" size={14} />
          <span>Simular ubicación (demo)</span>
        </button>
      )}

      {canUseDemo && isSimulated && (
        <div
          className="ito-route-status ito-route-status--warning"
          role="status"
          style={{ gap: 8, cursor: "pointer" }}
          onClick={clearSimulatedPosition}
          title="Haz clic para quitar la simulación"
        >
          <Icon name="alert" size={13} />
          <span>Ubicación simulada en {simulatedPosition!.buildingName} · Toca para quitar</span>
        </div>
      )}

      <div className="ito-route-timeline">
        <div className="ito-route-step">
          <div
            className="ito-route-step__icon ito-route-step__icon--origin"
            aria-hidden="true"
          >
            <Icon name="location" size={16} />
          </div>
          <div className="ito-route-step__main">
            <div className="ito-route-step__label">Origen</div>
            <div className="ito-route-step__value">
              {isSimulated
                ? `Simulado: ${simulatedPosition!.buildingName}`
                : nearestBuilding
                  ? nearestBuilding.confidence === "low"
                    ? `Posible: ${nearestBuilding.buildingName}`
                    : nearestBuilding.buildingName
                : hasValidLocation
                  ? "Tu ubicación actual"
                  : "Ubicación pendiente"}
            </div>
            {hasValidLocation && !isSimulated && nearestBuilding && (
              <div className="ito-route-step__hint">
                {nearestBuilding.confidence === "low"
                  ? "GPS aproximado; confirma visualmente"
                  : "Detectada por GPS del edificio"}
              </div>
            )}
          </div>
        </div>

        <div className="ito-route-step">
          <div
            className="ito-route-step__icon ito-route-step__icon--destination"
            aria-hidden="true"
          >
            <Icon name="flag" size={16} />
          </div>
          <div className="ito-route-step__main">
            <div className="ito-route-step__label">Destino</div>
            <div className="ito-route-step__value">
              {destinationName ?? "Selecciona un edificio de la lista"}
            </div>
            {selectedBuilding && !routeDestination && (
              <div className="ito-route-step__hint">Listo para trazar ruta</div>
            )}
            {routeDestination && !routeStats && !routeError && (
              <div className="ito-route-step__hint">Calculando ruta…</div>
            )}
            {routeDestination && routeStats && (
              <div className="ito-route-step__hint">Ruta activa</div>
            )}
          </div>
          {routeDestination && (
            <button
              type="button"
              className="ito-btn ito-btn--ghost"
              style={{ fontSize: 12, padding: "5px 10px", marginTop: 4, alignSelf: "flex-start" }}
              onClick={handleClearAll}
              title="Cambiar destino"
            >
              <Icon name="search" size={13} />
              <span>Cambiar</span>
            </button>
          )}
        </div>
      </div>

      {routeError && (
        <div
          className="ito-route-status ito-route-status--danger"
          role="alert"
          style={{ gap: 8 }}
        >
          <Icon name="alert" size={14} />
          <span>{routeError}</span>
        </div>
      )}

      {routeStats && distanceLabel && durationLabel && (
        <div className="ito-route-stats" aria-label="Resumen de la ruta">
          <div className="ito-route-stats__item">
            <Icon name="clock" size={13} />
            <span className="ito-route-stats__value">{durationLabel}</span>
          </div>
          <div className="ito-route-stats__sep" />
          <div className="ito-route-stats__item">
            <Icon name="route" size={13} />
            <span className="ito-route-stats__value">{distanceLabel}</span>
          </div>
        </div>
      )}

      <div className="ito-route-actions">
        <button
          type="button"
          className="ito-btn ito-btn--primary"
          onClick={() => {
            if (selectedBuilding) {
              setRouteDestination(selectedBuilding);
            }
          }}
          disabled={!canGenerate}
          style={{ flex: 1 }}
        >
          <Icon name="route" size={16} />
          <span>Cómo llegar</span>
        </button>

        <button
          type="button"
          className="ito-btn ito-btn--ghost"
          onClick={handleClearAll}
          disabled={!selectedBuilding && !routeDestination}
        >
          <Icon name="trash" size={16} />
          <span>Limpiar</span>
        </button>
      </div>
    </section>
  );
}
