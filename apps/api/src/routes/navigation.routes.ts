import { Router } from "express";
import {
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
} from "../controllers/navigation.controller.js";

const router = Router();

router.get("/nodes", getNavigationNodes);
router.get("/edges", getNavigationEdges);
router.get("/building-entrances", getBuildingEntrances);

export default router;