import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { ClassroomsService } from "./classrooms.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const classroomsService = new ClassroomsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getClassrooms = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.buildingId;
  const buildingId = typeof raw === "string" ? raw : undefined;
  const data = await classroomsService.getAll(buildingId);
  return sendSuccess(res, data);
});

export const getClassroomById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await classroomsService.getById(id);
  return sendSuccess(res, data);
});

export const createClassroom = asyncHandler(async (req: Request, res: Response) => {
  const data = await classroomsService.create(req.body);
  auditLog({
    req,
    action: "CREATE_CLASSROOM",
    userId: req.authUser?.id,
    resourceType: "classroom",
    resourceId: String(data.id),
    details: { code: data.code, name: data.name, building_id: data.building_id },
  });
  return sendSuccess(res, data, 201, "Aula creada correctamente");
});

export const updateClassroom = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await classroomsService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_CLASSROOM",
    userId: req.authUser?.id,
    resourceType: "classroom",
    resourceId: id,
    details: { name: data.name },
  });
  return sendSuccess(res, data, 200, "Aula actualizada correctamente");
});

export const updateClassroomStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await classroomsService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_CLASSROOM_STATUS",
    userId: req.authUser?.id,
    resourceType: "classroom",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Aula activada correctamente" : "Aula desactivada correctamente"
  );
});

export const deleteClassroom = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await classroomsService.remove(id);
  auditLog({
    req,
    action: "DELETE_CLASSROOM",
    userId: req.authUser?.id,
    resourceType: "classroom",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Aula eliminada correctamente");
});
