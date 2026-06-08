import { Router } from "express";
import {
  createClassroom,
  deleteClassroom,
  getClassroomById,
  getClassrooms,
  updateClassroom,
  updateClassroomStatus,
} from "./classrooms.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  classroomIdSchema,
  classroomStatusSchema,
  createClassroomSchema,
  updateClassroomSchema,
} from "./classrooms.schema.js";

const router = Router();

router.get("/", getClassrooms);
router.get("/:id", validateParams(classroomIdSchema), getClassroomById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createClassroomSchema),
  createClassroom
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(classroomIdSchema),
  validateBody(updateClassroomSchema),
  updateClassroom
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(classroomIdSchema),
  validateBody(classroomStatusSchema),
  updateClassroomStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(classroomIdSchema),
  deleteClassroom
);

export default router;
