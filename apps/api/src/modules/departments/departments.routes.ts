import { Router } from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
  updateDepartmentStatus,
} from "./departments.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  createDepartmentSchema,
  departmentIdSchema,
  departmentStatusSchema,
  updateDepartmentSchema,
} from "./departments.schema.js";

const router = Router();

router.get("/", getDepartments);
router.get("/:id", validateParams(departmentIdSchema), getDepartmentById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createDepartmentSchema),
  createDepartment
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(departmentIdSchema),
  validateBody(updateDepartmentSchema),
  updateDepartment
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(departmentIdSchema),
  validateBody(departmentStatusSchema),
  updateDepartmentStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(departmentIdSchema),
  deleteDepartment
);

export default router;
