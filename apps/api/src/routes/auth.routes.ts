import { Router } from "express";
import {
  loginController,
  meController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorize } from "../modules/auth/middlewares/authorize.middleware.js";
import { validateBody } from "../shared/middlewares/validator.js";
import { loginSchema } from "../modules/auth/auth.schema.js";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.get("/me", authenticate, meController);

router.get(
  "/admin-check",
  authenticate,
  authorize("superadmin", "admin"),
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