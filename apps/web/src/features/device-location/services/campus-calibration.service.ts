import {
  CAMPUS_AXIS_INVERSION,
  CAMPUS_LOCAL_CORRECTIONS,
  USER_MARKER_HEIGHT,
} from "../config/campus-location.config";
import type {
  CampusAxisInversion,
  CampusCalibrationPoint,
  CampusCalibrationResult,
  CampusCalibrationTransform,
  CampusLocalCorrectionPoint,
  CampusMapPosition,
  GeoReferencePoint,
  LocalMetricPosition,
} from "../types/device-location.types";
import { gpsToLocalMeters } from "./gps-to-local.service";

const MINIMUM_CALIBRATION_DISTANCE_METERS = 0.01;
const MINIMUM_MAP_DISTANCE_UNITS = 0.000_001;

function isFiniteCalibrationPoint(point: CampusCalibrationPoint): boolean {
  return [
    point.geo.latitude,
    point.geo.longitude,
    point.map.x,
    point.map.z,
    point.weight ?? 1,
  ].every(Number.isFinite);
}

function getCalibrationWeight(point: CampusCalibrationPoint): number {
  return point.weight ?? 1;
}

function isPlaceholderPoint(point: CampusCalibrationPoint): boolean {
  return (
    point.geo.latitude === 0 &&
    point.geo.longitude === 0 &&
    point.map.x === 0 &&
    point.map.z === 0
  );
}

function invalidCalibration(
  status: "pending" | "invalid",
  message: string,
  geoDistanceMeters: number | null = null,
  mapDistanceModelUnits: number | null = null,
): CampusCalibrationResult {
  return {
    status,
    message,
    transform: null,
    geoDistanceMeters,
    mapDistanceModelUnits,
  };
}

