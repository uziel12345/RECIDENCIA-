const DEFAULT_ZOOM_IN_FACTOR = 0.82;
const DEFAULT_ZOOM_OUT_FACTOR = 1.18;

// La vista aérea inicial queda aproximadamente a 185 unidades del objetivo.
// Estos topes dejan un margen útil para orientarse sin permitir que el campus
// se convierta en un punto ilegible, especialmente en pantallas pequeñas.
export const DESKTOP_MAX_CAMERA_DISTANCE = 280;
export const MOBILE_MAX_CAMERA_DISTANCE = 230;

export type BuildingFocusSnapshot = {
  buildingId: string;
  x: number;
  z: number;
  campusX: number;
  campusZ: number;
};

/**
 * Evita omitir un reenfoque cuando el GLB termina de publicar su posición o
 * cuando el autocentrado mueve el grupo del campus después de una selección.
 */
export function isSameBuildingFocus(
  previous: BuildingFocusSnapshot | null,
  next: BuildingFocusSnapshot,
  epsilon = 0.001,
): boolean {
  if (!previous || previous.buildingId !== next.buildingId) return false;
  return (
    Math.abs(previous.x - next.x) < epsilon &&
    Math.abs(previous.z - next.z) < epsilon &&
    Math.abs(previous.campusX - next.campusX) < epsilon &&
    Math.abs(previous.campusZ - next.campusZ) < epsilon
  );
}

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
