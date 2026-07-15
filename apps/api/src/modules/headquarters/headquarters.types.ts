import type { RowDataPacket } from "mysql2";

export interface HeadquartersRow extends RowDataPacket {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  name: string;
  head_name: string | null;
  department_id: string | null;
  department_name: string | null;
  schedule_text: string | null;
  contact: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
}
