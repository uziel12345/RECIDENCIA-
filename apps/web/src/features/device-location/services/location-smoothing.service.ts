import {
  LOCATION_SMOOTHING_CONFIG,
} from "../config/campus-location.config";
import type { DeviceGeoPosition } from "../types/device-location.types";

/**
 * Promedio móvil exponencial ponderado por precisión reportada.
 *
 * El filtro de saltos (location-filter.service.ts) ya descarta lecturas
 * imposibles, pero una lectura RUIDOSA que sigue dentro de límites
 * razonables (ej. el GPS oscila 8-15 m estando quieto, típico cerca de
 * edificios) se aceptaba tal cual como la nueva posición "real" — el
 * suavizado del marcador (DeviceLocationMarker) solo anima la transición
 * entre esos puntos ruidosos, no elimina el ruido. Resultado: el punto
 * "persigue" cada bandazo del GPS con una animación suave en vez de
 * quedarse quieto — el "movimiento fantasma" reportado.
 *
 * Esta función pondera cuánto se mueve la posición suavizada hacia la
 * lectura nueva según su propia precisión: una lectura con buena precisión
 * (accuracy baja) domina casi de inmediato; una lectura con precisión
 * pobre apenas desplaza el resultado. No es un Kalman (el proyecto evita
 * esa complejidad a propósito) — es la versión más simple de la misma idea:
 * confiar más en las mediciones más precisas.
 */
export function smoothGeoPosition(
  raw: DeviceGeoPosition,
  previousSmoothed: DeviceGeoPosition | null,
): DeviceGeoPosition {
  if (!previousSmoothed) return raw;

  const referenceAccuracy = Math.max(
    LOCATION_SMOOTHING_CONFIG.referenceAccuracyMeters,
    1,
  );
  const effectiveAccuracy = Math.max(raw.accuracy, 1);
  const rawAlpha = referenceAccuracy / effectiveAccuracy;
  const alpha = Math.min(
    LOCATION_SMOOTHING_CONFIG.maxAlpha,
    Math.max(LOCATION_SMOOTHING_CONFIG.minAlpha, rawAlpha),
  );

  return {
    ...raw,
    latitude:
      previousSmoothed.latitude +
      alpha * (raw.latitude - previousSmoothed.latitude),
    longitude:
      previousSmoothed.longitude +
      alpha * (raw.longitude - previousSmoothed.longitude),
  };
}