export function calculateCalibrationTransform(
  points: readonly CampusCalibrationPoint[],
  axisInversion: CampusAxisInversion = CAMPUS_AXIS_INVERSION,
): CampusCalibrationResult {
  if (points.length < 2) {
    return invalidCalibration(
      "pending",
      "Faltan dos puntos físicos de calibración.",
    );
  }

  const pointA = points[0];
  const pointB = points[1];
  if (!pointA || !pointB) {
    return invalidCalibration(
      "pending",
      "Faltan dos puntos físicos de calibración.",
    );
  }
  if (points.some(isPlaceholderPoint)) {
    return invalidCalibration(
      "pending",
      "La calibración está pendiente de mediciones GPS y X/Z reales.",
    );
  }
  if (!points.every(isFiniteCalibrationPoint)) {
    return invalidCalibration(
      "invalid",
      "La calibración contiene valores no finitos.",
    );
  }
  if (points.some((point) => getCalibrationWeight(point) <= 0)) {
    return invalidCalibration(
      "invalid",
      "La calibración contiene un peso igual o menor que cero.",
    );
  }

  const localVector = gpsToLocalMeters(pointB.geo, pointA.geo);
  if (!localVector) {
    return invalidCalibration(
      "invalid",
      "Las coordenadas GPS de calibración no son válidas.",
    );
  }

  const east = axisInversion.invertEast
    ? -localVector.eastMeters
    : localVector.eastMeters;
  const north = axisInversion.invertNorth
    ? -localVector.northMeters
    : localVector.northMeters;
  const geoDistanceMeters = Math.hypot(east, north);
  const mapDeltaX = pointB.map.x - pointA.map.x;
  const mapDeltaZ = pointB.map.z - pointA.map.z;
  const mapDistanceModelUnits = Math.hypot(mapDeltaX, mapDeltaZ);

  if (
    !Number.isFinite(geoDistanceMeters) ||
    geoDistanceMeters <= MINIMUM_CALIBRATION_DISTANCE_METERS
  ) {
    return invalidCalibration(
      "invalid",
      "Los puntos GPS de calibración son iguales o están demasiado cerca.",
      Number.isFinite(geoDistanceMeters) ? geoDistanceMeters : null,
      Number.isFinite(mapDistanceModelUnits) ? mapDistanceModelUnits : null,
    );
  }
  if (
    !Number.isFinite(mapDistanceModelUnits) ||
    mapDistanceModelUnits <= MINIMUM_MAP_DISTANCE_UNITS
  ) {
    return invalidCalibration(
      "invalid",
      "Los puntos X/Z del modelo son iguales o están demasiado cerca.",
      geoDistanceMeters,
      Number.isFinite(mapDistanceModelUnits) ? mapDistanceModelUnits : null,
    );
  }

  let scaleModelUnitsPerMeter: number;
  let rotationRadians: number;
  let mapOrigin = { ...pointA.map };

  if (points.length === 2) {
    scaleModelUnitsPerMeter = mapDistanceModelUnits / geoDistanceMeters;
    rotationRadians =
      Math.atan2(mapDeltaZ, mapDeltaX) - Math.atan2(north, east);
  } else {
    const localPoints = points.map((point) => {
      const local = gpsToLocalMeters(point.geo, pointA.geo);
      if (!local) return null;
      return {
        east: axisInversion.invertEast
          ? -local.eastMeters
          : local.eastMeters,
        north: axisInversion.invertNorth
          ? -local.northMeters
          : local.northMeters,
        x: point.map.x,
        z: point.map.z,
        weight: getCalibrationWeight(point),
      };
    });

    if (localPoints.some((point) => point === null)) {
      return invalidCalibration(
        "invalid",
        "Las coordenadas GPS de calibración no son válidas.",
        geoDistanceMeters,
        mapDistanceModelUnits,
      );
    }

    const usablePoints = localPoints.filter(
      (point): point is NonNullable<typeof point> => point !== null,
    );
    const totalWeight = usablePoints.reduce(
      (sum, point) => sum + point.weight,
      0,
    );
    const centroid = usablePoints.reduce(
      (sum, point) => ({
        east: sum.east + point.east * point.weight,
        north: sum.north + point.north * point.weight,
        x: sum.x + point.x * point.weight,
        z: sum.z + point.z * point.weight,
      }),
      { east: 0, north: 0, x: 0, z: 0 },
    );
    centroid.east /= totalWeight;
    centroid.north /= totalWeight;
    centroid.x /= totalWeight;
    centroid.z /= totalWeight;

    let dot = 0;
    let cross = 0;
    let localEnergy = 0;
    for (const point of usablePoints) {
      const centeredEast = point.east - centroid.east;
      const centeredNorth = point.north - centroid.north;
      const centeredX = point.x - centroid.x;
      const centeredZ = point.z - centroid.z;
      dot +=
        point.weight *
        (centeredEast * centeredX + centeredNorth * centeredZ);
      cross +=
        point.weight *
        (centeredEast * centeredZ - centeredNorth * centeredX);
      localEnergy +=
        point.weight *
        (centeredEast * centeredEast + centeredNorth * centeredNorth);
    }

    if (
      !Number.isFinite(localEnergy) ||
      localEnergy <= MINIMUM_CALIBRATION_DISTANCE_METERS ** 2
    ) {
      return invalidCalibration(
        "invalid",
        "Los puntos GPS no tienen separación suficiente para el ajuste.",
        geoDistanceMeters,
        mapDistanceModelUnits,
      );
    }

    const scaleCosine = dot / localEnergy;
    const scaleSine = cross / localEnergy;
    scaleModelUnitsPerMeter = Math.hypot(scaleCosine, scaleSine);
    rotationRadians = Math.atan2(scaleSine, scaleCosine);
    mapOrigin = {
      x:
        centroid.x -
        scaleCosine * centroid.east +
        scaleSine * centroid.north,
      z:
        centroid.z -
        scaleSine * centroid.east -
        scaleCosine * centroid.north,
    };
  }

  if (
    !Number.isFinite(scaleModelUnitsPerMeter) ||
    scaleModelUnitsPerMeter <= 0 ||
    !Number.isFinite(rotationRadians)
  ) {
    return invalidCalibration(
      "invalid",
      "No fue posible calcular una transformación finita.",
      geoDistanceMeters,
      mapDistanceModelUnits,
    );
  }

  return {
    status: "valid",
    message:
      points.length === 2
        ? "Calibración de dos puntos válida."
        : `Calibración ponderada de ${points.length} puntos válida.`,
    geoDistanceMeters,
    mapDistanceModelUnits,
    transform: {
      reference: { ...pointA.geo },
      mapOrigin,
      scaleModelUnitsPerMeter,
      rotationRadians,
      axisInversion: { ...axisInversion },
    },
  };
}

