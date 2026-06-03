import type { NextFunction, Request, Response } from "express";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const tokenFromHeader = req.headers["x-csrf-token"];
  const tokenFromCookie = req.cookies?.csrf_token as string | undefined;

  if (
    !tokenFromCookie ||
    !tokenFromHeader ||
    tokenFromHeader !== tokenFromCookie
  ) {
    return res.status(403).json({
      success: false,
      message: "Token CSRF inválido o faltante",
    });
  }

  return next();
}
