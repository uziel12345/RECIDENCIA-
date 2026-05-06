import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildingImages,
  getBuildings,
  getBuildingsForAdmin,
  getBuildingsForAdminPaginated,
  getCategories,
  updateBuilding,
  updateBuildingStatus,
} from "./buildings.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorize } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import { createBuildingSchema, updateBuildingSchema, buildingIdSchema } from "./buildings.schema.js";

const router = Router();

const adminRoles = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
] as const;

router.get("/", getBuildings);
router.get("/categories", getCategories);

router.get(
  "/admin/all",
  authenticate,
  authorize(...adminRoles),
  getBuildingsForAdmin
);

router.get(
  "/admin/paginated",
  authenticate,
  authorize(...adminRoles),
  getBuildingsForAdminPaginated
);

router.get("/:id/images", validateParams(buildingIdSchema), getBuildingImages);

router.get("/:id", validateParams(buildingIdSchema), getBuildingById);

router.post(
  "/",
  authenticate,
  authorize(...adminRoles),
  validateBody(createBuildingSchema),
  createBuilding
);

router.put(
  "/:id",
  authenticate,
  authorize(...adminRoles),
  validateParams(buildingIdSchema),
  validateBody(updateBuildingSchema),
  updateBuilding
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(...adminRoles),
  validateParams(buildingIdSchema),
  updateBuildingStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize(...adminRoles),
  validateParams(buildingIdSchema),
  deleteBuilding
);

export default router;