import { Router } from "express";
import {
  createAdminUserController,
  listAdminUsersController,
  loginController,
  meController,
  updateAdminUserStatusController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../modules/auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../shared/middlewares/validator.js";
import { createAdminUserSchema, loginSchema } from "../modules/auth/auth.schema.js";
import { z } from "zod";
import { asyncHandler } from "../shared/utils/async-handler.js";

const router = Router();

const adminUserIdSchema = z.object({
  id: z.string().uuid("El ID del usuario debe ser un UUID vÃ¡lido"),
});

const updateAdminUserStatusSchema = z.object({
  is_active: z.boolean(),
});

router.post("/login", validateBody(loginSchema), loginController);
router.get("/me", authenticate, meController);

router.get(
  "/admin-users",
  authenticate,
  authorizePermission("can_manage_admin_users"),
  asyncHandler(listAdminUsersController)
);

router.post(
  "/admin-users",
  authenticate,
  authorizePermission("can_manage_admin_users"),
  validateBody(createAdminUserSchema),
  asyncHandler(createAdminUserController)
);

router.patch(
  "/admin-users/:id/status",
  authenticate,
  authorizePermission("can_manage_admin_users"),
  validateParams(adminUserIdSchema),
  validateBody(updateAdminUserStatusSchema),
  asyncHandler(updateAdminUserStatusController)
);

router.get(
  "/admin-check",
  authenticate,
  authorizePermission("can_view_buildings"),
  (_req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        message: "Acceso autorizado al área administrativa",
      },
    });
  }
);

export default router;
