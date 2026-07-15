import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { DepartmentsService } from "./departments.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const departmentsService = new DepartmentsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.buildingId;
  const buildingId = typeof raw === "string" ? raw : undefined;
  const data = await departmentsService.getAll(buildingId);
  return sendSuccess(res, data);
});

export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await departmentsService.getById(id);
  return sendSuccess(res, data);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentsService.create(req.body);
  auditLog({
    req,
    action: "CREATE_DEPARTMENT",
    userId: req.authUser?.id,
    resourceType: "department",
    resourceId: String(data.id),
    details: { name: data.name, building_id: data.building_id },
  });
  return sendSuccess(res, data, 201, "Departamento creado correctamente");
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await departmentsService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_DEPARTMENT",
    userId: req.authUser?.id,
    resourceType: "department",
    resourceId: id,
    details: { name: data.name },
  });
  return sendSuccess(res, data, 200, "Departamento actualizado correctamente");
});

export const updateDepartmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await departmentsService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_DEPARTMENT_STATUS",
    userId: req.authUser?.id,
    resourceType: "department",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Departamento activado correctamente" : "Departamento desactivado correctamente"
  );
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await departmentsService.remove(id);
  auditLog({
    req,
    action: "DELETE_DEPARTMENT",
    userId: req.authUser?.id,
    resourceType: "department",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Departamento eliminado correctamente");
});
