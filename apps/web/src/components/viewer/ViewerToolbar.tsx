import { Icon } from "../ui/Icons";

export type NavigationDebugMode = "hidden" | "all" | "issues";

export type ViewerToolbarProps = {
  hasLocation: boolean;
  navigationDebugMode: NavigationDebugMode;
  draftEditorActive: boolean;
  gpsRecorderOpen: boolean;
  onFocusUser: () => void;
  onResetView: () => void;
  onZoom: (delta: number) => void;
  onToggleNavigationDebug: () => void;
  onToggleDraftEditor: () => void;
  onToggleGpsRecorder: () => void;
  canUseAdvancedTools?: boolean;
  isMobile?: boolean;
};

export function ViewerToolbar({
  hasLocation,
  navigationDebugMode,
  draftEditorActive,
  gpsRecorderOpen,
  onFocusUser,
  onResetView,
  onZoom,
  onToggleNavigationDebug,
  onToggleDraftEditor,
  onToggleGpsRecorder,
  canUseAdvancedTools = false,
  isMobile = false,
}: ViewerToolbarProps) {
  const showNavigationDebug = navigationDebugMode !== "hidden";
  const debugTitle =
    navigationDebugMode === "hidden"
      ? "Depurar rutas"
      : navigationDebugMode === "all"
        ? "Ver solo problemas"
        : "Ocultar depuración";

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
        aria-label="Vista general del campus"
        title="Vista general"
      >
        <Icon name="home" size={18} />
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
            className={`ito-toolbar__btn ${gpsRecorderOpen ? "is-active" : ""}`}
            onClick={onToggleGpsRecorder}
            aria-label="Registrar GPS de edificios"
            aria-pressed={gpsRecorderOpen}
            title="Registrar GPS de edificios"
          >
            <Icon name="locate" size={17} />
          </button>
        </>
      )}
    </div>
  );
}
