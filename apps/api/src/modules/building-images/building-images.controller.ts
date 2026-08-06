import type { Request, Response } from "express";
import fs from "node:fs/promises";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingImagesService } from "./building-images.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const buildingImagesService = new BuildingImagesService();

type RequestWithFile = Request & {
  file?: {
    filename: string;
    path: string;
  };
};

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export const getBuildingImagesForAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const buildingId = getSingleParam(req.params.buildingId);
    const includeInactive = parseBoolean(req.query.includeInactive);

    const data = await buildingImagesService.getImagesForBuilding(
      buildingId,
      includeInactive
    );

    return sendSuccess(res, data);
  }
);

export const uploadBuildingImage = asyncHandler(
  async (req: RequestWithFile, res: Response) => {
    const buildingId = getSingleParam(req.params.buildingId);

    let data;
    try {
      data = await buildingImagesService.createImage({
        buildingId,
        file: req.file,
        title: req.body?.title,
        description: req.body?.description,
        image_type: req.body?.image_type,
        is_cover: req.body?.is_cover,
        sort_order: req.body?.sort_order,
      });
    } catch (error) {
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => undefined);
      throw error;
    }

    auditLog({
      req, action: "UPLOAD_BUILDING_IMAGE", userId: req.authUser?.id,
      resourceType: "building_image", resourceId: String(data.id),
      details: { building_id: buildingId, filename: req.file?.filename },
    });

    return sendSuccess(res, data, 201, "Imagen subida correctamente");
  }
);

export const updateBuildingImageStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const imageId = getSingleParam(req.params.imageId);
    const isActive = parseBoolean(req.body?.is_active);

    const data = await buildingImagesService.updateImageStatus(imageId, isActive);

    auditLog({
      req, action: "UPDATE_BUILDING_IMAGE_STATUS", userId: req.authUser?.id,
      resourceType: "building_image", resourceId: imageId,
      details: { is_active: isActive },
    });

    return sendSuccess(
      res, data, 200,
      isActive ? "Imagen activada correctamente" : "Imagen desactivada correctamente"
    );
  }
);

export const deleteBuildingImage = asyncHandler(
  async (req: Request, res: Response) => {
    const imageId = getSingleParam(req.params.imageId);

    const data = await buildingImagesService.removeImage(imageId);

    auditLog({
      req, action: "DELETE_BUILDING_IMAGE", userId: req.authUser?.id,
      resourceType: "building_image", resourceId: imageId,
    });

    return sendSuccess(res, data, 200, "Imagen eliminada correctamente");
  }
);
