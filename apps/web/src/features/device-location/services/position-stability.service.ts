import {
  MAX_USEFUL_ACCURACY_METERS,
  POSITION_STABILITY_CONFIG,
} from "../config/campus-location.config";
import type { DeviceGeoPosition } from "../types/device-location.types";
import { haversineDistanceMeters } from "../utils/location-math";

export type PositionStabilityState = {
  /** Última posición aceptada como confiable — nunca se borra por una
   *  lectura mala; solo se reemplaza por otra mejor. */
  confirmedPosition: DeviceGeoPosition | null;
};

export type PositionStabilityResult = {
  state: PositionStabilityState;
  /** La posición que debe mostrarse (marcador, cámara, edificio actual).
   *  `null` únicamente antes de la primera lectura utilizable de la sesión —
   *  a partir de ahí, siempre conserva el último valor confiable. */
  confirmedPosition: DeviceGeoPosition | null;
  /** true solo cuando este tick reemplazó la posición confirmada. */
  updated: boolean;
};

export const INITIAL_POSITION_STABILITY_STATE: PositionStabilityState = {
  confirmedPosition: null,
};

/**
 * Decide si una lectura GPS nueva reemplaza la última posición "confiable"
 * mostrada al usuario, o si se ignora y esa última posición se conserva tal
 * cual — el marcador nunca debe desaparecer ni saltar solo porque llegó una
 * lectura peor o ligeramente distinta por el ruido normal del GPS.
 *
 * Reglas, en orden:
 * 1. Una lectura con precisión inservible (&gt; MAX_USEFUL_ACCURACY_METERS,
 *    típico de WiFi/IP sin GPS real) nunca se acepta, ni siquiera como
 *    primera posición de la sesión — no hay nada confiable que mostrar
 *    todavía, se sigue esperando.
 * 2. Una vez que existe una posición confirmada, una lectura nueva solo la
 *    reemplaza si el desplazamiento respecto a ella supera un umbral que
 *    combina un piso fijo (POSITION_STABILITY_CONFIG.minPositionChangeMeters)
 *    y una fracción de la precisión reportada — así una lectura imprecisa
 *    necesita un desplazamiento más grande para "convencer" al sistema de
 *    que sí hubo movimiento real, no solo ruido dentro de su propio margen
 *    de error.
 * 3. Si el desplazamiento no alcanza el umbral, la posición confirmada NO
 *    avanza — el próximo tick sigue comparando contra la MISMA referencia,
 *    así los pasos pequeños se acumulan hasta cruzar el umbral en vez de
 *    perderse uno por uno (mismo patrón que heading-tracker.service.ts).
 *
 * Espera recibir la posición ya filtrada/suavizada (location-filter.service
 * + location-smoothing.service) — no vuelve a filtrar saltos imposibles.
 */
export function updatePositionStability(
  candidate: DeviceGeoPosition,
  state: PositionStabilityState,
): PositionStabilityResult {
  if (candidate.accuracy > MAX_USEFUL_ACCURACY_METERS) {
    return { state, confirmedPosition: state.confirmedPosition, updated: false };
  }

  if (!state.confirmedPosition) {
    return {
      state: { confirmedPosition: candidate },
      confirmedPosition: candidate,
      updated: true,
    };
  }

  const distanceMeters = haversineDistanceMeters(state.confirmedPosition, candidate);
  const requiredMovementMeters = Math.max(
    POSITION_STABILITY_CONFIG.minPositionChangeMeters,
    candidate.accuracy * POSITION_STABILITY_CONFIG.accuracyMovementFactor,
  );

  if (distanceMeters === null || distanceMeters < requiredMovementMeters) {
    return { state, confirmedPosition: state.confirmedPosition, updated: false };
  }

  return {
    state: { confirmedPosition: candidate },
    confirmedPosition: candidate,
    updated: true,
  };
}
