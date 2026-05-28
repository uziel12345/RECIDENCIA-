import type { NextFunction, Request, Response } from "express";
import { ROLE_PERMISSIONS, type RolePermissions, type UserRole } from "@ito-map/shared";

type PermissionName = keyof RolePermissions;

export function authorize(...allowedRoles: UserRole[]) {
  return function authorizeMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const user = req.authUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
      });
    }

    return next();
  };
}

export function authorizePermission(permission: PermissionName) {
  return function authorizePermissionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const user = req.authUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!ROLE_PERMISSIONS[user.role]?.[permission]) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acciÃ³n",
      });
    }

    return next();
  };
}
