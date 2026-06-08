import type { RowDataPacket } from "mysql2";

export interface ScheduleRow extends RowDataPacket {
  id: string;
  subject: string;
  professor_id: string;
  professor_name: string;
  classroom_id: string;
  classroom_code: string;
  classroom_name: string;
  building_id: string;
  building_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
}

export interface ClassroomScheduleRow extends RowDataPacket {
  id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
}
