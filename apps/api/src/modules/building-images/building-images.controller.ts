import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingImagesService } from "./building-images.service.js";

const buildingImagesService = new BuildingImagesService();

type RequestWithFile = Request & {
  file?: {
    filename: string;
  };
};

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
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

    const data = await buildingImagesService.createImage({
      buildingId,
      file: req.file,
      title: req.body?.title,
      description: req.body?.description,
      image_type: req.body?.image_type,
      is_cover: req.body?.is_cover,
      sort_order: req.body?.sort_order,
    });

    return sendSuccess(res, data, 201, "Imagen subida correctamente");
  }
);

export const updateBuildingImageStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const imageId = getSingleParam(req.params.imageId);
    const isActive = parseBoolean(req.body?.is_active);

    const data = await buildingImagesService.updateImageStatus(
      imageId,
      isActive
    );

    return sendSuccess(
      res,
      data,
      200,
      isActive
        ? "Imagen activada correctamente"
        : "Imagen desactivada correctamente"
    );
  }
);

export const deleteBuildingImage = asyncHandler(
  async (req: Request, res: Response) => {
    const imageId = getSingleParam(req.params.imageId);

    const data = await buildingImagesService.removeImage(imageId);

    return sendSuccess(res, data, 200, "Imagen eliminada correctamente");
  }
);