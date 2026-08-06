import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/response.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { CampusCatalogService } from "./campus-catalog.service.js";

const service = new CampusCatalogService();

function singleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const listStreets = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await service.getStreets())
);

export const listQuickQueries = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await service.getQuickQueries())
);

export const listPositions = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await service.getPositions())
);

export const getPosition = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await service.getPosition(singleParam(req.params.id)))
);

export const listBuildingPositions = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await service.getPositions(singleParam(req.params.id)))
);
