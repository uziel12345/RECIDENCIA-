import { Router } from "express";
import {
  createHeadquarters,
  deleteHeadquarters,
  getHeadquartersById,
  getHeadquarters,
  updateHeadquarters,
  updateHeadquartersStatus,
} from "./headquarters.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import {
  createHeadquartersSchema,
  headquartersIdSchema,
  headquartersStatusSchema,
  updateHeadquartersSchema,
} from "./headquarters.schema.js";

const router = Router();

router.get("/", getHeadquarters);
router.get("/:id", validateParams(headquartersIdSchema), getHeadquartersById);

router.post(
  "/",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createHeadquartersSchema),
  createHeadquarters
);

router.put(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(headquartersIdSchema),
  validateBody(updateHeadquartersSchema),
  updateHeadquarters
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(headquartersIdSchema),
  validateBody(headquartersStatusSchema),
  updateHeadquartersStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateParams(headquartersIdSchema),
  deleteHeadquarters
);

export default router;
