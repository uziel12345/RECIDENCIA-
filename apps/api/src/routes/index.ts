import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import buildingsRoutes from "../modules/buildings/buildings.routes.js";
import navigationRoutes from "./navigation.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/buildings", buildingsRoutes);
router.use("/navigation", navigationRoutes);

export default router;