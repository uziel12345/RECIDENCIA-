import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { auditLog } from "../../shared/services/audit.service.js";
import { SchedulesService } from "./schedules.service.js";

const service = new SchedulesService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const data = await service.getAll(period);
  return sendSuccess(res, data);
});

export const getScheduleById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.getById(id);
  return sendSuccess(res, data);
});

// Public: returns only subject/time/day — no personal data
export const getClassroomSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const period = typeof req.query.period === "string" ? req.query.period : undefined;
  const rawDay = req.query.day;
  const day = typeof rawDay === "string" ? Number(rawDay) : undefined;
  const data = await service.getByClassroom(id, period, day);
  return sendSuccess(res, data);
});

export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  auditLog({
    req,
    action: "CREATE_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "schedule",
    resourceId: data.id,
  });
  return sendSuccess(res, data, 201);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "schedule",
    resourceId: id,
  });
  return sendSuccess(res, data);
});

export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await service.remove(id);
  auditLog({
    req,
    action: "DELETE_SCHEDULE",
    userId: req.authUser?.id,
    resourceType: "schedule",
    resourceId: id,
  });
  return sendSuccess(res, data);
});

export const linkStudentToSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const { student_id } = req.body as { student_id: string };
  const data = await service.linkStudent(id, student_id);
  return sendSuccess(res, data, 201);
});

export const unlinkStudentFromSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const studentId = getSingleParam(req.params.studentId);
    const data = await service.unlinkStudent(id, studentId);
    return sendSuccess(res, data);
  }
);
