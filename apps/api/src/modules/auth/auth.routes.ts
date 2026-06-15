import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createAdminUserController,
  listAdminUsersController,
  loginController,
  logoutController,
  meController,
  updateAdminUserStatusController,
} from "./auth.controller.js";
import { authenticate } from "./middlewares/authenticate.middleware.js";
import { authorizePermission } from "./middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../../shared/middlewares/validator.js";
import { createAdminUserSchema, loginSchema } from "./auth.schema.js";
import { z } from "zod";
import { asyncHandler } from "../../shared/utils/async-handler.js";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.",
  },
});

const router = Router();

const adminUserIdSchema = z.object({
  id: z.string().uuid("El ID del usuario debe ser un UUID válido"),
});

const updateAdminUserStatusSchema = z.object({
  is_active: z.boolean(),
});

router.post("/login", loginRateLimit, validateBody(loginSchema), loginController);
router.post("/logout", authenticate, logoutController);
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
