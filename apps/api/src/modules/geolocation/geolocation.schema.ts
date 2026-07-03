import { z } from "zod";

export const geolocationIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCalibrationPointSchema = z.object({
  building_id: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(255),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy_meters: z.coerce.number().nonnegative().nullable().optional(),
  model_x: z.coerce.number().finite(),
  model_z: z.coerce.number().finite(),
});

export const createCalibrationProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ref_lat: z.coerce.number().min(-90).max(90),
  ref_lng: z.coerce.number().min(-180).max(180),
  meters_lat: z.coerce.number().positive(),
  meters_lng: z.coerce.number().positive(),
  a_x: z.coerce.number().finite(),
  b_x: z.coerce.number().finite(),
  c_x: z.coerce.number().finite(),
  a_z: z.coerce.number().finite(),
  b_z: z.coerce.number().finite(),
  c_z: z.coerce.number().finite(),
  max_residual_meters: z.coerce.number().nonnegative().nullable().optional(),
  avg_residual_meters: z.coerce.number().nonnegative().nullable().optional(),
  activate: z.coerce.boolean().default(true),
});

const geofenceVertexSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const createBuildingGeofenceSchema = z.object({
  building_id: z.string().uuid(),
  name: z.string().trim().max(160).nullable().optional(),
  polygon: z.array(geofenceVertexSchema).min(3),
  priority: z.coerce.number().int().default(0),
});
