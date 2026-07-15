export type Headquarters = {
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
  is_active: boolean;
};

export type CreateHeadquartersInput = {
  building_id: string;
  name: string;
  head_name?: string | null;
  department_id?: string | null;
  schedule_text?: string | null;
  contact?: string | null;
  is_active?: boolean;
};

export type UpdateHeadquartersInput = Partial<CreateHeadquartersInput>;

export type DeleteHeadquartersResult = {
  id: string;
  deleted: boolean;
};
