import { Router } from "express";
import {
  createBuilding,
  getBuildingById,
  getBuildingImages,
  getBuildings,
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

router.get("/:id/images", getBuildingImages);
router.get("/:id", getBuildingById);

export default router;