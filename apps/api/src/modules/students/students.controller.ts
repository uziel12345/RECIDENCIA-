import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { auditLog } from "../../shared/services/audit.service.js";
import { StudentsService } from "./students.service.js";
import { getMindboxService } from "../mindbox/mindbox.service.js";

const service = new StudentsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getStudents = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getAll();
  return sendSuccess(res, data);
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.getById(id);
  return sendSuccess(res, data);
});

export const getStudentSchedules = asyncHandler(async (req: Request, res: Response) => {
  const controlNumber = getSingleParam(req.params.controlNumber);
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const data = await service.getSchedules(controlNumber, period);
  return sendSuccess(res, data);
});

// Horario desde Mindbox — requiere MINDBOX_BASE_URL y MINDBOX_API_TOKEN en .env
export const getMindboxSchedule = asyncHandler(async (req: Request, res: Response) => {
  const controlNumber = getSingleParam(req.params.controlNumber);
  const mindbox = getMindboxService();
  const data = await mindbox.getStudentSchedule(controlNumber);
  return sendSuccess(res, data);
});

export const getStudentLocation = asyncHandler(async (req: Request, res: Response) => {
  const controlNumber = getSingleParam(req.params.controlNumber);
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const at = typeof req.query.at === "string" ? req.query.at : undefined;

  const data = await service.getLocation(controlNumber, period, at);

  auditLog({
    req,
    action: "VIEW_STUDENT_LOCATION",
    userId: req.authUser?.id,
    resourceType: "student",
    resourceId: data.student.id,
    details: { control_number: controlNumber, period, at },
  });

  return sendSuccess(res, data);
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  auditLog({
    req,
    action: "CREATE_STUDENT",
    userId: req.authUser?.id,
    resourceType: "student",
    resourceId: data.id,
  });
  return sendSuccess(res, data, 201);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_STUDENT",
    userId: req.authUser?.id,
    resourceType: "student",
    resourceId: id,
  });
  return sendSuccess(res, data);
});

export const updateStudentStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.updateStatus(id, req.body.is_active as boolean);
  auditLog({
    req,
    action: "UPDATE_STUDENT",
    userId: req.authUser?.id,
    resourceType: "student",
    resourceId: id,
    details: { is_active: req.body.is_active },
  });
  return sendSuccess(res, data);
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.remove(id);
  auditLog({
    req,
    action: "DELETE_STUDENT",
    userId: req.authUser?.id,
    resourceType: "student",
    resourceId: id,
  });
  return sendSuccess(res, data);
});
