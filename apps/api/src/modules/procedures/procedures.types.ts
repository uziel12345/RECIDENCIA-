import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type ProcedureKind = "tramite" | "servicio";

export type ProcedureRequirementType = "requisito" | "documento";

export interface ProcedureRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource_url: string | null;
  kind: ProcedureKind;
  department_id: string | null;
  department_name: string | null;
  internal_location: string | null;
  schedule_text: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
}

export interface ProcedureForAdminRow extends ProcedureRow {
  building_count: number;
}

export interface ProcedureRequirementRow extends RowDataPacket {
  id: string;
  procedure_id: string;
  description: string;
  type: ProcedureRequirementType;
  is_mandatory: boolean | number;
  display_order: number;
}

export interface BuildingForProcedureRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  notes: string | null;
}

export interface ProcedureForBuildingRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource_url: string | null;
  kind: ProcedureKind;
  department_id: string | null;
  department_name: string | null;
  internal_location: string | null;
  schedule_text: string | null;
  is_active: boolean | number;
  notes: string | null;
}
