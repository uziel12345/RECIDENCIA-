import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import multer from "multer";
import { ApiError } from "../../shared/errors/api-error.js";
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
    `loc-prof:${req.authUser?.id ?? ipKeyGenerator(req.ip ?? "unknown")}`,
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
  professorSearchQuerySchema,
} from "./professors.schema.js";
import { locationQuerySchema } from "../students/students.schema.js";
import {
  getProfessors,
  getProfessorById,
  getProfessorLocation,
  searchProfessorLocation,
  importProfessorSchedules,
  createProfessor,
  updateProfessor,
  updateProfessorStatus,
  deleteProfessor,
} from "./professors.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    if (!allowed.includes(file.mimetype)) {
      callback(new ApiError(400, "Formato de archivo no permitido. Usa un archivo .xlsx."));
      return;
    }
    callback(null, true);
  },
});

// Location lookup — requires can_view_professor_location (recursos_humanos+)
router.get(
  "/location/search",
  authenticate,
  locationRateLimit,
  authorizePermission("can_view_professor_location"),
  validateQuery(professorSearchQuerySchema),
  searchProfessorLocation
);

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
router.post(
  "/import-schedules",
  authenticate,
  authorizePermission("can_manage_professors"),
  upload.single("file"),
  importProfessorSchedules
);

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