export function localMetersToCampusPosition(
  localPosition: LocalMetricPosition,
  transform: CampusCalibrationTransform,
  y = USER_MARKER_HEIGHT,
): CampusMapPosition | null {
  const values = [
    localPosition.eastMeters,
    localPosition.northMeters,
    transform.mapOrigin.x,
    transform.mapOrigin.z,
    transform.scaleModelUnitsPerMeter,
    transform.rotationRadians,
    y,
  ];
  if (!values.every(Number.isFinite) || transform.scaleModelUnitsPerMeter <= 0) {
    return null;
  }

  const east = transform.axisInversion.invertEast
    ? -localPosition.eastMeters
    : localPosition.eastMeters;
  const north = transform.axisInversion.invertNorth
    ? -localPosition.northMeters
    : localPosition.northMeters;
  const cosine = Math.cos(transform.rotationRadians);
  const sine = Math.sin(transform.rotationRadians);
  const x =
    transform.mapOrigin.x +
    transform.scaleModelUnitsPerMeter * (east * cosine - north * sine);
  const z =
    transform.mapOrigin.z +
    transform.scaleModelUnitsPerMeter * (east * sine + north * cosine);

  return [x, y, z].every(Number.isFinite) ? { x, y, z } : null;
}

export function gpsToCampusPosition(
  position: GeoReferencePoint,
  transform: CampusCalibrationTransform,
  y = USER_MARKER_HEIGHT,
): CampusMapPosition | null {
  const localPosition = gpsToLocalMeters(position, transform.reference);
  return localPosition
    ? localMetersToCampusPosition(localPosition, transform, y)
    : null;
}

function smoothstep(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function correctionWeight(
  distanceMeters: number,
  correction: CampusLocalCorrectionPoint,
): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return 0;
  if (distanceMeters <= correction.fullEffectRadiusMeters) return 1;
  if (distanceMeters >= correction.falloffRadiusMeters) return 0;
  const range =
    correction.falloffRadiusMeters - correction.fullEffectRadiusMeters;
  if (!Number.isFinite(range) || range <= 0) return 0;
  return 1 - smoothstep(
    (distanceMeters - correction.fullEffectRadiusMeters) / range,
  );
}

export function gpsToLocallyCorrectedCampusPosition(
  position: GeoReferencePoint,
  transform: CampusCalibrationTransform,
  y = USER_MARKER_HEIGHT,
  corrections: readonly CampusLocalCorrectionPoint[] =
    CAMPUS_LOCAL_CORRECTIONS,
): CampusMapPosition | null {
  const basePosition = gpsToCampusPosition(position, transform, y);
  if (!basePosition || corrections.length === 0) return basePosition;

  let weightedDeltaX = 0;
  let weightedDeltaZ = 0;
  let totalWeight = 0;

  for (const correction of corrections) {
    const offsetFromAnchor = gpsToLocalMeters(position, correction.geo);
    const anchorBasePosition = gpsToCampusPosition(
      correction.geo,
      transform,
      y,
    );
    if (!offsetFromAnchor || !anchorBasePosition) continue;

    const distanceMeters = Math.hypot(
      offsetFromAnchor.eastMeters,
      offsetFromAnchor.northMeters,
    );
    const weight = correctionWeight(distanceMeters, correction);
    if (weight <= 0) continue;

    weightedDeltaX += (correction.map.x - anchorBasePosition.x) * weight;
    weightedDeltaZ += (correction.map.z - anchorBasePosition.z) * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return basePosition;
  const appliedWeight = Math.min(totalWeight, 1);
  const corrected = {
    x: basePosition.x + (weightedDeltaX / totalWeight) * appliedWeight,
    y,
    z: basePosition.z + (weightedDeltaZ / totalWeight) * appliedWeight,
  };
  return [corrected.x, corrected.y, corrected.z].every(Number.isFinite)
    ? corrected
    : basePosition;
}

export function metersToModelUnits(
  meters: number,
  scaleModelUnitsPerMeter: number,
): number | null {
  if (
    !Number.isFinite(meters) ||
    meters < 0 ||
    !Number.isFinite(scaleModelUnitsPerMeter) ||
    scaleModelUnitsPerMeter <= 0
  ) {
    return null;
  }
  const modelUnits = meters * scaleModelUnitsPerMeter;
  return Number.isFinite(modelUnits) ? modelUnits : null;
}
