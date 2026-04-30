import { Router } from "express";
import {
  loginController,
  meController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../modules/auth/middlewares/authenticate.middleware.js";
import { authorize } from "../modules/auth/middlewares/authorize.middleware.js";

const router = Router();

router.post("/login", loginController);
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