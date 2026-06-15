import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { BuildingsService } from "./buildings.service.js";
import { auditLog } from "../../shared/services/audit.service.js";

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

export const getBuildingsForAdmin = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await buildingsService.getAllForAdmin();
    return sendSuccess(res, data);
  }
);

export const getBuildingsForAdminPaginated = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(String(req.query.page), 10);
    const limit = parseInt(String(req.query.limit), 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;

    const { rows, total } = await buildingsService.getAllForAdminPaginated(
      safePage,
      safeLimit
    );

    return sendSuccess(res, {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  }
);

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
    auditLog({
      req, action: "CREATE_BUILDING", userId: req.authUser?.id,
      resourceType: "building", resourceId: String(data.id),
      details: { name: data.name, code: data.code },
    });
    return sendSuccess(res, data, 201, "Edificio creado correctamente");
  }
);

export const updateBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.update(id, req.body);
    auditLog({
      req, action: "UPDATE_BUILDING", userId: req.authUser?.id,
      resourceType: "building", resourceId: id,
      details: { name: data.name },
    });
    return sendSuccess(res, data, 200, "Edificio actualizado correctamente");
  }
);

export const updateBuildingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const isActive = parseBoolean(req.body?.is_active);

    const data = await buildingsService.updateStatus(id, isActive);
    auditLog({
      req, action: "UPDATE_BUILDING_STATUS", userId: req.authUser?.id,
      resourceType: "building", resourceId: id,
      details: { is_active: isActive },
    });
    return sendSuccess(
      res,
      data,
      200,
      isActive ? "Edificio activado correctamente" : "Edificio desactivado correctamente"
    );
  }
);

export const deleteBuilding = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.remove(id);
    auditLog({
      req, action: "DELETE_BUILDING", userId: req.authUser?.id,
      resourceType: "building", resourceId: id,
    });
    return sendSuccess(res, data, 200, "Edificio eliminado correctamente");
  }
);

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await buildingsService.getCategories();
  return sendSuccess(res, data);
});

// ── Building services ─────────────────────────────────────────────────────────

export const getBuildingServices = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await buildingsService.getServices(id);
    return sendSuccess(res, data);
  }
);

export const addBuildingService = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const name = String(req.body.name ?? "").trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    const service = await buildingsService.addService(id, name, description);
    auditLog({
      req, action: "ADD_BUILDING_SERVICE", userId: req.authUser?.id,
      resourceType: "building_service", resourceId: service?.id,
      details: { building_id: id, name },
    });
    return sendSuccess(res, service, 201, "Servicio agregado correctamente");
  }
);

export const deleteBuildingService = asyncHandler(
  async (req: Request, res: Response) => {
    const serviceId = getSingleParam(req.params.serviceId);
    await buildingsService.removeService(serviceId);
    auditLog({
      req, action: "DELETE_BUILDING_SERVICE", userId: req.authUser?.id,
      resourceType: "building_service", resourceId: serviceId,
    });
    return sendSuccess(res, { id: serviceId }, 200, "Servicio eliminado correctamente");
  }
);