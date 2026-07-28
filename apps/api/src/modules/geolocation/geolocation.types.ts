import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type GeofenceVertex = {
  lat: number;
  lng: number;
};

export interface CalibrationPointRow extends RowDataPacket {
  id: string;
  building_id: string | null;
  label: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  model_x: number;
  model_z: number;
  is_active: boolean | number;
  created_at: string;
  building_name: string | null;
  building_code: string | null;
}

export interface CalibrationProfileRow extends RowDataPacket {
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
  is_active: boolean | number;
  created_at: string;
}

export interface BuildingGeofenceRow extends RowDataPacket {
  id: string;
  building_id: string;
  name: string | null;
  polygon: string | GeofenceVertex[];
  priority: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
  building_name: string;
  building_code: string;
}
