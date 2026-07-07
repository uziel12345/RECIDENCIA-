import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody } from "../../shared/middlewares/validator.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import {
  createCalibrationPoint,
  createCalibrationProfile,
  createGeofence,
  generateDefaultGeofences,
  getActiveCalibrationProfile,
  getCalibrationPoints,
  getGeofences,
} from "./geolocation.controller.js";
import {
  createBuildingGeofenceSchema,
  createCalibrationPointSchema,
  createCalibrationProfileSchema,
} from "./geolocation.schema.js";

const geolocationReadLimit = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiadas solicitudes de geolocalizacion. Intenta en un momento.",
  },
});

const router = Router();

router.get(
  "/calibration-profile/active",
  geolocationReadLimit,
  asyncHandler(getActiveCalibrationProfile)
);

router.get("/geofences", geolocationReadLimit, asyncHandler(getGeofences));

router.get(
  "/calibration-points",
  authenticate,
  authorizePermission("can_edit_buildings"),
  asyncHandler(getCalibrationPoints)
);

router.post(
  "/calibration-points",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createCalibrationPointSchema),
  asyncHandler(createCalibrationPoint)
);

router.post(
  "/calibration-profiles",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createCalibrationProfileSchema),
  asyncHandler(createCalibrationProfile)
);

router.post(
  "/geofences",
  authenticate,
  authorizePermission("can_edit_buildings"),
  validateBody(createBuildingGeofenceSchema),
  asyncHandler(createGeofence)
);

router.post(
  "/geofences/generate-defaults",
  authenticate,
  authorizePermission("can_edit_buildings"),
  asyncHandler(generateDefaultGeofences)
);

export default router;
