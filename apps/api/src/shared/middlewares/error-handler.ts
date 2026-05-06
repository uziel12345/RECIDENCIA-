import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  console.error("Error no controlado:", error);

  const isDev = process.env.NODE_ENV !== "production";

  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    ...(isDev && error instanceof Error ? { stack: error.stack } : {}),
  });
}