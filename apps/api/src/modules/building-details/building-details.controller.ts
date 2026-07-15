import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingDetailsService } from "./building-details.service.js";

const buildingDetailsService = new BuildingDetailsService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getBuildingFullDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await buildingDetailsService.getFullDetails(id);
  return sendSuccess(res, data);
});
