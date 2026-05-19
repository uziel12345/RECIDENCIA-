import { Router } from "express";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import {
  createAdminUser,
  getAdminUserById,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
} from "./admin-users.controller.js";
import {
  adminUserIdSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  updateAdminUserStatusSchema,
} from "./admin-users.schemas.js";

const router = Router();

router.use(authenticate, authorizePermission("can_manage_admin_users"));

router.get("/", getAdminUsers);
router.get("/:id", validateParams(adminUserIdSchema), getAdminUserById);
router.post("/", validateBody(createAdminUserSchema), createAdminUser);
router.patch(
  "/:id",
  validateParams(adminUserIdSchema),
  validateBody(updateAdminUserSchema),
  updateAdminUser
);
router.patch(
  "/:id/status",
  validateParams(adminUserIdSchema),
  validateBody(updateAdminUserStatusSchema),
  updateAdminUserStatus
);

export default router;
