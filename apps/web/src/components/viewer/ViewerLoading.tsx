export function ViewerLoading({ isExiting = false }: { isExiting?: boolean }) {
  return (
    <div
      className={`ito-viewer-loading${isExiting ? " is-exiting" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ito-viewer-loading__inner">
        <div className="ito-viewer-loading__spinner" aria-hidden="true" />
        <div className="ito-viewer-loading__title">Cargando campus 3D…</div>
        <div className="ito-viewer-loading__subtitle">
          Preparando tu mapa interactivo
        </div>
        <div className="ito-viewer-loading__dots" aria-hidden="true">
          <span className="ito-viewer-loading__dot" />
          <span className="ito-viewer-loading__dot" />
          <span className="ito-viewer-loading__dot" />
        </div>
      </div>
    </div>
  );
}
