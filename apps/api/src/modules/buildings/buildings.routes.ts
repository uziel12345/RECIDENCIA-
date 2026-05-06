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

const adminReadRoles = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
] as const;

const buildingEditorRoles = ["superadmin", "admin"] as const;

router.get("/", getBuildings);
router.get("/categories", getCategories);

router.get(
  "/admin/all",
  authenticate,
  authorize(...adminReadRoles),
  getBuildingsForAdmin
);

router.get(
  "/admin/paginated",
  authenticate,
  authorize(...adminReadRoles),
  getBuildingsForAdminPaginated
);

router.get("/:id/images", validateParams(buildingIdSchema), getBuildingImages);

router.get("/:id", validateParams(buildingIdSchema), getBuildingById);

router.post(
  "/",
  authenticate,
  authorize(...buildingEditorRoles),
  validateBody(createBuildingSchema),
  createBuilding
);

router.put(
  "/:id",
  authenticate,
  authorize(...buildingEditorRoles),
  validateParams(buildingIdSchema),
  validateBody(updateBuildingSchema),
  updateBuilding
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(...buildingEditorRoles),
  validateParams(buildingIdSchema),
  updateBuildingStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize(...buildingEditorRoles),
  validateParams(buildingIdSchema),
  deleteBuilding
);

export default router;
