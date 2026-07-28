import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export interface TeacherCubicleRow extends RowDataPacket {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  code: string;
  professor_id: string | null;
  professor_name: string | null;
  department_id: string | null;
  department_name: string | null;
  schedule_text: string | null;
  notes: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
}
