import type { RowDataPacket } from "mysql2";

export interface StudentRow extends RowDataPacket {
  id: string;
  control_number: string;
  full_name: string;
  email: string | null;
  program: string;
  semester: number;
  is_active: number | boolean;
  deleted_at: string | null;
}

export interface StudentLocationRow extends RowDataPacket {
  schedule_id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
  classroom_id: string;
  classroom_code: string;
  classroom_name: string;
  classroom_floor: number;
  building_id: string;
  building_code: string;
  building_name: string;
}
