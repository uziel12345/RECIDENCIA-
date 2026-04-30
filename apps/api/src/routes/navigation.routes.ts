import { Router } from "express";
import {
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  getNavigationRoute,
  invalidateNavigationCacheController,
} from "../controllers/navigation.controller.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorize } from "../modules/auth/middlewares/authorize.middleware.js";

const router = Router();

router.get("/nodes", getNavigationNodes);
router.get("/edges", getNavigationEdges);
router.get("/building-entrances", getBuildingEntrances);
router.get("/route", getNavigationRoute);

router.post(
  "/cache/invalidate",
  authenticate,
  authorize("superadmin", "admin"),
  invalidateNavigationCacheController
);

export default router;