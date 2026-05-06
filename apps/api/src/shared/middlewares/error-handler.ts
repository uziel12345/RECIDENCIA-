import type { NextFunction, Request, Response } from "express";
import multer from "multer";
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

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "El archivo excede el tamaño máximo permitido (2 MB)",
        code: "FILE_TOO_LARGE",
      });
    }

    return res.status(400).json({
      success: false,
      message: `Error al subir el archivo: ${error.message}`,
      code: error.code,
    });
  }

  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "El archivo excede el tamaño máximo permitido (2 MB)",
      code: "FILE_TOO_LARGE",
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