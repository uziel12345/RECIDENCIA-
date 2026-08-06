import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../errors/api-error.js";

function errorSummary(error: unknown, requestId: unknown) {
  const known = error instanceof Error ? error : new Error("Unknown error");
  const errorCode = (known as Error & { code?: unknown }).code;
  return {
    timestamp: new Date().toISOString(),
    level: "error",
    event: "unhandled_error",
    request_id: typeof requestId === "string" ? requestId : undefined,
    error_name: known.name,
    error_code: typeof errorCode === "string" ? errorCode.slice(0, 80) : undefined,
    error_message: process.env.NODE_ENV === "production"
      ? undefined
      : known.message.replace(/[\r\n\t]/g, " ").slice(0, 500),
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const bodyParserError = error as Error & {
    type?: string;
    status?: number;
  };

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
        message: "El archivo excede el tamaño máximo permitido",
        code: "FILE_TOO_LARGE",
      });
    }

    return res.status(400).json({
      success: false,
      message: `Error al subir el archivo: ${error.message}`,
      code: error.code,
    });
  }

  // express.json() reporta el cuerpo invalido como SyntaxError. Es un error
  // del cliente, no una falla interna que deba aparecer como HTTP 500.
  if (error instanceof SyntaxError && bodyParserError.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "El cuerpo JSON no es valido",
      code: "INVALID_JSON",
    });
  }

  if (bodyParserError.type === "entity.too.large" || bodyParserError.status === 413) {
    return res.status(413).json({
      success: false,
      message: "El cuerpo de la solicitud excede el tamano maximo permitido",
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  if (bodyParserError.type === "encoding.unsupported") {
    return res.status(415).json({
      success: false,
      message: "La codificacion de la solicitud no es compatible",
      code: "UNSUPPORTED_ENCODING",
    });
  }

  if (bodyParserError.type === "request.aborted") {
    return res.status(400).json({
      success: false,
      message: "La solicitud fue interrumpida antes de completarse",
      code: "REQUEST_ABORTED",
    });
  }

  console.error(JSON.stringify(errorSummary(error, res.locals.requestId)));

  const isDev = process.env.NODE_ENV !== "production";

  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    ...(isDev && error instanceof Error ? { stack: error.stack } : {}),
  });
}
