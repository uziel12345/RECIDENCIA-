import { Router } from "express";
import {
  createGate,
  deleteGate,
  getGateById,
  getGates,
  getGatesForAdmin,
  updateGate,
  updateGateStatus,
} from "./gates.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  createGateSchema,
  gateIdSchema,
  gateStatusSchema,
  updateGateSchema,
} from "./gates.schema.js";

const router = Router();

router.get("/", getGates);

router.get(
  "/admin/all",
  authenticate,
  authorizePermission("can_edit_buildings"),
  getGatesForAdmin
);

router.get("/:id", validateParams(gateIdSchema), getGateById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createGateSchema),
  createGate
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(gateIdSchema),
  validateBody(updateGateSchema),
  updateGate
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(gateIdSchema),
  validateBody(gateStatusSchema),
  updateGateStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(gateIdSchema),
  deleteGate
);

export default router;
