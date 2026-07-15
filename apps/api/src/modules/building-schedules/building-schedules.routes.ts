import { Router } from "express";
import {
  createBuildingSchedule,
  deleteBuildingSchedule,
  getBuildingScheduleById,
  getBuildingSchedules,
  updateBuildingSchedule,
  updateBuildingScheduleStatus,
} from "./building-schedules.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  buildingScheduleIdSchema,
  buildingScheduleStatusSchema,
  createBuildingScheduleSchema,
  updateBuildingScheduleSchema,
} from "./building-schedules.schema.js";

const router = Router();

router.get("/", getBuildingSchedules);
router.get("/:id", validateParams(buildingScheduleIdSchema), getBuildingScheduleById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createBuildingScheduleSchema),
  createBuildingSchedule
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingScheduleIdSchema),
  validateBody(updateBuildingScheduleSchema),
  updateBuildingSchedule
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingScheduleIdSchema),
  validateBody(buildingScheduleStatusSchema),
  updateBuildingScheduleStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingScheduleIdSchema),
  deleteBuildingSchedule
);

export default router;
