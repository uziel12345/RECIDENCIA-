import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../auth.service.js";

type RolePermissions = {
  can_view_buildings: boolean;
  can_edit_buildings: boolean;
  can_edit_photos: boolean;
  can_edit_navigation: boolean;
  can_manage_admin_users: boolean;
  can_manage_users: boolean;
  can_view_audit_logs: boolean;
  // Fase 4 — módulo académico
  can_view_student_location: boolean;
  can_view_professor_location: boolean;
  can_manage_students: boolean;
  can_manage_professors: boolean;
};

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  superadmin: {
    can_view_buildings: true, can_edit_buildings: true, can_edit_photos: true,
    can_edit_navigation: true, can_manage_admin_users: true, can_manage_users: true,
    can_view_audit_logs: true,
    can_view_student_location: true, can_view_professor_location: true,
    can_manage_students: true, can_manage_professors: true,
  },
  admin: {
    can_view_buildings: true, can_edit_buildings: true, can_edit_photos: true,
    can_edit_navigation: true, can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: true,
    can_view_student_location: true, can_view_professor_location: true,
    can_manage_students: true, can_manage_professors: true,
  },
  servicios_escolares: {
    can_view_buildings: true, can_edit_buildings: false, can_edit_photos: false,
    can_edit_navigation: false, can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: true, can_view_professor_location: false,
    can_manage_students: true, can_manage_professors: false,
  },
  recursos_humanos: {
    can_view_buildings: true, can_edit_buildings: false, can_edit_photos: false,
    can_edit_navigation: false, can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: false, can_view_professor_location: true,
    can_manage_students: false, can_manage_professors: true,
  },
  viewer: {
    can_view_buildings: false, can_edit_buildings: false, can_edit_photos: false,
    can_edit_navigation: false, can_manage_admin_users: false, can_manage_users: false,
    can_view_audit_logs: false,
    can_view_student_location: false, can_view_professor_location: false,
    can_manage_students: false, can_manage_professors: false,
  },
};

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
        message: "No tienes permisos para realizar esta acción",
      });
    }

    return next();
  };
}
