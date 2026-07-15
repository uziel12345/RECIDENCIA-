export type BuildingSchedule = {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
};

export type CreateBuildingScheduleInput = {
  building_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active?: boolean;
};

export type UpdateBuildingScheduleInput = Partial<CreateBuildingScheduleInput>;

export type DeleteBuildingScheduleResult = {
  id: string;
  deleted: boolean;
};
