import { ApiError } from "../../shared/errors/api-error.js";
import { BuildingsRepository } from "../buildings/buildings.repository.js";
import { GeolocationRepository } from "./geolocation.repository.js";
import type {
  BuildingGeofenceRow,
  CalibrationPointRow,
  CalibrationProfileRow,
  GeofenceVertex,
} from "./geolocation.types.js";

const MAX_CALIBRATION_POINT_ACCURACY_METERS = 25;
const MAX_PROFILE_AVG_RESIDUAL_METERS = 15;
const MAX_PROFILE_MAX_RESIDUAL_METERS = 25;
const MIN_AFFINE_DETERMINANT = 0.05;
const MAX_AFFINE_LINEAR_COEFFICIENT = 3;
const MAX_AFFINE_TRANSLATION = 500;

function toBool(value: boolean | number): boolean {
  return value === true || value === 1;
}

function affineDeterminant(input: {
  a_x: number;
  b_x: number;
  a_z: number;
  b_z: number;
}) {
  return input.a_x * input.b_z - input.b_x * input.a_z;
}

function isUsableProfile(input: {
  a_x: number;
  b_x: number;
  c_x: number;
  a_z: number;
  b_z: number;
  c_z: number;
}) {
  return (
    Math.abs(affineDeterminant(input)) >= MIN_AFFINE_DETERMINANT &&
    Math.abs(input.a_x) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(input.b_x) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(input.a_z) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(input.b_z) <= MAX_AFFINE_LINEAR_COEFFICIENT &&
    Math.abs(input.c_x) <= MAX_AFFINE_TRANSLATION &&
    Math.abs(input.c_z) <= MAX_AFFINE_TRANSLATION
  );
}

function parsePolygon(value: string | GeofenceVertex[]): GeofenceVertex[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (point): point is GeofenceVertex =>
        typeof point === "object" &&
        point !== null &&
        Number.isFinite(Number((point as GeofenceVertex).lat)) &&
        Number.isFinite(Number((point as GeofenceVertex).lng))
    );
  } catch {
    return [];
  }
}

function mapCalibrationPoint(row: CalibrationPointRow) {
  return {
    id: row.id,
    building_id: row.building_id,
    building_name: row.building_name,
    building_code: row.building_code,
    label: row.label,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracy_meters:
      row.accuracy_meters === null ? null : Number(row.accuracy_meters),
    model_x: Number(row.model_x),
    model_z: Number(row.model_z),
    is_active: toBool(row.is_active),
    created_at: row.created_at,
  };
}

function mapCalibrationProfile(row: CalibrationProfileRow) {
  return {
    id: row.id,
    name: row.name,
    ref_lat: Number(row.ref_lat),
    ref_lng: Number(row.ref_lng),
    meters_lat: Number(row.meters_lat),
    meters_lng: Number(row.meters_lng),
    a_x: Number(row.a_x),
    b_x: Number(row.b_x),
    c_x: Number(row.c_x),
    a_z: Number(row.a_z),
    b_z: Number(row.b_z),
    c_z: Number(row.c_z),
    max_residual_meters:
      row.max_residual_meters === null ? null : Number(row.max_residual_meters),
    avg_residual_meters:
      row.avg_residual_meters === null ? null : Number(row.avg_residual_meters),
    is_active: toBool(row.is_active),
    created_at: row.created_at,
  };
}

