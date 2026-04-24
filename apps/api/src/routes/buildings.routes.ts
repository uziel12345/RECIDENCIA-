import { Router } from "express";
import {
  getBuildingById,
  getBuildingImages,
  getBuildings,
} from "../controllers/buildings.controller.js";

const router = Router();

router.get("/", getBuildings);
router.get("/:id", getBuildingById);
router.get("/:id/images", getBuildingImages);

export default router;