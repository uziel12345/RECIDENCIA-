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

export const updateBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.update(id, req.body);

    return sendSuccess(res, data, 200, "Edificio actualizado correctamente");
  }
);

export const updateBuildingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const isActive = parseBoolean(req.body?.is_active);

    const data = await buildingsService.updateStatus(id, isActive);

    return sendSuccess(
      res,
      data,
      200,
      isActive
        ? "Edificio activado correctamente"
        : "Edificio desactivado correctamente"
    );
  }
);

export const deleteBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.remove(id);

    return sendSuccess(res, data, 200, "Edificio eliminado correctamente");
  }
);