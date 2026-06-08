import type { RowDataPacket } from "mysql2";

export type ProcedureKind = "tramite" | "servicio";

export interface ProcedureRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: ProcedureKind;
  is_active: boolean | number;
  deleted_at: string | null;
}

export interface ProcedureRequirementRow extends RowDataPacket {
  id: string;
  procedure_id: string;
  description: string;
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
  kind: ProcedureKind;
  is_active: boolean | number;
  notes: string | null;
}
