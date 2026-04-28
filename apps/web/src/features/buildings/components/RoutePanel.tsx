import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { Icon } from "../../../components/ui/Icons";

type RoutePanelProps = {
  compact?: boolean;
};

export function RoutePanel({ compact = false }: RoutePanelProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setRouteDestination = useBuildingStore((state) => state.setRouteDestination);
  const clearRoute = useBuildingStore((state) => state.clearRoute);

  const permission = useLocationStore((state) => state.permission);
  const geoPosition = useLocationStore((state) => state.geoPosition);
  const mapPosition = useLocationStore((state) => state.mapPosition);

  const hasValidLocation = permission === "granted" && mapPosition !== null;
  const canGenerate = !!selectedBuilding && hasValidLocation;

  const statusInfo = (() => {
    if (permission === "granted") {
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

      <div style={{ display: "grid", gap: 8 }}>
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
              {hasValidLocation ? "Tu ubicación actual" : "Ubicación pendiente"}
            </div>
            {hasValidLocation && (
              <div className="ito-route-step__hint">Detectada en el campus</div>
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
            {routeDestination && (
              <div className="ito-route-step__hint">
                Ruta activa hacia este edificio
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ito-route-actions">
        <button
          type="button"
          className="ito-btn ito-btn--primary"
          onClick={() => {
            if (selectedBuilding && hasValidLocation) {
              setRouteDestination(selectedBuilding);
            }
          }}
          disabled={!canGenerate}
          style={{ flex: 1 }}
        >
          <Icon name="route" size={16} />
          <span>Generar ruta</span>
        </button>

        <button
          type="button"
          className="ito-btn ito-btn--ghost"
          onClick={clearRoute}
          disabled={!routeDestination}
        >
          <Icon name="trash" size={16} />
          <span>Limpiar</span>
        </button>
      </div>
    </section>
  );
}
