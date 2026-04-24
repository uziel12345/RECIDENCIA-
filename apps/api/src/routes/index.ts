import { Router } from "express";
import healthRoutes from "./health.routes.js";
import buildingsRoutes from "./buildings.routes.js";
import navigationRoutes from "./navigation.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/buildings", buildingsRoutes);
router.use("/navigation", navigationRoutes);

export default router;