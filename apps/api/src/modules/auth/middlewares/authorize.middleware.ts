import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../auth.service.js";

type RolePermissions = {
  can_view_buildings: boolean;
  can_edit_buildings: boolean;
  can_view_building_images: boolean;
  can_edit_building_images: boolean;
  can_edit_navigation: boolean;
  can_manage_users: boolean;
  can_view_audit_logs: boolean;
};

export type AuthPermission = keyof RolePermissions;

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  superadmin: {
    can_view_buildings: true,
    can_edit_buildings: true,
    can_view_building_images: true,
    can_edit_building_images: true,
    can_edit_navigation: true,
    can_manage_users: true,
    can_view_audit_logs: true,
  },
  admin: {
    can_view_buildings: true,
    can_edit_buildings: true,
    can_view_building_images: true,
    can_edit_building_images: true,
    can_edit_navigation: true,
    can_manage_users: false,
    can_view_audit_logs: true,
  },
  servicios_escolares: {
    can_view_buildings: true,
    can_edit_buildings: false,
    can_view_building_images: true,
    can_edit_building_images: false,
    can_edit_navigation: false,
    can_manage_users: false,
    can_view_audit_logs: false,
  },
  recursos_humanos: {
    can_view_buildings: true,
    can_edit_buildings: false,
    can_view_building_images: true,
    can_edit_building_images: false,
    can_edit_navigation: false,
    can_manage_users: false,
    can_view_audit_logs: false,
  },
  viewer: {
    can_view_buildings: false,
    can_edit_buildings: false,
    can_view_building_images: false,
    can_edit_building_images: false,
    can_edit_navigation: false,
    can_manage_users: false,
    can_view_audit_logs: false,
  },
};

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

export function authorizePermission(permission: AuthPermission) {
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
