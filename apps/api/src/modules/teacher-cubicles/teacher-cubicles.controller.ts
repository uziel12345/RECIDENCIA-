import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { TeacherCubiclesService } from "./teacher-cubicles.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const teacherCubiclesService = new TeacherCubiclesService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getTeacherCubicles = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.buildingId;
  const buildingId = typeof raw === "string" ? raw : undefined;
  const data = await teacherCubiclesService.getAll(buildingId);
  return sendSuccess(res, data);
});

export const getTeacherCubicleById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await teacherCubiclesService.getById(id);
  return sendSuccess(res, data);
});

export const createTeacherCubicle = asyncHandler(async (req: Request, res: Response) => {
  const data = await teacherCubiclesService.create(req.body);
  auditLog({
    req,
    action: "CREATE_TEACHER_CUBICLE",
    userId: req.authUser?.id,
    resourceType: "teacher_cubicle",
    resourceId: String(data.id),
    details: { code: data.code, building_id: data.building_id },
  });
  return sendSuccess(res, data, 201, "Cubículo creado correctamente");
});

export const updateTeacherCubicle = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await teacherCubiclesService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_TEACHER_CUBICLE",
    userId: req.authUser?.id,
    resourceType: "teacher_cubicle",
    resourceId: id,
    details: { code: data.code },
  });
  return sendSuccess(res, data, 200, "Cubículo actualizado correctamente");
});

export const updateTeacherCubicleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await teacherCubiclesService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_TEACHER_CUBICLE_STATUS",
    userId: req.authUser?.id,
    resourceType: "teacher_cubicle",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Cubículo activado correctamente" : "Cubículo desactivado correctamente"
  );
});

export const deleteTeacherCubicle = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await teacherCubiclesService.remove(id);
  auditLog({
    req,
    action: "DELETE_TEACHER_CUBICLE",
    userId: req.authUser?.id,
    resourceType: "teacher_cubicle",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Cubículo eliminado correctamente");
});
