import { Router } from "express";
import {
  createTeacherCubicle,
  deleteTeacherCubicle,
  getTeacherCubicleById,
  getTeacherCubicles,
  updateTeacherCubicle,
  updateTeacherCubicleStatus,
} from "./teacher-cubicles.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  createTeacherCubicleSchema,
  teacherCubicleIdSchema,
  teacherCubicleStatusSchema,
  updateTeacherCubicleSchema,
} from "./teacher-cubicles.schema.js";

const router = Router();

router.get("/", getTeacherCubicles);
router.get("/:id", validateParams(teacherCubicleIdSchema), getTeacherCubicleById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createTeacherCubicleSchema),
  createTeacherCubicle
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(teacherCubicleIdSchema),
  validateBody(updateTeacherCubicleSchema),
  updateTeacherCubicle
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(teacherCubicleIdSchema),
  validateBody(teacherCubicleStatusSchema),
  updateTeacherCubicleStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(teacherCubicleIdSchema),
  deleteTeacherCubicle
);

export default router;
