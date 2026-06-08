import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { auditLog } from "../../shared/services/audit.service.js";
import { ProfessorsService } from "./professors.service.js";

const service = new ProfessorsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getProfessors = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getAll();
  return sendSuccess(res, data);
});

export const getProfessorById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.getById(id);
  return sendSuccess(res, data);
});

export const getProfessorLocation = asyncHandler(async (req: Request, res: Response) => {
  const employeeNumber = getSingleParam(req.params.employeeNumber);
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const at = typeof req.query.at === "string" ? req.query.at : undefined;

  const data = await service.getLocation(employeeNumber, period, at);

  auditLog({
    req,
    action: "VIEW_PROFESSOR_LOCATION",
    userId: req.authUser?.id,
    resourceType: "professor",
    resourceId: data.professor.id,
    details: { employee_number: employeeNumber, period, at },
  });

  return sendSuccess(res, data);
});

export const createProfessor = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  auditLog({
    req,
    action: "CREATE_PROFESSOR",
    userId: req.authUser?.id,
    resourceType: "professor",
    resourceId: data.id,
  });
  return sendSuccess(res, data, 201);
});

export const updateProfessor = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_PROFESSOR",
    userId: req.authUser?.id,
    resourceType: "professor",
    resourceId: id,
  });
  return sendSuccess(res, data);
});

export const updateProfessorStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.updateStatus(id, req.body.is_active as boolean);
  auditLog({
    req,
    action: "UPDATE_PROFESSOR",
    userId: req.authUser?.id,
    resourceType: "professor",
    resourceId: id,
    details: { is_active: req.body.is_active },
  });
  return sendSuccess(res, data);
});

export const deleteProfessor = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.remove(id);
  auditLog({
    req,
    action: "DELETE_PROFESSOR",
    userId: req.authUser?.id,
    resourceType: "professor",
    resourceId: id,
  });
  return sendSuccess(res, data);
});
