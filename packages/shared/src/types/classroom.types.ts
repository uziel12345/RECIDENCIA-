export type ClassroomType = "aula" | "laboratorio" | "taller" | "oficina" | "otro";

export type Classroom = {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  code: string;
  name: string;
  description: string | null;
  floor: number;
  capacity: number | null;
  type: ClassroomType;
  is_active: boolean;
};

export type CreateClassroomInput = {
  building_id: string;
  code: string;
  name: string;
  description?: string | null;
  floor?: number;
  capacity?: number | null;
  type?: ClassroomType;
  is_active?: boolean;
};

export type UpdateClassroomInput = Partial<CreateClassroomInput>;

export type DeleteClassroomResult = {
  id: string;
  deleted: boolean;
};
