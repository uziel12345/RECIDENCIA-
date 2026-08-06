import { Router } from "express";
import { validateParams } from "../../shared/middlewares/validator.js";
import {
  getPosition,
  listBuildingPositions,
  listPositions,
  listQuickQueries,
  listStreets,
} from "./campus-catalog.controller.js";
import { catalogIdSchema } from "./campus-catalog.schema.js";

const router = Router();

router.get("/quick-queries", listQuickQueries);
router.get("/streets", listStreets);
router.get("/positions", listPositions);
router.get("/positions/:id", validateParams(catalogIdSchema), getPosition);
router.get(
  "/buildings/:id/positions",
  validateParams(catalogIdSchema),
  listBuildingPositions
);

export default router;
