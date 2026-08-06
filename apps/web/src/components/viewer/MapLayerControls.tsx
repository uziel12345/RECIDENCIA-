import { Icon } from "../ui/Icons";

export function MapLayerControls({
  showBuildingLabels,
  showStreetLabels,
  onToggleBuildingLabels,
  onToggleStreetLabels,
  isMobile = false,
}: {
  showBuildingLabels: boolean;
  showStreetLabels: boolean;
  onToggleBuildingLabels: () => void;
  onToggleStreetLabels: () => void;
  isMobile?: boolean;
}) {
  return (
    <div
      className={`ito-layer-controls${isMobile ? " ito-layer-controls--mobile" : ""}`}
      role="group"
      aria-label="Capas de etiquetas del mapa"
    >
      <span className="ito-layer-controls__title"><Icon name="layers" size={14} /> Etiquetas</span>
      <button
        type="button"
        className={showBuildingLabels ? "is-active" : ""}
        onClick={onToggleBuildingLabels}
        aria-pressed={showBuildingLabels}
      >
        Edificios
      </button>
      <button
        type="button"
        className={showStreetLabels ? "is-active" : ""}
        onClick={onToggleStreetLabels}
        aria-pressed={showStreetLabels}
      >
        Calles
      </button>
    </div>
  );
}
