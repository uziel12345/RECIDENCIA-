import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createBuildingEntrance,
  createNavigationEdge,
  createNavigationNode,
  deleteNavigationEdge,
  deleteNavigationNode,
  deleteOrphanAccessNodesController,
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  invalidateNavigationCacheController,
  resetAllNavigationController,
} from "./navigation.controller.js";
import {
  createBuildingEntranceSchema,
  createNavigationEdgeSchema,
  createNavigationNodeSchema,
  navigationIdSchema,
} from "./navigation.schema.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";

// Límite específico para los endpoints públicos del grafo (previene scraping masivo)
const navigationReadLimit = rateLimit({
  windowMs: 60_000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiadas solicitudes al grafo de navegación. Intenta en un momento.",
  },
});

const router = Router();

router.get("/nodes", navigationReadLimit, asyncHandler(getNavigationNodes));
router.get("/edges", navigationReadLimit, asyncHandler(getNavigationEdges));
router.get("/building-entrances", navigationReadLimit, asyncHandler(getBuildingEntrances));

router.post(
  "/nodes",
  authenticate,
  authorizePermission("can_edit_navigation"),
  validateBody(createNavigationNodeSchema),
  asyncHandler(createNavigationNode)
);

router.post(
  "/edges",
  authenticate,
  authorizePermission("can_edit_navigation"),
  validateBody(createNavigationEdgeSchema),
  asyncHandler(createNavigationEdge)
);

router.post(
  "/building-entrances",
  authenticate,
  authorizePermission("can_edit_navigation"),
  validateBody(createBuildingEntranceSchema),
  asyncHandler(createBuildingEntrance)
);

router.delete(
  "/nodes/orphan-accesses",
  authenticate,
  authorizePermission("can_edit_navigation"),
  asyncHandler(deleteOrphanAccessNodesController)
);

router.delete(
  "/nodes/:id",
  authenticate,
  authorizePermission("can_edit_navigation"),
  validateParams(navigationIdSchema),
  asyncHandler(deleteNavigationNode)
);

router.delete(
  "/edges/:id",
  authenticate,
  authorizePermission("can_edit_navigation"),
  validateParams(navigationIdSchema),
  asyncHandler(deleteNavigationEdge)
);

router.post(
  "/cache/invalidate",
  authenticate,
  authorizePermission("can_edit_navigation"),
  asyncHandler(invalidateNavigationCacheController)
);

router.delete(
  "/all",
  authenticate,
  authorizePermission("can_edit_navigation"),
  asyncHandler(resetAllNavigationController)
);

export default router;
