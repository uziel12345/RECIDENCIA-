import type { Request } from "express";
import { pool } from "../../db/connection.js";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "CREATE_BUILDING"
  | "UPDATE_BUILDING"
  | "UPDATE_BUILDING_STATUS"
  | "DELETE_BUILDING"
  | "UPLOAD_BUILDING_IMAGE"
  | "UPDATE_BUILDING_IMAGE_STATUS"
  | "DELETE_BUILDING_IMAGE"
  | "CREATE_NAV_NODE"
  | "DELETE_NAV_NODE"
  | "CREATE_NAV_EDGE"
  | "DELETE_NAV_EDGE"
  | "CREATE_BUILDING_ENTRANCE"
  | "RESET_ALL_NAVIGATION";

type AuditOptions = {
  req: Request;
  action: AuditAction;
  userId?: string | null;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
};

export function auditLog(opts: AuditOptions): void {
  const ip = opts.req.ip ?? null;
  const details = opts.details ? JSON.stringify(opts.details) : null;

  pool
    .query(
      `INSERT INTO audit_logs
         (admin_user_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        opts.userId ?? null,
        opts.action,
        opts.resourceType ?? null,
        opts.resourceId ?? null,
        details,
        ip,
      ]
    )
    .catch(() => undefined); // nunca bloquea ni propaga errores
}
