const DEFAULT_ZOOM_IN_FACTOR = 0.82;
const DEFAULT_ZOOM_OUT_FACTOR = 1.18;

/**
 * Calcula una distancia de zoom siempre válida. A diferencia de rechazar el
 * gesto completo cuando rebasa un límite, lo ajusta exactamente al mínimo o
 * máximo; esto evita que el último paso de zoom parezca roto en móvil.
 */
export function getClampedZoomDistance(
  currentDistance: number,
  delta: number,
  minDistance: number,
  maxDistance: number,
): number {
  const safeMin = Math.max(0, Math.min(minDistance, maxDistance));
  const safeMax = Math.max(safeMin, maxDistance);
  const safeCurrent = Number.isFinite(currentDistance)
    ? currentDistance
    : safeMin;
  const factor = delta > 0
    ? DEFAULT_ZOOM_OUT_FACTOR
    : DEFAULT_ZOOM_IN_FACTOR;

  return Math.min(safeMax, Math.max(safeMin, safeCurrent * factor));
}
