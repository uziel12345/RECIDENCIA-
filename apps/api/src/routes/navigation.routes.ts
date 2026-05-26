import { Router } from "express";
import {
  createBuildingEntrance,
  createNavigationEdge,
  createNavigationNode,
  deleteNavigationEdge,
  deleteNavigationNode,
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  getNavigationRoute,
  invalidateNavigationCacheController,
} from "../controllers/navigation.controller.js";
import {
  createBuildingEntranceSchema,
  createNavigationEdgeSchema,
  createNavigationNodeSchema,
  navigationIdSchema,
} from "../controllers/navigation.schema.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorize } from "../modules/auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../shared/middlewares/validator.js";
import { asyncHandler } from "../shared/utils/async-handler.js";

const router = Router();

router.get("/nodes", asyncHandler(getNavigationNodes));
router.get("/edges", asyncHandler(getNavigationEdges));
router.get("/building-entrances", asyncHandler(getBuildingEntrances));
router.get("/route", asyncHandler(getNavigationRoute));

router.post(
  "/nodes",
  authenticate,
  authorize("superadmin", "admin"),
  validateBody(createNavigationNodeSchema),
  asyncHandler(createNavigationNode)
);

router.post(
  "/edges",
  authenticate,
  authorize("superadmin", "admin"),
  validateBody(createNavigationEdgeSchema),
  asyncHandler(createNavigationEdge)
);

router.post(
  "/building-entrances",
  authenticate,
  authorize("superadmin", "admin"),
  validateBody(createBuildingEntranceSchema),
  asyncHandler(createBuildingEntrance)
);

router.delete(
  "/nodes/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validateParams(navigationIdSchema),
  asyncHandler(deleteNavigationNode)
);

router.delete(
  "/edges/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validateParams(navigationIdSchema),
  asyncHandler(deleteNavigationEdge)
);

router.post(
  "/cache/invalidate",
  authenticate,
  authorize("superadmin", "admin"),
  asyncHandler(invalidateNavigationCacheController)
);

export default router;
