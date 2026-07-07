import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/response.js";
import { auditLog } from "../../shared/services/audit.service.js";
import { GeolocationService } from "./geolocation.service.js";

const service = new GeolocationService();

export async function getActiveCalibrationProfile(_req: Request, res: Response) {
  const profile = await service.getActiveCalibrationProfile();
  res.setHeader("Cache-Control", "no-store");
  return sendSuccess(res, profile);
}

export async function getCalibrationPoints(_req: Request, res: Response) {
  const points = await service.getCalibrationPoints();
  res.setHeader("Cache-Control", "no-store");
  return sendSuccess(res, points);
}

export async function createCalibrationPoint(req: Request, res: Response) {
  const point = await service.createCalibrationPoint(req.body);
  auditLog({
    req,
    action: "CREATE_CALIBRATION_POINT",
    userId: req.authUser?.id,
    resourceType: "calibration_point",
    resourceId: point?.id,
    details: { building_id: req.body.building_id, label: req.body.label },
  });
  return sendSuccess(res, point, 201, "Punto de calibracion guardado");
}

export async function createCalibrationProfile(req: Request, res: Response) {
  const profile = await service.createCalibrationProfile(req.body);
  auditLog({
    req,
    action: "CREATE_CALIBRATION_PROFILE",
    userId: req.authUser?.id,
    resourceType: "calibration_profile",
    resourceId: profile?.id,
    details: { name: req.body.name, activate: req.body.activate },
  });
  return sendSuccess(res, profile, 201, "Perfil de calibracion guardado");
}

export async function getGeofences(_req: Request, res: Response) {
  const geofences = await service.getGeofences();
  res.setHeader("Cache-Control", "no-store");
  return sendSuccess(res, geofences);
}

export async function createGeofence(req: Request, res: Response) {
  const geofence = await service.createGeofence(req.body);
  auditLog({
    req,
    action: "CREATE_BUILDING_GEOFENCE",
    userId: req.authUser?.id,
    resourceType: "building_geofence",
    resourceId: geofence?.id,
    details: { building_id: req.body.building_id },
  });
  return sendSuccess(res, geofence, 201, "Geocerca guardada");
}

export async function generateDefaultGeofences(req: Request, res: Response) {
  const result = await service.generateDefaultGeofences();
  auditLog({
    req,
    action: "GENERATE_DEFAULT_GEOFENCES",
    userId: req.authUser?.id,
    resourceType: "building_geofence",
    details: result,
  });
  return sendSuccess(
    res,
    result,
    200,
    `${result.created} geocercas generadas`
  );
}
