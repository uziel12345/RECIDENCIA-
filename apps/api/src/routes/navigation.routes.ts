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
import { asyncHandler } from "../shared/utils/async-handler.js";

const router = Router();

router.get("/nodes", asyncHandler(getNavigationNodes));
router.get("/edges", asyncHandler(getNavigationEdges));
router.get("/building-entrances", asyncHandler(getBuildingEntrances));
router.get("/route", asyncHandler(getNavigationRoute));

router.post(
  "/cache/invalidate",
  authenticate,
  authorize("superadmin", "admin"),
  asyncHandler(invalidateNavigationCacheController)
);

export default router;
