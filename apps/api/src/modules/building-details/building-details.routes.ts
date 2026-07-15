import { Router } from "express";
import { getBuildingFullDetails } from "./building-details.controller.js";
import { validateParams } from "../../shared/middlewares/validator.js";
import { buildingIdParamsSchema } from "./building-details.schema.js";

// Montado bajo /buildings (igual que buildingProceduresRouter) — path distinto de
// /buildings/:id, no hay choque de rutas.
export const buildingDetailsRouter = Router();

buildingDetailsRouter.get(
  "/:id/full-details",
  validateParams(buildingIdParamsSchema),
  getBuildingFullDetails
);
