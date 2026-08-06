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
    const safePage = Number(req.query.page);
    const safeLimit = Number(req.query.limit);

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
    const isActive = req.body.is_active as boolean;

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