function mapGeofence(row: BuildingGeofenceRow) {
  return {
    id: row.id,
    building_id: row.building_id,
    building_name: row.building_name,
    building_code: row.building_code,
    name: row.name,
    polygon: parsePolygon(row.polygon),
    priority: Number(row.priority),
    is_active: toBool(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class GeolocationService {
  constructor(
    private readonly repository = new GeolocationRepository(),
    private readonly buildingsRepository = new BuildingsRepository()
  ) {}

  async getActiveCalibrationProfile() {
    const profile = await this.repository.findActiveCalibrationProfile();
    return profile ? mapCalibrationProfile(profile) : null;
  }

  async getCalibrationPoints() {
    const points = await this.repository.findCalibrationPoints();
    return points.map(mapCalibrationPoint);
  }

  async createCalibrationPoint(input: {
    building_id?: string | null;
    label: string;
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
    model_x: number;
    model_z: number;
  }) {
    if (
      input.accuracy_meters != null &&
      input.accuracy_meters > MAX_CALIBRATION_POINT_ACCURACY_METERS
    ) {
      throw new ApiError(
        400,
        `La precision GPS (${input.accuracy_meters.toFixed(0)} m) es demasiado baja para calibrar. Usa ${MAX_CALIBRATION_POINT_ACCURACY_METERS} m o mejor.`
      );
    }

    if (input.building_id) {
      const building = await this.buildingsRepository.findById(input.building_id);
      if (!building) throw new ApiError(400, "El edificio indicado no existe");
    }

    const id = await this.repository.insertCalibrationPoint(input);
    const point = await this.repository.findCalibrationPointById(id);
    return point ? mapCalibrationPoint(point) : null;
  }

  async createCalibrationProfile(input: {
    name: string;
    ref_lat: number;
    ref_lng: number;
    meters_lat: number;
    meters_lng: number;
    a_x: number;
    b_x: number;
    c_x: number;
    a_z: number;
    b_z: number;
    c_z: number;
    max_residual_meters?: number | null;
    avg_residual_meters?: number | null;
    activate: boolean;
  }) {
    if (!isUsableProfile(input)) {
      throw new ApiError(400, "El perfil de calibracion no es estable. Repite con puntos GPS mas precisos y separados.");
    }

    if (
      input.avg_residual_meters != null &&
      input.avg_residual_meters > MAX_PROFILE_AVG_RESIDUAL_METERS
    ) {
      throw new ApiError(400, `El error promedio (${input.avg_residual_meters.toFixed(1)} m) es demasiado alto.`);
    }

    if (
      input.max_residual_meters != null &&
      input.max_residual_meters > MAX_PROFILE_MAX_RESIDUAL_METERS
    ) {
      throw new ApiError(400, `El error maximo (${input.max_residual_meters.toFixed(1)} m) es demasiado alto.`);
    }

    const id = await this.repository.insertCalibrationProfile(input);
    const profile = await this.repository.findCalibrationProfileById(id);
    return profile ? mapCalibrationProfile(profile) : null;
  }

  async getGeofences() {
    const geofences = await this.repository.findActiveGeofences();
    return geofences.map(mapGeofence);
  }

  async createGeofence(input: {
    building_id: string;
    name?: string | null;
    polygon: GeofenceVertex[];
    priority: number;
  }) {
    const building = await this.buildingsRepository.findById(input.building_id);
    if (!building) throw new ApiError(400, "El edificio indicado no existe");

    const id = await this.repository.insertBuildingGeofence(input);
    const geofence = await this.repository.findGeofenceById(id);
    return geofence ? mapGeofence(geofence) : null;
  }

  /**
   * Genera un cuadro de ~20m alrededor del GPS de cada edificio activo que
   * todavia no tenga una geocerca. Equivalente a la migracion
   * migration-building-geofences-default-20260702.sql, pero disparable desde
   * el panel de admin en vez de requerir correr SQL a mano.
   */
  async generateDefaultGeofences() {
    const [buildings, existingGeofences] = await Promise.all([
      this.buildingsRepository.findAllActive(),
      this.repository.findActiveGeofences(),
    ]);

    const buildingsWithGeofence = new Set(
      existingGeofences.map((geofence) => geofence.building_id)
    );

    const HALF_LAT = 0.00017966; // ~20 m
    const HALF_LNG = 0.00018795;

    let created = 0;
    let skippedNoGps = 0;
    let skippedExisting = 0;

    for (const building of buildings) {
      if (buildingsWithGeofence.has(building.id)) {
        skippedExisting++;
        continue;
      }
      if (building.latitude == null || building.longitude == null) {
        skippedNoGps++;
        continue;
      }

      const lat = Number(building.latitude);
      const lng = Number(building.longitude);

      await this.repository.insertBuildingGeofence({
        building_id: building.id,
        name: `Geocerca inicial ${building.code}`,
        priority: 0,
        polygon: [
          { lat: lat + HALF_LAT, lng: lng - HALF_LNG },
          { lat: lat + HALF_LAT, lng: lng + HALF_LNG },
          { lat: lat - HALF_LAT, lng: lng + HALF_LNG },
          { lat: lat - HALF_LAT, lng: lng - HALF_LNG },
        ],
      });
      created++;
    }

    return { created, skippedNoGps, skippedExisting };
  }
}
