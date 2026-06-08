import { Router } from "express";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middlewares/validator.js";
import { classroomIdSchema } from "../classrooms/classrooms.schema.js";
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdSchema,
  classroomScheduleQuerySchema,
  linkStudentSchema,
  scheduleStudentParamsSchema,
} from "./schedules.schema.js";
import {
  getSchedules,
  getScheduleById,
  getClassroomSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  linkStudentToSchedule,
  unlinkStudentFromSchedule,
} from "./schedules.controller.js";

const schedulesRouter = Router();
const classroomScheduleRouter = Router();

// Protected schedule CRUD — requires can_manage_students (servicios_escolares+)
schedulesRouter.get(
  "/",
  authenticate,
  authorizePermission("can_manage_students"),
  getSchedules
);
schedulesRouter.get(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(scheduleIdSchema),
  getScheduleById
);
schedulesRouter.post(
  "/",
  authenticate,
  authorizePermission("can_manage_students"),
  validateBody(createScheduleSchema),
  createSchedule
);
schedulesRouter.put(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(scheduleIdSchema),
  validateBody(updateScheduleSchema),
  updateSchedule
);
schedulesRouter.delete(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(scheduleIdSchema),
  deleteSchedule
);

// Student enrollment in a schedule
schedulesRouter.post(
  "/:id/students",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(scheduleIdSchema),
  validateBody(linkStudentSchema),
  linkStudentToSchedule
);
schedulesRouter.delete(
  "/:id/students/:studentId",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(scheduleStudentParamsSchema),
  unlinkStudentFromSchedule
);

// Public classroom schedule — no personal data exposed
classroomScheduleRouter.get(
  "/:id/schedule",
  validateParams(classroomIdSchema),
  validateQuery(classroomScheduleQuerySchema),
  getClassroomSchedule
);

export { schedulesRouter, classroomScheduleRouter };
