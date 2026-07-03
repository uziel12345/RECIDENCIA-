export type Student = {
  id: string;
  control_number: string;
  full_name: string;
  email: string | null;
  program: string;
  semester: number;
  is_active: boolean | number;
};

export type Professor = {
  id: string;
  employee_number: string;
  rfc: string | null;
  full_name: string;
  email: string | null;
  department: string;
  is_active: boolean | number;
};

export type Schedule = {
  id: string;
  subject: string;
  professor_id: string;
  professor_name: string;
  classroom_id: string;
  classroom_code: string;
  classroom_name: string;
  building_id: string;
  building_code: string;
  building_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
};

export type ClassroomSchedule = {
  id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
};

export type LocationSchedule = {
  id: string;
  subject: string;
  subject_code?: string | null;
  subject_name?: string | null;
  group_code?: string | null;
  career_code?: string | null;
  career_name?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period: string;
};

export type LocationClassroom = {
  id: string;
  code: string;
  name: string;
  floor: number;
};

export type LocationBuilding = {
  id: string;
  code: string;
  name: string;
};

export type StudentLocation = {
  student: {
    id: string;
    control_number: string;
    full_name: string;
    program: string;
    semester: number;
  };
  in_class: boolean;
  schedule: LocationSchedule | null;
  classroom: LocationClassroom | null;
  building: LocationBuilding | null;
};

export type ProfessorLocation = {
  professor: {
    id: string;
    employee_number: string;
    rfc: string | null;
    full_name: string;
    department: string;
  };
  in_class: boolean;
  schedule: LocationSchedule | null;
  classroom: LocationClassroom | null;
  building: LocationBuilding | null;
};

export type ProfessorLocationSearch = {
  professor?: {
    id: string;
    employee_number: string;
    rfc: string | null;
    full_name: string;
    department: string;
  };
  schedules: Array<{
    schedule: LocationSchedule;
    classroom: LocationClassroom;
    building: LocationBuilding;
  }>;
  candidates: Array<{
    id: string;
    employee_number: string;
    rfc: string | null;
    full_name: string;
    department: string;
  }>;
};

export type ProfessorScheduleImportResult = {
  rows_read: number;
  professors_upserted: number;
  schedules_created: number;
  warnings: string[];
};
