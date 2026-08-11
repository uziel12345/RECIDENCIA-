import {
  EARTH_RADIUS_METERS,
  LOCATION_ACCURACY_THRESHOLDS_METERS,
} from "../config/campus-location.config";
import type {
  GeoReferencePoint,
  LocationQuality,
} from "../types/device-location.types";

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function isFiniteGeoPoint(point: GeoReferencePoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

export function haversineDistanceMeters(
  from: GeoReferencePoint,
  to: GeoReferencePoint,
): number | null {
  if (!isFiniteGeoPoint(from) || !isFiniteGeoPoint(to)) return null;

  const deltaLatitude = degreesToRadians(to.latitude - from.latitude);
  const deltaLongitude = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  const distance =
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(
      Math.sqrt(boundedHaversine),
      Math.sqrt(1 - boundedHaversine),
    );

  return Number.isFinite(distance) ? distance : null;
}

export function getLocationQuality(accuracy: number): LocationQuality {
  if (accuracy <= LOCATION_ACCURACY_THRESHOLDS_METERS.excellent) {
    return "excellent";
  }
  if (accuracy <= LOCATION_ACCURACY_THRESHOLDS_METERS.good) return "good";
  if (accuracy <= LOCATION_ACCURACY_THRESHOLDS_METERS.regular) {
    return "regular";
  }
  return "poor";
}

/** Normaliza cualquier ángulo en grados al rango [0, 360). */
export function normalizeAngleDegrees(angleDegrees: number): number {
  return ((angleDegrees % 360) + 360) % 360;
}

/**
 * Diferencia angular con signo entre `a` y `b`, en el rango [-180, 180] —
 * la distancia MÁS CORTA entre dos ángulos, cruzando el borde 359°/0° cuando
 * conviene (359° a 1° son solo 2°, no 358°). Base de smoothHeadingDegrees.
 */
export function angleDifferenceDegrees(a: number, b: number): number {
  return normalizeAngleDegrees(a - b + 180) - 180;
}

/**
 * Rumbo inicial (0-360°, N=0/E=90/S=180/O=270) del desplazamiento real entre
 * dos posiciones GPS consecutivas — la dirección física en la que camina el
 * usuario. Deliberadamente independiente de la cámara/mapa 3D: solo usa
 * latitud/longitud. `null` si algún punto no es válido.
 */
export function calculateBearingDegrees(
  from: GeoReferencePoint,
  to: GeoReferencePoint,
): number | null {
  if (!isFiniteGeoPoint(from) || !isFiniteGeoPoint(to)) return null;

  const fromLatRad = degreesToRadians(from.latitude);
  const toLatRad = degreesToRadians(to.latitude);
  const deltaLonRad = degreesToRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLonRad) * Math.cos(toLatRad);
  const x =
    Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLonRad);

  const bearingRadians = Math.atan2(y, x);
  const bearingDegrees = (bearingRadians * 180) / Math.PI;
  return Number.isFinite(bearingDegrees)
    ? normalizeAngleDegrees(bearingDegrees)
    : null;
}

/**
 * Promedio móvil exponencial circular: igual que un EMA lineal normal, pero
 * avanzando por el camino angular MÁS CORTO (ver angleDifferenceDegrees) en
 * vez de interpolar los números crudos — así 359°→1° se mueve +2°, no da la
 * vuelta larga por 180°. `alpha` controla qué tan rápido el rumbo suavizado
 * sigue al nuevo dato (0 = nunca cambia, 1 = lo reemplaza de inmediato).
 */
export function smoothHeadingDegrees(
  rawHeadingDegrees: number,
  previousSmoothedDegrees: number | null,
  alpha: number,
): number {
  if (previousSmoothedDegrees === null) {
    return normalizeAngleDegrees(rawHeadingDegrees);
  }
  const delta = angleDifferenceDegrees(rawHeadingDegrees, previousSmoothedDegrees);
  return normalizeAngleDegrees(previousSmoothedDegrees + alpha * delta);
}
