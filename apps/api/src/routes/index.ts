import { Router } from "express";
import healthRoutes from "../modules/health/health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import buildingsRoutes from "../modules/buildings/buildings.routes.js";
import buildingImagesRoutes from "../modules/building-images/building-images.routes.js";
import classroomsRoutes from "../modules/classrooms/classrooms.routes.js";
import {
  buildingProceduresRouter,
  proceduresRouter,
  requirementsRouter,
} from "../modules/procedures/procedures.routes.js";
import searchRoutes from "../modules/search/search.routes.js";
import studentsRoutes from "../modules/students/students.routes.js";
import professorsRoutes from "../modules/professors/professors.routes.js";
import geolocationRoutes from "../modules/geolocation/geolocation.routes.js";
import {
  schedulesRouter,
  classroomScheduleRouter,
} from "../modules/schedules/schedules.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import teacherCubiclesRoutes from "../modules/teacher-cubicles/teacher-cubicles.routes.js";
import headquartersRoutes from "../modules/headquarters/headquarters.routes.js";
import buildingSchedulesRoutes from "../modules/building-schedules/building-schedules.routes.js";
import { buildingDetailsRouter } from "../modules/building-details/building-details.routes.js";
import gatesRoutes from "../modules/gates/gates.routes.js";
import campusCatalogRoutes from "../modules/campus-catalog/campus-catalog.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/buildings", buildingsRoutes);
router.use("/buildings", buildingProceduresRouter);
router.use("/building-images", buildingImagesRoutes);
router.use("/classrooms", classroomsRoutes);
router.use("/classrooms", classroomScheduleRouter);
router.use("/procedures", proceduresRouter);
router.use("/requirements", requirementsRouter);
router.use("/search", searchRoutes);
router.use("/students", studentsRoutes);
router.use("/professors", professorsRoutes);
router.use("/schedules", schedulesRouter);
router.use("/geolocation", geolocationRoutes);
router.use("/departments", departmentsRoutes);
router.use("/teacher-cubicles", teacherCubiclesRoutes);
router.use("/headquarters", headquartersRoutes);
router.use("/building-schedules", buildingSchedulesRoutes);
router.use("/buildings", buildingDetailsRouter); // /buildings/:id/full-details
router.use("/gates", gatesRoutes);
router.use("/", campusCatalogRoutes);

export default router;
