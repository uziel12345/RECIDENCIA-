import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function clean(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.replace(/[\r\n\t\u0000-\u001f\u007f]/g, " ").slice(0, maxLength);
}

export function createRequestLogEntry(
  req: Request,
  statusCode: number,
  durationMs: number,
  requestId: string
) {
  const routePath = typeof req.route?.path === "string" ? req.route.path : undefined;
  return {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info",
    event: "http_request",
    request_id: requestId,
    method: clean(req.method, 12),
    route: routePath ? clean(`${req.baseUrl}${routePath}`) : "unmatched",
    status_code: statusCode,
    duration_ms: Math.round(durationMs * 100) / 100,
    user_id: req.authUser?.id,
  };
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = performance.now();
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.once("finish", () => {
    console.log(JSON.stringify(createRequestLogEntry(
      req,
      res.statusCode,
      performance.now() - startedAt,
      requestId
    )));
  });

  next();
}
