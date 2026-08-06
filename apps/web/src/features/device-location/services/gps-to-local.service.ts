import { EARTH_RADIUS_METERS } from "../config/campus-location.config";
import type {
  GeoReferencePoint,
  LocalMetricPosition,
} from "../types/device-location.types";
import {
  degreesToRadians,
  isFiniteGeoPoint,
} from "../utils/location-math";

/**
 * Convierte una coordenada GPS a desplazamientos locales en metros.
 * eastMeters es positivo hacia el este y northMeters hacia el norte.
 * Es una aproximación local apropiada para un campus, no una proyección para
 * recorridos grandes.
 */
export function gpsToLocalMeters(
  position: GeoReferencePoint,
  reference: GeoReferencePoint,
): LocalMetricPosition | null {
  if (!isFiniteGeoPoint(position) || !isFiniteGeoPoint(reference)) return null;

  const referenceLatitudeRadians = degreesToRadians(reference.latitude);
  const deltaLatitudeRadians = degreesToRadians(
    position.latitude - reference.latitude,
  );
  const deltaLongitudeRadians = degreesToRadians(
    position.longitude - reference.longitude,
  );

  const localPosition = {
    northMeters: deltaLatitudeRadians * EARTH_RADIUS_METERS,
    eastMeters:
      deltaLongitudeRadians *
      EARTH_RADIUS_METERS *
      Math.cos(referenceLatitudeRadians),
  };

  return Number.isFinite(localPosition.eastMeters) &&
    Number.isFinite(localPosition.northMeters)
    ? localPosition
    : null;
}
