import {
  HEADING_SMOOTHING_ALPHA,
  MIN_MOVEMENT_FOR_HEADING_METERS,
} from "../config/campus-location.config";
import type { DeviceGeoPosition } from "../types/device-location.types";
import {
  calculateBearingDegrees,
  getLocationQuality,
  haversineDistanceMeters,
  smoothHeadingDegrees,
} from "../utils/location-math";

export type HeadingTrackerState = {
  /** Última posición usada como referencia para calcular un rumbo. */
  referencePosition: DeviceGeoPosition | null;
  smoothedHeadingDegrees: number | null;
};

export type HeadingUpdateResult = {
  state: HeadingTrackerState;
  /** Rumbo instantáneo del último desplazamiento aceptado, sin suavizar. */
  movementHeadingDegrees: number | null;
  /** Rumbo estabilizado — el que debe alimentar la UI. */
  smoothedHeadingDegrees: number | null;
  /** true solo cuando este tick calculó un rumbo nuevo. */
  updated: boolean;
};

export const INITIAL_HEADING_TRACKER_STATE: HeadingTrackerState = {
  referencePosition: null,
  smoothedHeadingDegrees: null,
};

/**
 * Deriva el rumbo REAL de desplazamiento del usuario a partir de posiciones
 * GPS consecutivas — nunca de la rotación de la cámara o del mapa 3D (esa es
 * una fuente completamente distinta, ver destination-bearing.ts). Mantiene
 * el último rumbo válido (no actualiza nada) cuando el desplazamiento desde
 * la referencia es menor a MIN_MOVEMENT_FOR_HEADING_METERS o la precisión
 * reportada es mala — evita que el ruido normal del GPS, oscilando unos
 * metros con el usuario parado, produzca rumbos aleatorios.
 *
 * Espera recibir la posición ya filtrada/suavizada (location-filter.service
 * + location-smoothing.service) — no vuelve a filtrar saltos imposibles,
 * esa responsabilidad ya es de esos otros módulos.
 */
export function updateHeadingTracker(
  position: DeviceGeoPosition,
  state: HeadingTrackerState,
): HeadingUpdateResult {
  const unchanged = (): HeadingUpdateResult => ({
    state,
    movementHeadingDegrees: null,
    smoothedHeadingDegrees: state.smoothedHeadingDegrees,
    updated: false,
  });

  if (!state.referencePosition) {
    return {
      state: { ...state, referencePosition: position },
      movementHeadingDegrees: null,
      smoothedHeadingDegrees: state.smoothedHeadingDegrees,
      updated: false,
    };
  }

  // Precisión insuficiente: no recalcular con una lectura poco confiable —
  // conservar el último rumbo válido en vez de arriesgar un cambio brusco.
  if (getLocationQuality(position.accuracy) === "poor") return unchanged();

  const distanceMeters = haversineDistanceMeters(
    state.referencePosition,
    position,
  );
  if (distanceMeters === null) return unchanged();

  // Desplazamiento insuficiente: la referencia se conserva tal cual (no se
  // adelanta a `position`), así el próximo tick compara contra el mismo
  // punto y el desplazamiento se acumula hasta cruzar el umbral.
  if (distanceMeters < MIN_MOVEMENT_FOR_HEADING_METERS) return unchanged();

  const rawHeading = calculateBearingDegrees(state.referencePosition, position);
  if (rawHeading === null) return unchanged();

  const nextSmoothed = smoothHeadingDegrees(
    rawHeading,
    state.smoothedHeadingDegrees,
    HEADING_SMOOTHING_ALPHA,
  );

  return {
    state: { referencePosition: position, smoothedHeadingDegrees: nextSmoothed },
    movementHeadingDegrees: rawHeading,
    smoothedHeadingDegrees: nextSmoothed,
    updated: true,
  };
}
