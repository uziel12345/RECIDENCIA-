import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  deleteBuildingImage,
  getBuildingImagesForAdmin,
  updateBuildingImageStatus,
  uploadBuildingImage,
} from "./building-images.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorizePermission } from "../auth/middlewares/authorize.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../shared/middlewares/validator.js";
import { ApiError } from "../../shared/errors/api-error.js";
import {
  buildingImageStatusSchema,
  buildingImagesQuerySchema,
  buildingImageUploadSchema,
} from "./building-images.schema.js";
import { sanitizeUploadedImage } from "./building-images.security.js";

type UploadedFileInfo = {
  originalname: string;
  mimetype: string;
};

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

async function verifyMagicBytes(req: Request, res: Response, next: NextFunction) {
  const file = req.file;

  if (!file) return next();

  try {
    await sanitizeUploadedImage(file.path, file.mimetype);

    return next();
  } catch {
    await fs.unlink(file.path).catch(() => undefined);
    await fs.unlink(`${file.path}.sanitized`).catch(() => undefined);
    return res.status(400).json({
      success: false,
      message: "No se pudo verificar el archivo subido.",
    });
  }
}

const router = Router();

// Todas las operaciones de gestión de imágenes requieren sesión administrativa.
// Aplicado a nivel de router para que futuras rutas queden cubiertas por defecto.
router.use(authenticate);

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const uploadDirectory = path.resolve(process.cwd(), "uploads", "buildings");

const buildingImagesParamsSchema = z.object({
  buildingId: z
    .string({ required_error: "El ID del edificio es obligatorio" })
    .uuid("El ID del edificio debe ser un UUID válido"),
});

const imageParamsSchema = z.object({
  imageId: z
    .string({ required_error: "El ID de la imagen es obligatorio" })
    .uuid("El ID de la imagen debe ser un UUID válido"),
});

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: UploadedFileInfo,
    callback: DestinationCallback
  ) => {
    fs.mkdir(uploadDirectory, { recursive: true })
      .then(() => callback(null, uploadDirectory))
      .catch((error) => {
        callback(
          error instanceof Error
            ? error
            : new Error("No se pudo preparar el directorio de imágenes"),
          uploadDirectory
        );
      });
  },

  filename: (
    _req: Request,
    file: UploadedFileInfo,
    callback: FilenameCallback
  ) => {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const extension = mimeToExt[file.mimetype] ?? ".jpg";
    const safeFileName = `${crypto.randomUUID()}${extension}`;

    callback(null, safeFileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: UploadedFileInfo,
    callback: FileFilterCallback
  ) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new ApiError(400, "Formato de imagen no permitido. Usa JPG, PNG o WEBP.")
      );
      return;
    }

    callback(null, true);
  },
});

const uploadRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `building-image:${req.authUser?.id ?? "unknown"}`,
  message: { success: false, message: "Límite de cargas alcanzado. Intenta más tarde." },
});

async function validateUploadedImageBody(req: Request, res: Response, next: NextFunction) {
  const result = buildingImageUploadSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    next();
    return;
  }

  if (req.file?.path) await fs.unlink(req.file.path).catch(() => undefined);
  res.status(400).json({
    success: false,
    message: "Datos de imagen inválidos",
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

router.get(
  "/buildings/:buildingId/images",
  authorizePermission("can_view_buildings"),
  validateParams(buildingImagesParamsSchema),
  validateQuery(buildingImagesQuerySchema),
  getBuildingImagesForAdmin
);

router.post(
  "/buildings/:buildingId/images",
  authorizePermission("can_edit_photos"),
  uploadRateLimit,
  validateParams(buildingImagesParamsSchema),
  upload.single("image"),
  verifyMagicBytes,
  validateUploadedImageBody,
  uploadBuildingImage
);

router.patch(
  "/images/:imageId/status",
  authorizePermission("can_edit_photos"),
  validateParams(imageParamsSchema),
  validateBody(buildingImageStatusSchema),
  updateBuildingImageStatus
);

router.delete(
  "/images/:imageId",
  authorizePermission("can_edit_photos"),
  validateParams(imageParamsSchema),
  deleteBuildingImage
);

export default router;
