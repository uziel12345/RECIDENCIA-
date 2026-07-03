export function ViewerLoading({ isExiting = false, progress }: { isExiting?: boolean; progress?: number }) {
  const pct = Math.min(Math.max(Math.round(progress ?? 0), 0), 100);

  return (
    <div
      className={`ito-viewer-loading${isExiting ? " is-exiting" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ito-viewer-loading__inner">
        <div className="ito-viewer-loading__spinner" aria-hidden="true" />
        <div className="ito-viewer-loading__title">Cargando campus 3D…</div>
        <div className="ito-viewer-loading__progress">
          <div className="ito-viewer-loading__progress-track">
            <div
              className="ito-viewer-loading__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="ito-viewer-loading__progress-pct">{pct}%</span>
        </div>
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
