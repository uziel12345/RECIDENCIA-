import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export interface BuildingScheduleRow extends RowDataPacket {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean | number;
  deleted_at: string | null;
}
