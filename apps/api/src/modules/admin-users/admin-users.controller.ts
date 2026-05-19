import type { Request, Response } from "express";
import { sendSuccess } from "../../shared/http/response.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { AdminUsersService } from "./admin-users.service.js";

const adminUsersService = new AdminUsersService();

function getSingleParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

export const getAdminUsers = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await adminUsersService.getAll();
    return sendSuccess(res, data);
  }
);

export const getAdminUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await adminUsersService.getById(id);
    return sendSuccess(res, data);
  }
);

export const createAdminUser = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await adminUsersService.create(req.body);
    return sendSuccess(res, data, 201, "Usuario administrador creado");
  }
);

export const updateAdminUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await adminUsersService.update(id, req.body);
    return sendSuccess(res, data, 200, "Usuario administrador actualizado");
  }
);

export const updateAdminUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getSingleParam(req.params.id);
    const data = await adminUsersService.updateStatus(id, req.body.is_active);
    return sendSuccess(res, data, 200, "Estado del usuario actualizado");
  }
);
