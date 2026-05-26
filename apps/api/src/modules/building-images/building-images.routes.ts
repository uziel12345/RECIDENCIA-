import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import { z } from "zod";
import {
  deleteBuildingImage,
  getBuildingImagesForAdmin,
  updateBuildingImageStatus,
  uploadBuildingImage,
} from "./building-images.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorize } from "../auth/middlewares/authorize.middleware.js";
import { validateParams } from "../../shared/middlewares/validator.js";
import { ApiError } from "../../shared/errors/api-error.js";

type UploadedFileInfo = {
  originalname: string;
  mimetype: string;
};

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

const router = Router();

// Todas las operaciones de gestión de imágenes requieren sesión administrativa.
// Aplicado a nivel de router para que futuras rutas queden cubiertas por defecto.
router.use(authenticate);

const adminReadRoles = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
] as const;

const buildingEditorRoles = ["superadmin", "admin"] as const;

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
    fileSize: 2 * 1024 * 1024,
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

router.get(
  "/buildings/:buildingId/images",
  authorize(...adminReadRoles),
  validateParams(buildingImagesParamsSchema),
  getBuildingImagesForAdmin
);

router.post(
  "/buildings/:buildingId/images",
  authorize(...buildingEditorRoles),
  validateParams(buildingImagesParamsSchema),
  upload.single("image"),
  uploadBuildingImage
);

router.patch(
  "/images/:imageId/status",
  authorize(...buildingEditorRoles),
  validateParams(imageParamsSchema),
  updateBuildingImageStatus
);

router.delete(
  "/images/:imageId",
  authorize(...buildingEditorRoles),
  validateParams(imageParamsSchema),
  deleteBuildingImage
);

export default router;
