import { Router } from "express";
import healthRoutes from "../modules/health/health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import buildingsRoutes from "../modules/buildings/buildings.routes.js";
import buildingImagesRoutes from "../modules/building-images/building-images.routes.js";
import navigationRoutes from "../modules/navigation/navigation.routes.js";
import classroomsRoutes from "../modules/classrooms/classrooms.routes.js";
import {
  buildingProceduresRouter,
  proceduresRouter,
  requirementsRouter,
} from "../modules/procedures/procedures.routes.js";
import searchRoutes from "../modules/search/search.routes.js";
import studentsRoutes from "../modules/students/students.routes.js";
import professorsRoutes from "../modules/professors/professors.routes.js";
import {
  schedulesRouter,
  classroomScheduleRouter,
} from "../modules/schedules/schedules.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/buildings", buildingsRoutes);
router.use("/buildings", buildingProceduresRouter);
router.use("/building-images", buildingImagesRoutes);
router.use("/navigation", navigationRoutes);
router.use("/classrooms", classroomsRoutes);
router.use("/classrooms", classroomScheduleRouter);
router.use("/procedures", proceduresRouter);
router.use("/requirements", requirementsRouter);
router.use("/search", searchRoutes);
router.use("/students", studentsRoutes);
router.use("/professors", professorsRoutes);
router.use("/schedules", schedulesRouter);

export default router;
