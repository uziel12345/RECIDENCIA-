import { apiGet, apiPost } from "./client.js";
import type {
  BuildingGeofence,
  CalibrationPoint,
  CalibrationProfile,
  CreateBuildingGeofenceInput,
  CreateCalibrationPointInput,
  CreateCalibrationProfileInput,
  GenerateDefaultGeofencesResult,
} from "../types/geolocation.types.js";

export function getActiveCalibrationProfileApi(): Promise<CalibrationProfile | null> {
  return apiGet<CalibrationProfile | null>("/geolocation/calibration-profile/active");
}

export function getCalibrationPointsApi(): Promise<CalibrationPoint[]> {
  return apiGet<CalibrationPoint[]>("/geolocation/calibration-points");
}

export function createCalibrationPointApi(
  input: CreateCalibrationPointInput
): Promise<CalibrationPoint> {
  return apiPost<CalibrationPoint, CreateCalibrationPointInput>(
    "/geolocation/calibration-points",
    input
  );
}

export function createCalibrationProfileApi(
  input: CreateCalibrationProfileInput
): Promise<CalibrationProfile> {
  return apiPost<CalibrationProfile, CreateCalibrationProfileInput>(
    "/geolocation/calibration-profiles",
    input
  );
}

export function getBuildingGeofencesApi(): Promise<BuildingGeofence[]> {
  return apiGet<BuildingGeofence[]>("/geolocation/geofences");
}

export function createBuildingGeofenceApi(
  input: CreateBuildingGeofenceInput
): Promise<BuildingGeofence> {
  return apiPost<BuildingGeofence, CreateBuildingGeofenceInput>(
    "/geolocation/geofences",
    input
  );
}

export function generateDefaultGeofencesApi(): Promise<GenerateDefaultGeofencesResult> {
  return apiPost<GenerateDefaultGeofencesResult, undefined>(
    "/geolocation/geofences/generate-defaults",
    undefined
  );
}
