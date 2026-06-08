import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  keyGenerator: (req) => `loc-prof:${req.authUser?.id ?? req.ip ?? "anon"}`,
  message: {
    success: false,
    message: "Límite de consultas de ubicación alcanzado. Intenta en 15 minutos.",
  },
});
import {
  createProfessorSchema,
  updateProfessorSchema,
  professorIdSchema,
  professorStatusSchema,
  professorEmployeeNumberSchema,
} from "./professors.schema.js";
import { locationQuerySchema } from "../students/students.schema.js";
import {
  getProfessors,
  getProfessorById,
  getProfessorLocation,
  createProfessor,
  updateProfessor,
  updateProfessorStatus,
  deleteProfessor,
} from "./professors.controller.js";

const router = Router();

// Location lookup — requires can_view_professor_location (recursos_humanos+)
router.get(
  "/:employeeNumber/location",
  authenticate,
  locationRateLimit,
  authorizePermission("can_view_professor_location"),
  validateParams(professorEmployeeNumberSchema),
  validateQuery(locationQuerySchema),
  getProfessorLocation
);

// CRUD — requires can_manage_professors (recursos_humanos+)
router.get("/", authenticate, authorizePermission("can_manage_professors"), getProfessors);
router.get(
  "/:id",
  authenticate,
  authorizePermission("can_manage_professors"),
  validateParams(professorIdSchema),
  getProfessorById
);
router.post(
  "/",
  authenticate,
  authorizePermission("can_manage_professors"),
  validateBody(createProfessorSchema),
  createProfessor
);
router.put(
  "/:id",
  authenticate,
  authorizePermission("can_manage_professors"),
  validateParams(professorIdSchema),
  validateBody(updateProfessorSchema),
  updateProfessor
);
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("can_manage_professors"),
  validateParams(professorIdSchema),
  validateBody(professorStatusSchema),
  updateProfessorStatus
);
router.delete(
  "/:id",
  authenticate,
  authorizePermission("can_manage_professors"),
  validateParams(professorIdSchema),
  deleteProfessor
);

export default router;
