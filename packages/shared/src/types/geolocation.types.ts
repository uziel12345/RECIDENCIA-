export type GeofenceVertex = {
  lat: number;
  lng: number;
};

export type CalibrationPoint = {
  id: string;
  building_id: string | null;
  building_name: string | null;
  building_code: string | null;
  label: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  model_x: number;
  model_z: number;
  is_active: boolean;
  created_at: string;
};

export type CreateCalibrationPointInput = {
  building_id?: string | null;
  label: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  model_x: number;
  model_z: number;
};

export type CalibrationProfile = {
  id: string;
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
  max_residual_meters: number | null;
  avg_residual_meters: number | null;
  is_active: boolean;
  created_at: string;
};

export type CreateCalibrationProfileInput = Omit<
  CalibrationProfile,
  "id" | "is_active" | "created_at"
> & {
  activate?: boolean;
};

export type BuildingGeofence = {
  id: string;
  building_id: string;
  building_name: string;
  building_code: string;
  name: string | null;
  polygon: GeofenceVertex[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateBuildingGeofenceInput = {
  building_id: string;
  name?: string | null;
  polygon: GeofenceVertex[];
  priority?: number;
};

export type GenerateDefaultGeofencesResult = {
  created: number;
  skippedNoGps: number;
  skippedExisting: number;
};
