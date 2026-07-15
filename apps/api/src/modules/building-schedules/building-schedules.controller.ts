import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingSchedulesService } from "./building-schedules.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const buildingSchedulesService = new BuildingSchedulesService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getBuildingSchedules = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.buildingId;
  const buildingId = typeof raw === "string" ? raw : undefined;
  const data = await buildingSchedulesService.getAll(buildingId);
  return sendSuccess(res, data);
});

export const getBuildingScheduleById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await buildingSchedulesService.getById(id);
  return sendSuccess(res, data);
});

export const createBuildingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await buildingSchedulesService.create(req.body);
  auditLog({
    req,
    action: "CREATE_BUILDING_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "building_schedule",
    resourceId: String(data.id),
    details: { building_id: data.building_id, day_of_week: data.day_of_week },
  });
  return sendSuccess(res, data, 201, "Horario creado correctamente");
});

export const updateBuildingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await buildingSchedulesService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_BUILDING_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "building_schedule",
    resourceId: id,
    details: { day_of_week: data.day_of_week },
  });
  return sendSuccess(res, data, 200, "Horario actualizado correctamente");
});

export const updateBuildingScheduleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await buildingSchedulesService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_BUILDING_SCHEDULE_STATUS",
    userId: req.authUser?.id,
    resourceType: "building_schedule",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Horario activado correctamente" : "Horario desactivado correctamente"
  );
});

export const deleteBuildingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await buildingSchedulesService.remove(id);
  auditLog({
    req,
    action: "DELETE_BUILDING_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "building_schedule",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Horario eliminado correctamente");
});
