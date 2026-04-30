import { Router } from "express";
import healthRoutes from "./health.routes.js";
import buildingsRoutes from "../modules/buildings/buildings.routes.js";
import navigationRoutes from "./navigation.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/buildings", buildingsRoutes);
router.use("/navigation", navigationRoutes);
router.use("/auth", authRoutes);

export default router;