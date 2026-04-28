import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingsService } from "./buildings.service.js";

const buildingsService = new BuildingsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

export const getBuildings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await buildingsService.getAll();
  return sendSuccess(res, data);
});

export const getBuildingById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.getById(id);
    return sendSuccess(res, data);
  }
);

export const getBuildingImages = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.getImagesByBuildingId(id);
    return sendSuccess(res, data);
  }
);

export const createBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await buildingsService.create(req.body);
    return sendSuccess(res, data, 201, "Edificio creado correctamente");
  }
);
