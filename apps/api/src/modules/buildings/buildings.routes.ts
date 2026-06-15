import { Router } from "express";
import {
  addBuildingService,
  createBuilding,
  deleteBuilding,
  deleteBuildingService,
  getBuildingById,
  getBuildingImages,
  getBuildingServices,
  getBuildings,
  getBuildingsForAdmin,
  getBuildingsForAdminPaginated,
  getCategories,
  updateBuilding,
  updateBuildingStatus,
} from "./buildings.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import { createBuildingSchema, updateBuildingSchema, buildingIdSchema, createBuildingServiceSchema } from "./buildings.schema.js";

const router = Router();

router.get("/", getBuildings);
router.get("/categories", getCategories);

router.get(
  "/admin/all",
  authenticate,
  authorizePermission("can_view_buildings"),
  getBuildingsForAdmin
);

router.get(
  "/admin/paginated",
  authenticate,
  authorizePermission("can_view_buildings"),
  getBuildingsForAdminPaginated
);

router.get("/:id/images", validateParams(buildingIdSchema), getBuildingImages);
router.get("/:id/services", validateParams(buildingIdSchema), getBuildingServices);

router.post(
  "/:id/services",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdSchema),
  validateBody(createBuildingServiceSchema),
  addBuildingService
);

router.delete(
  "/:id/services/:serviceId",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdSchema),
  deleteBuildingService
);

router.get("/:id", validateParams(buildingIdSchema), getBuildingById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createBuildingSchema),
  createBuilding
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdSchema),
  validateBody(updateBuildingSchema),
  updateBuilding
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdSchema),
  updateBuildingStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdSchema),
  deleteBuilding
);

export default router;
