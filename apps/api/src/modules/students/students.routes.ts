import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middlewares/validator.js";

const locationRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `loc-stu:${req.authUser?.id ?? ipKeyGenerator(req.ip ?? "unknown")}`,
  message: {
    success: false,
    message: "Límite de consultas de ubicación alcanzado. Intenta en 15 minutos.",
  },
});
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema,
  studentStatusSchema,
  studentControlNumberSchema,
  locationQuerySchema,
} from "./students.schema.js";
import {
  getStudents,
  getStudentById,
  getStudentLocation,
  createStudent,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
} from "./students.controller.js";

const router = Router();

// Location lookup — requires can_view_student_location (servicios_escolares+)
router.get(
  "/:controlNumber/location",
  authenticate,
  locationRateLimit,
  authorizePermission("can_view_student_location"),
  validateParams(studentControlNumberSchema),
  validateQuery(locationQuerySchema),
  getStudentLocation
);

// CRUD — requires can_manage_students (servicios_escolares+)
router.get("/", authenticate, authorizePermission("can_manage_students"), getStudents);
router.get(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(studentIdSchema),
  getStudentById
);
router.post(
  "/",
  authenticate,
  authorizePermission("can_manage_students"),
  validateBody(createStudentSchema),
  createStudent
);
router.put(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(studentIdSchema),
  validateBody(updateStudentSchema),
  updateStudent
);
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(studentIdSchema),
  validateBody(studentStatusSchema),
  updateStudentStatus
);
router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_manage_students"),
  validateParams(studentIdSchema),
  deleteStudent
);

export default router;
