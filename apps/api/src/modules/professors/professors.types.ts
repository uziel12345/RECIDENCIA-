import type { RowDataPacket } from "mysql2";

export interface ProfessorRow extends RowDataPacket {
  id: string;
  employee_number: string;
  full_name: string;
  email: string | null;
  department: string;
  is_active: number | boolean;
  deleted_at: string | null;
}

export interface ProfessorLocationRow extends RowDataPacket {
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
