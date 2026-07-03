// Tipos raw que devuelve la API de Mindbox (ajustar según la documentación real)
export type MindboxRawScheduleEntry = {
  nrc?: string;
  materia?: string;
  grupo?: string;
  docente?: string;
  salon?: string;
  edificio?: string;
  dias?: string;      // ej. "LMV"
  horaInicio?: string; // ej. "08:00"
  horaFin?: string;    // ej. "09:00"
  periodo?: string;
};

export type MindboxRawStudentSchedule = {
  numeroControl?: string;
  nombre?: string;
  carrera?: string;
  semestre?: string | number;
  grupos?: MindboxRawScheduleEntry[];
};

// Tipos normalizados que expone el backend al frontend
export type ScheduleEntry = {
  nrc: string;
  subject: string;
  group: string;
  professor: string;
  room: string;
  building: string;
  days: string[];
  startTime: string;
  endTime: string;
  period: string;
};

export type StudentSchedule = {
  controlNumber: string;
  studentName: string;
  career: string;
  semester: number;
  entries: ScheduleEntry[];
};

export type MindboxConfig = {
  baseUrl: string;
  apiToken: string;
};
