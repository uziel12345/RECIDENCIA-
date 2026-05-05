import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildingImages,
  getBuildings,
  getBuildingsForAdmin,
  updateBuilding,
  updateBuildingStatus,
} from "./buildings.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorize } from "../auth/middlewares/authorize.middleware.js";

const router = Router();

const adminRoles = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
] as const;

router.get("/", getBuildings);

router.get(
  "/admin/all",
  authenticate,
  authorize(...adminRoles),
  getBuildingsForAdmin
);

router.get("/:id/images", getBuildingImages);

router.get("/:id", getBuildingById);

router.post(
  "/",
  authenticate,
  authorize(...adminRoles),
  createBuilding
);

router.put(
  "/:id",
  authenticate,
  authorize(...adminRoles),
  updateBuilding
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(...adminRoles),
  updateBuildingStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize(...adminRoles),
  deleteBuilding
);

export default router;