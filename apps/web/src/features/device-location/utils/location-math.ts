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
