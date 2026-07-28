import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type GateAccessType = "peatonal" | "vehicular" | "mixto";
export type GateStatus = "abierta" | "cerrada" | "solo_entrada" | "solo_salida";

export interface GateRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  access_type: GateAccessType;
  status: GateStatus;
  x: number;
  y: number;
  z: number;
  is_active: boolean | number;
  deleted_at: string | null;
}
