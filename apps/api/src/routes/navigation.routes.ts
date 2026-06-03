import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  resetAllNavigationController,
} from "../controllers/navigation.controller.js";
import {
  createBuildingEntranceSchema,
  createNavigationEdgeSchema,
  createNavigationNodeSchema,
  navigationIdSchema,
} from "../controllers/navigation.schema.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../modules/auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../shared/middlewares/validator.js";
import { asyncHandler } from "../shared/utils/async-handler.js";

// Límite específico para los endpoints públicos del grafo (previene scraping masivo)
const navigationReadLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
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
router.get("/route", navigationReadLimit, asyncHandler(getNavigationRoute));

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
  authorizePermission("can_manage_admin_users"),
  asyncHandler(resetAllNavigationController)
);

export default router;
