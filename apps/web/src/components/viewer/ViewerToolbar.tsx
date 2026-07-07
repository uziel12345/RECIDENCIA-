import { Icon } from "../ui/Icons";
import type { ViewMode } from "./CampusViewer";

export type NavigationDebugMode = "hidden" | "all" | "issues";

export type ViewerToolbarProps = {
  hasLocation: boolean;
  navigationDebugMode: NavigationDebugMode;
  draftEditorActive: boolean;
  calibrationOpen: boolean;
  onFocusUser: () => void;
  onResetView: () => void;
  onZoom: (delta: number) => void;
  onToggleNavigationDebug: () => void;
  onToggleDraftEditor: () => void;
  onToggleCalibration: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  canUseAdvancedTools?: boolean;
  isMobile?: boolean;
};

export function ViewerToolbar({
  hasLocation,
  navigationDebugMode,
  draftEditorActive,
  calibrationOpen,
  onFocusUser,
  onResetView,
  onZoom,
  onToggleNavigationDebug,
  onToggleDraftEditor,
  onToggleCalibration,
  viewMode,
  onToggleViewMode,
  canUseAdvancedTools = false,
  isMobile = false,
}: ViewerToolbarProps) {
  const isAerial = viewMode === "aerial";
  const showNavigationDebug = navigationDebugMode !== "hidden";
  const debugTitle =
    navigationDebugMode === "hidden"
      ? "Depurar rutas"
      : navigationDebugMode === "all"
        ? "Ver solo problemas"
        : "Ocultar depuración";

  if (isMobile) {
    return (
      <div
        className="ito-toolbar ito-toolbar--mobile ito-toolbar--mobile-compact"
        role="toolbar"
        aria-label="Controles del mapa"
      >
        <button
          type="button"
          className={`ito-toolbar__btn ${
            hasLocation ? "ito-toolbar__btn--accent" : ""
          }`}
          onClick={onFocusUser}
          aria-label="Centrar en mi ubicación"
          title={hasLocation ? "Centrar en mi ubicación" : "Esperando ubicación…"}
          disabled={!hasLocation}
        >
          <Icon name="crosshair" size={18} />
        </button>

        <button
          type="button"
          className="ito-toolbar__btn"
          onClick={onResetView}
          aria-label="Restablecer vista"
          title="Restablecer vista"
        >
          <Icon name="home" size={18} />
        </button>

        <button
          type="button"
          className={`ito-toolbar__btn ${isAerial ? "is-active" : ""}`}
          onClick={onToggleViewMode}
          aria-label={isAerial ? "Cambiar a vista inmersiva" : "Cambiar a vista aérea"}
          aria-pressed={isAerial}
          title={isAerial ? "Vista inmersiva" : "Vista aérea"}
        >
          <Icon name={isAerial ? "navigation" : "map"} size={18} />
        </button>

        {canUseAdvancedTools && (
          <button
            type="button"
            className={`ito-toolbar__btn ${calibrationOpen ? "is-active" : ""}`}
            onClick={onToggleCalibration}
            aria-label="Calibrar posición GPS"
            aria-pressed={calibrationOpen}
            title="Calibrar posición"
          >
            <Icon name="compass" size={17} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`ito-toolbar ${isMobile ? "ito-toolbar--mobile" : ""}`}
      role="toolbar"
      aria-label="Controles del mapa"
    >
      <button
        type="button"
        className={`ito-toolbar__btn ${
          hasLocation ? "ito-toolbar__btn--accent" : ""
        }`}
        onClick={onFocusUser}
        aria-label="Centrar en mi ubicación"
        title={hasLocation ? "Centrar en mi ubicación" : "Esperando ubicación…"}
        disabled={!hasLocation}
      >
        <Icon name="crosshair" size={18} />
      </button>

      <div className="ito-toolbar__group" role="group" aria-label="Zoom">
        <button
          type="button"
          className="ito-toolbar__btn"
          onClick={() => onZoom(-1)}
          aria-label="Acercar"
          title="Acercar"
        >
          <Icon name="plus" size={18} />
        </button>

        <span className="ito-toolbar__divider" aria-hidden="true" />

        <button
          type="button"
          className="ito-toolbar__btn"
          onClick={() => onZoom(1)}
          aria-label="Alejar"
          title="Alejar"
        >
          <Icon name="minus" size={18} />
        </button>
      </div>

      <button
        type="button"
        className="ito-toolbar__btn"
        onClick={onResetView}
        aria-label="Restablecer vista"
        title="Restablecer vista"
      >
        <Icon name="home" size={18} />
      </button>

      <button
        type="button"
        className={`ito-toolbar__btn ${isAerial ? "is-active" : ""}`}
        onClick={onToggleViewMode}
        aria-label={isAerial ? "Cambiar a vista inmersiva" : "Cambiar a vista aérea"}
        aria-pressed={isAerial}
        title={isAerial ? "Vista inmersiva (nivel de calle)" : "Vista aérea (todo el campus)"}
      >
        <Icon name={isAerial ? "navigation" : "map"} size={18} />
      </button>

      {canUseAdvancedTools && (
        <>
          <button
            type="button"
            className={`ito-toolbar__btn ${showNavigationDebug ? "is-active" : ""}`}
            onClick={onToggleNavigationDebug}
            aria-label="Mostrar nodos y rutas de depuracion"
            aria-pressed={showNavigationDebug}
            title={debugTitle}
          >
            <Icon name="layers" size={18} />
          </button>

          <button
            type="button"
            className={`ito-toolbar__btn ${draftEditorActive ? "is-active" : ""}`}
            onClick={onToggleDraftEditor}
            aria-label="Dibujar ruta temporal"
            aria-pressed={draftEditorActive}
            title={draftEditorActive ? "Salir del editor temporal" : "Dibujar ruta"}
          >
            <Icon name="edit" size={17} />
          </button>

          <button
            type="button"
            className={`ito-toolbar__btn ${calibrationOpen ? "is-active" : ""}`}
            onClick={onToggleCalibration}
            aria-label="Calibración y GPS del campus"
            aria-pressed={calibrationOpen}
            title="Calibración y GPS del campus"
          >
            <Icon name="compass" size={17} />
          </button>
        </>
      )}
    </div>
  );
}
