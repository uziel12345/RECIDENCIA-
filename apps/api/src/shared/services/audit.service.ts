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
  | "RESET_ALL_NAVIGATION"
  | "DELETE_ORPHAN_ACCESS_NODES"
  | "ADD_BUILDING_SERVICE"
  | "DELETE_BUILDING_SERVICE"
  | "CREATE_CLASSROOM"
  | "UPDATE_CLASSROOM"
  | "UPDATE_CLASSROOM_STATUS"
  | "DELETE_CLASSROOM"
  | "CREATE_PROCEDURE"
  | "UPDATE_PROCEDURE"
  | "DELETE_PROCEDURE"
  | "LINK_PROCEDURE_BUILDING"
  | "UNLINK_PROCEDURE_BUILDING"
  | "VIEW_STUDENT_LOCATION"
  | "VIEW_PROFESSOR_LOCATION"
  | "SEARCH_PROFESSOR_LOCATION"
  | "CREATE_STUDENT"
  | "UPDATE_STUDENT"
  | "DELETE_STUDENT"
  | "CREATE_PROFESSOR"
  | "IMPORT_PROFESSOR_SCHEDULES"
  | "UPDATE_PROFESSOR"
  | "DELETE_PROFESSOR"
  | "CREATE_SCHEDULE"
  | "UPDATE_SCHEDULE"
  | "DELETE_SCHEDULE";

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
