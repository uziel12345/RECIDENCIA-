import type { Building } from "../../buildings/types/building";
import type { GeoCoordinates, MapCoordinates, NearestBuilding } from "../../../store/location-store";
import type { BuildingGeofence } from "@ito-map/shared";
import { haversineMeters } from "./geolocation";

type Candidate = {
  building: Building;
  gpsDistance: number | null;
  modelDistance: number | null;
  score: number;
};

export type LocationResolveMethod = "geofence" | "gps_and_model" | "gps_only" | "model_only";
export type LocationConfidence = "high" | "medium" | "low";

export type ResolvedBuildingLocation = NearestBuilding & {
  confidence: LocationConfidence;
  method: LocationResolveMethod;
};

const MAX_USABLE_ACCURACY_METERS = 80;
const MIN_GPS_THRESHOLD_METERS = 18;
const MAX_GPS_THRESHOLD_METERS = 55;
const MODEL_THRESHOLD_METERS = 34;
const SECOND_PLACE_MARGIN_METERS = 12;
const GEOFENCE_MARGIN_METERS = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function gpsThresholdForAccuracy(accuracy: number | null): number {
  if (accuracy === null) return 32;
  return clamp(accuracy * 0.75 + 12, MIN_GPS_THRESHOLD_METERS, MAX_GPS_THRESHOLD_METERS);
}

function hasGps(building: Building): boolean {
  return building.latitude != null && building.longitude != null;
}

function hasModelPosition(building: Building): boolean {
  return building.x != null && building.z != null;
}

function pointInPolygon(point: GeoCoordinates, polygon: BuildingGeofence["polygon"]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.lng > point.longitude !== pj.lng > point.longitude &&
      point.latitude <
        ((pj.lat - pi.lat) * (point.longitude - pi.lng)) / (pj.lng - pi.lng) + pi.lat;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToGeofenceMeters(point: GeoCoordinates, polygon: BuildingGeofence["polygon"]): number {
  if (polygon.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(
    ...polygon.map((vertex) =>
      haversineMeters(point.latitude, point.longitude, vertex.lat, vertex.lng)
    )
  );
}

function resolveFromGeofences(
  geofences: BuildingGeofence[],
  geoPosition: GeoCoordinates,
): ResolvedBuildingLocation | null {
  if (geofences.length === 0) return null;

  const ordered = [...geofences]
    .filter((geofence) => geofence.is_active && geofence.polygon.length >= 3)
    .sort((a, b) => b.priority - a.priority);

  for (const geofence of ordered) {
    if (pointInPolygon(geoPosition, geofence.polygon)) {
      return {
        buildingId: geofence.building_id,
        buildingCode: geofence.building_code,
        buildingName: geofence.building_name,
        distanceMeters: 0,
        confidence: "high",
        method: "geofence",
      };
    }
  }

  const nearest = ordered
    .map((geofence) => ({
      geofence,
      distance: distanceToGeofenceMeters(geoPosition, geofence.polygon),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest || nearest.distance > GEOFENCE_MARGIN_METERS) return null;

  return {
    buildingId: nearest.geofence.building_id,
    buildingCode: nearest.geofence.building_code,
    buildingName: nearest.geofence.building_name,
    distanceMeters: nearest.distance,
    confidence: "medium",
    method: "geofence",
  };
}

function candidateScore(gpsDistance: number | null, modelDistance: number | null): number {
  if (gpsDistance !== null && modelDistance !== null) {
    return gpsDistance * 0.65 + modelDistance * 0.35;
  }
  return gpsDistance ?? modelDistance ?? Number.POSITIVE_INFINITY;
}

function toResolved(
  candidate: Candidate,
  confidence: LocationConfidence,
  method: LocationResolveMethod,
): ResolvedBuildingLocation {
  return {
    buildingId: candidate.building.id,
    buildingCode: candidate.building.code,
    buildingName: candidate.building.name,
    distanceMeters: candidate.gpsDistance ?? candidate.modelDistance ?? 0,
    confidence,
    method,
  };
}

export function resolveCurrentBuilding(
  buildings: Building[],
  geoPosition: GeoCoordinates,
  mapPosition: MapCoordinates,
  geofences: BuildingGeofence[] = [],
): ResolvedBuildingLocation | null {
  if (
    geoPosition.accuracy !== null &&
    geoPosition.accuracy > MAX_USABLE_ACCURACY_METERS
  ) {
    return null;
  }

  const geofenceMatch = resolveFromGeofences(geofences, geoPosition);
  if (geofenceMatch) return geofenceMatch;

  const candidates = buildings
    .filter((building) => building.is_active && (hasGps(building) || hasModelPosition(building)))
    .map<Candidate>((building) => {
      const gpsDistance = hasGps(building)
        ? haversineMeters(
            geoPosition.latitude,
            geoPosition.longitude,
            Number(building.latitude),
            Number(building.longitude),
          )
        : null;

      const modelDistance = hasModelPosition(building)
        ? Math.hypot(
            mapPosition.x - Number(building.x),
            mapPosition.z - Number(building.z),
          )
        : null;

      return {
        building,
        gpsDistance,
        modelDistance,
        score: candidateScore(gpsDistance, modelDistance),
      };
    })
    .sort((a, b) => a.score - b.score);

  const nearest = candidates[0];
  if (!nearest) return null;

  const gpsThreshold = gpsThresholdForAccuracy(geoPosition.accuracy);
  const gpsHit = nearest.gpsDistance !== null && nearest.gpsDistance <= gpsThreshold;
  const modelHit =
    nearest.modelDistance !== null && nearest.modelDistance <= MODEL_THRESHOLD_METERS;

  if (!gpsHit && !modelHit) return null;

  const runnerUp = candidates[1];
  const isAmbiguous =
    runnerUp !== undefined &&
    runnerUp.score - nearest.score < SECOND_PLACE_MARGIN_METERS;

  if (gpsHit && modelHit && !isAmbiguous) {
    return toResolved(nearest, "high", "gps_and_model");
  }

  if (gpsHit && !isAmbiguous) {
    return toResolved(nearest, "medium", "gps_only");
  }

  if (modelHit && !isAmbiguous) {
    return toResolved(nearest, "medium", "model_only");
  }

  return toResolved(nearest, "low", gpsHit ? "gps_only" : "model_only");
}
