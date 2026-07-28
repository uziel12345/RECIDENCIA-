import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export interface ProfessorRow extends RowDataPacket {
  id: string;
  employee_number: string;
  rfc: string | null;
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

export interface ProfessorScheduleSearchRow extends RowDataPacket {
  schedule_id: string;
  subject: string;
  subject_code: string | null;
  subject_name: string | null;
  group_code: string | null;
  career_code: string | null;
  career_name: string | null;
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
