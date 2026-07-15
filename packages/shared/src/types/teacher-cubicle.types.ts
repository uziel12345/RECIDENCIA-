export type TeacherCubicle = {
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
  is_active: boolean;
};

export type CreateTeacherCubicleInput = {
  building_id: string;
  code: string;
  professor_id?: string | null;
  department_id?: string | null;
  schedule_text?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type UpdateTeacherCubicleInput = Partial<CreateTeacherCubicleInput>;

export type DeleteTeacherCubicleResult = {
  id: string;
  deleted: boolean;
};
