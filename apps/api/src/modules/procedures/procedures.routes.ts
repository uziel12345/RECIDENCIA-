import { Router } from "express";
import {
  addRequirement,
  createProcedure,
  deleteProcedure,
  deleteRequirement,
  getProcedureById,
  getProcedures,
  getProceduresByBuilding,
  linkProcedureToBuilding,
  unlinkProcedureFromBuilding,
  updateProcedure,
  updateProcedureStatus,
  updateRequirement,
} from "./procedures.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middlewares/validator.js";
import {
  buildingIdParamsSchema,
  buildingProcedureParamsSchema,
  createProcedureSchema,
  createRequirementSchema,
  linkProcedureSchema,
  procedureIdSchema,
  procedureStatusSchema,
  proceduresQuerySchema,
  requirementIdSchema,
  updateProcedureSchema,
  updateRequirementSchema,
} from "./procedures.schema.js";

// ── /procedures ───────────────────────────────────────────────
const proceduresRouter = Router();

proceduresRouter.get(
  "/",
  validateQuery(proceduresQuerySchema),
  getProcedures
);

proceduresRouter.get(
  "/:id",
  validateParams(procedureIdSchema),
  getProcedureById
);

proceduresRouter.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createProcedureSchema),
  createProcedure
);

proceduresRouter.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(procedureIdSchema),
  validateBody(updateProcedureSchema),
  updateProcedure
);

proceduresRouter.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(procedureIdSchema),
  validateBody(procedureStatusSchema),
  updateProcedureStatus
);

proceduresRouter.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(procedureIdSchema),
  deleteProcedure
);

proceduresRouter.post(
  "/:id/requirements",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(procedureIdSchema),
  validateBody(createRequirementSchema),
  addRequirement
);

// ── /requirements ─────────────────────────────────────────────
const requirementsRouter = Router();

requirementsRouter.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(requirementIdSchema),
  validateBody(updateRequirementSchema),
  updateRequirement
);

requirementsRouter.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(requirementIdSchema),
  deleteRequirement
);

// ── /buildings (sub-routes for procedures) ───────────────────
const buildingProceduresRouter = Router();

buildingProceduresRouter.get(
  "/:id/procedures",
  validateParams(buildingIdParamsSchema),
  getProceduresByBuilding
);

buildingProceduresRouter.post(
  "/:id/procedures",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingIdParamsSchema),
  validateBody(linkProcedureSchema),
  linkProcedureToBuilding
);

buildingProceduresRouter.delete(
  "/:id/procedures/:procedureId",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(buildingProcedureParamsSchema),
  unlinkProcedureFromBuilding
);

export { proceduresRouter, requirementsRouter, buildingProceduresRouter };
