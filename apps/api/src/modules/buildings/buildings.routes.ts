import { Router } from "express";
import {
  createBuilding,
  getBuildingById,
  getBuildingImages,
  getBuildings,
} from "./buildings.controller.js";

const router = Router();

router.get("/", getBuildings);
router.post("/", createBuilding);
router.get("/:id/images", getBuildingImages);
router.get("/:id", getBuildingById);

export default router;