import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type ClassroomType = "aula" | "laboratorio" | "taller" | "oficina" | "otro";

export interface ClassroomRow extends RowDataPacket {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  code: string;
  name: string;
  description: string | null;
  floor: number;
  capacity: number | null;
  type: ClassroomType;
  is_active: boolean | number;
  deleted_at: string | null;
}
