import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { GatesService } from "./gates.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const gatesService = new GatesService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export const getGates = asyncHandler(async (_req: Request, res: Response) => {
  const data = await gatesService.getAll();
  return sendSuccess(res, data);
});

export const getGatesForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const data = await gatesService.getAllForAdmin();
  return sendSuccess(res, data);
});

export const getGateById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await gatesService.getById(id);
  return sendSuccess(res, data);
});

export const createGate = asyncHandler(async (req: Request, res: Response) => {
  const data = await gatesService.create(req.body);
  auditLog({
    req,
    action: "CREATE_GATE",
    userId: req.authUser?.id,
    resourceType: "gate",
    resourceId: String(data.id),
    details: { name: data.name },
  });
  return sendSuccess(res, data, 201, "Puerta creada correctamente");
});

export const updateGate = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await gatesService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_GATE",
    userId: req.authUser?.id,
    resourceType: "gate",
    resourceId: id,
    details: { name: data.name },
  });
  return sendSuccess(res, data, 200, "Puerta actualizada correctamente");
});

export const updateGateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const isActive: boolean = req.body.is_active;
  const data = await gatesService.updateStatus(id, isActive);
  auditLog({
    req,
    action: "UPDATE_GATE_STATUS",
    userId: req.authUser?.id,
    resourceType: "gate",
    resourceId: id,
    details: { is_active: isActive },
  });
  return sendSuccess(
    res,
    data,
    200,
    isActive ? "Puerta activada correctamente" : "Puerta desactivada correctamente"
  );
});

export const deleteGate = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await gatesService.remove(id);
  auditLog({
    req,
    action: "DELETE_GATE",
    userId: req.authUser?.id,
    resourceType: "gate",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Puerta eliminada correctamente");
});
