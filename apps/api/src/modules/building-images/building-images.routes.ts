import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import type { Request } from "express";
import multer = require("multer");
import {
  deleteBuildingImage,
  getBuildingImagesForAdmin,
  updateBuildingImageStatus,
  uploadBuildingImage,
} from "./building-images.controller.js";
import { authenticate } from "../auth/middlewares/authenticate.middleware.js";
import { authorize } from "../auth/middlewares/authorize.middleware.js";

type UploadedFileInfo = {
  originalname: string;
  mimetype: string;
};

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

const router = Router();

const adminRoles = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
] as const;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: UploadedFileInfo,
    callback: DestinationCallback
  ) => {
    callback(null, "uploads/buildings");
  },

  filename: (
    _req: Request,
    file: UploadedFileInfo,
    callback: FilenameCallback
  ) => {
    const extension = path.extname(file.originalname).toLowerCase();
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
      callback(new Error("Formato de imagen no permitido. Usa JPG, PNG o WEBP."));
      return;
    }

    callback(null, true);
  },
});

router.get(
  "/buildings/:buildingId/images",
  authenticate,
  authorize(...adminRoles),
  getBuildingImagesForAdmin
);

router.post(
  "/buildings/:buildingId/images",
  authenticate,
  authorize(...adminRoles),
  upload.single("image"),
  uploadBuildingImage
);

router.patch(
  "/images/:imageId/status",
  authenticate,
  authorize(...adminRoles),
  updateBuildingImageStatus
);

router.delete(
  "/images/:imageId",
  authenticate,
  authorize(...adminRoles),
  deleteBuildingImage
);

export default router;