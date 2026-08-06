import type { Request } from "express";
import { pool } from "../../db/connection.js";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "CREATE_ADMIN_USER"
  | "UPDATE_ADMIN_USER_STATUS"
  | "RESET_ADMIN_USER_PASSWORD"
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
  | "CREATE_CALIBRATION_POINT"
  | "CREATE_CALIBRATION_PROFILE"
  | "CREATE_BUILDING_GEOFENCE"
  | "GENERATE_DEFAULT_GEOFENCES"
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
  | "DELETE_SCHEDULE"
  | "CREATE_DEPARTMENT"
  | "UPDATE_DEPARTMENT"
  | "UPDATE_DEPARTMENT_STATUS"
  | "DELETE_DEPARTMENT"
  | "CREATE_TEACHER_CUBICLE"
  | "UPDATE_TEACHER_CUBICLE"
  | "UPDATE_TEACHER_CUBICLE_STATUS"
  | "DELETE_TEACHER_CUBICLE"
  | "CREATE_HEADQUARTERS"
  | "UPDATE_HEADQUARTERS"
  | "UPDATE_HEADQUARTERS_STATUS"
  | "DELETE_HEADQUARTERS"
  | "CREATE_BUILDING_SCHEDULE"
  | "UPDATE_BUILDING_SCHEDULE"
  | "UPDATE_BUILDING_SCHEDULE_STATUS"
  | "DELETE_BUILDING_SCHEDULE"
  | "CREATE_GATE"
  | "UPDATE_GATE"
  | "UPDATE_GATE_STATUS"
  | "DELETE_GATE";

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
    .catch((error: unknown) => {
      const known = error instanceof Error ? error : new Error("Unknown audit error");
      const errorCode = (known as Error & { code?: unknown }).code;
      console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "audit_log_write_failed",
        action: opts.action,
        error_name: known.name,
        error_code: typeof errorCode === "string" ? errorCode.slice(0, 80) : undefined,
      }));
    }); // nunca bloquea ni propaga errores
}
