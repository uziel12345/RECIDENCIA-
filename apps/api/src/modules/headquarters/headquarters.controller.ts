import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { HeadquartersService } from "./headquarters.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const headquartersService = new HeadquartersService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getHeadquarters = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.buildingId;
  const buildingId = typeof raw === "string" ? raw : undefined;
  const data = await headquartersService.getAll(buildingId);
  return sendSuccess(res, data);
});

export const getHeadquartersById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await headquartersService.getById(id);
  return sendSuccess(res, data);
});

export const createHeadquarters = asyncHandler(async (req: Request, res: Response) => {
  const data = await headquartersService.create(req.body);
  auditLog({
    req,
    action: "CREATE_HEADQUARTERS",
    userId: req.authUser?.id,
    resourceType: "headquarters",
    resourceId: String(data.id),
    details: { name: data.name, building_id: data.building_id },
  });
  return sendSuccess(res, data, 201, "Jefatura creada correctamente");
});

export const updateHeadquarters = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await headquartersService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_HEADQUARTERS",
    userId: req.authUser?.id,
    resourceType: "headquarters",
    resourceId: id,
    details: { name: data.name },
  });
  return sendSuccess(res, data, 200, "Jefatura actualizada correctamente");
});

export const updateHeadquartersStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await headquartersService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_HEADQUARTERS_STATUS",
    userId: req.authUser?.id,
    resourceType: "headquarters",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Jefatura activada correctamente" : "Jefatura desactivada correctamente"
  );
});

export const deleteHeadquarters = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await headquartersService.remove(id);
  auditLog({
    req,
    action: "DELETE_HEADQUARTERS",
    userId: req.authUser?.id,
    resourceType: "headquarters",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Jefatura eliminada correctamente");
});
