export type Department = {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  name: string;
  description: string | null;
  schedule_text: string | null;
  head_name: string | null;
  contact: string | null;
  is_active: boolean;
};

export type CreateDepartmentInput = {
  building_id: string;
  name: string;
  description?: string | null;
  schedule_text?: string | null;
  head_name?: string | null;
  contact?: string | null;
  is_active?: boolean;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export type DeleteDepartmentResult = {
  id: string;
  deleted: boolean;
};
