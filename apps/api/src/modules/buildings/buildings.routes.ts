import { Router } from "express";
import {
  createBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildingImages,
  getBuildings,
  updateBuilding,
  updateBuildingStatus,
} from "./buildings.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorize } from "../auth/middlewares/authorize.middleware.js";

const router = Router();

router.get("/", getBuildings);

router.post(
  "/",
  authenticate,
  authorize("superadmin", "admin"),
  createBuilding
);

router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  updateBuilding
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("superadmin", "admin"),
  updateBuildingStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  deleteBuilding
);

router.get("/:id/images", getBuildingImages);
router.get("/:id", getBuildingById);

export default router;