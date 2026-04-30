import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../auth.service.js";

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