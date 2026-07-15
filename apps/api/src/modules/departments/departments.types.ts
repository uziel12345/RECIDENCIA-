import type { RowDataPacket } from "mysql2";

export interface DepartmentRow extends RowDataPacket {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  name: string;
  description: string | null;
  schedule_text: string | null;
  head_name: string | null;
  contact: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
}
