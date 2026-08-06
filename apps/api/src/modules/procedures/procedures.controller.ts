import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { ProceduresService } from "./procedures.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

const proceduresService = new ProceduresService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

// ── Public reads ──────────────────────────────────────────────

export const getProcedures = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query as { kind?: string; buildingId?: string };
  const data = await proceduresService.getAll({
    kind: raw.kind,
    buildingId: raw.buildingId,
  });
  return sendSuccess(res, data);
});

export const getProceduresForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query as { kind?: string };
  const data = await proceduresService.getAllForAdmin({ kind: raw.kind });
  return sendSuccess(res, data);
});

export const getProcedureById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await proceduresService.getById(id);
  return sendSuccess(res, data);
});

export const getProceduresByBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const buildingId = getSingleParam(req.params.id);
    const data = await proceduresService.getByBuilding(buildingId);
    return sendSuccess(res, data);
  }
);

export const getServicesByBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const buildingId = getSingleParam(req.params.id);
    return sendSuccess(res, await proceduresService.getServicesByBuilding(buildingId));
  }
);

// ── Protected: procedure CRUD ─────────────────────────────────

export const createProcedure = asyncHandler(async (req: Request, res: Response) => {
  const data = await proceduresService.create(req.body);
  auditLog({
    req,
    action: "CREATE_PROCEDURE",
    userId: req.authUser?.id,
    resourceType: "procedure",
    resourceId: String(data.id),
    details: { name: data.name, kind: data.kind },
  });
  return sendSuccess(res, data, 201, "Trámite/servicio creado correctamente");
});

export const updateProcedure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await proceduresService.update(id, req.body);
  auditLog({
    req,
    action: "UPDATE_PROCEDURE",
    userId: req.authUser?.id,
    resourceType: "procedure",
    resourceId: id,
    details: { name: data.name },
  });
  return sendSuccess(res, data, 200, "Trámite/servicio actualizado correctamente");
});

export const updateProcedureStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const isActive: boolean = req.body.is_active;
    const data = await proceduresService.updateStatus(id, isActive);
    auditLog({
      req,
      action: "UPDATE_PROCEDURE",
      userId: req.authUser?.id,
      resourceType: "procedure",
      resourceId: id,
      details: { is_active: isActive },
    });
    return sendSuccess(
      res,
      data,
      200,
      isActive
        ? "Trámite/servicio activado correctamente"
        : "Trámite/servicio desactivado correctamente"
    );
  }
);

export const deleteProcedure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleParam(req.params.id);
  const data = await proceduresService.remove(id);
  auditLog({
    req,
    action: "DELETE_PROCEDURE",
    userId: req.authUser?.id,
    resourceType: "procedure",
    resourceId: id,
  });
  return sendSuccess(res, data, 200, "Trámite/servicio eliminado correctamente");
});

// ── Protected: requirements ───────────────────────────────────

export const addRequirement = asyncHandler(async (req: Request, res: Response) => {
  const procedureId = getSingleParam(req.params.id);
  const data = await proceduresService.addRequirement(procedureId, req.body);
  return sendSuccess(res, data, 201, "Requisito añadido correctamente");
});

export const updateRequirement = asyncHandler(async (req: Request, res: Response) => {
  const requirementId = getSingleParam(req.params.id);
  const data = await proceduresService.updateRequirement(requirementId, req.body);
  return sendSuccess(res, data, 200, "Requisito actualizado correctamente");
});

export const deleteRequirement = asyncHandler(async (req: Request, res: Response) => {
  const requirementId = getSingleParam(req.params.id);
  const data = await proceduresService.deleteRequirement(requirementId);
  return sendSuccess(res, data, 200, "Requisito eliminado correctamente");
});

// ── Protected: building associations ─────────────────────────

export const linkProcedureToBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const buildingId = getSingleParam(req.params.id);
    const data = await proceduresService.linkBuilding(buildingId, req.body);
    auditLog({
      req,
      action: "LINK_PROCEDURE_BUILDING",
      userId: req.authUser?.id,
      resourceType: "building_procedure",
      resourceId: buildingId,
      details: { procedure_id: req.body.procedure_id },
    });
    return sendSuccess(res, data, 201, "Trámite/servicio asociado al edificio correctamente");
  }
);

export const unlinkProcedureFromBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const buildingId = getSingleParam(req.params.id);
    const procedureId = getSingleParam(req.params.procedureId);
    const data = await proceduresService.unlinkBuilding(buildingId, procedureId);
    auditLog({
      req,
      action: "UNLINK_PROCEDURE_BUILDING",
      userId: req.authUser?.id,
      resourceType: "building_procedure",
      resourceId: buildingId,
      details: { procedure_id: procedureId },
    });
    return sendSuccess(res, data, 200, "Trámite/servicio desasociado del edificio correctamente");
  }
);
