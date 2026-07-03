import type {
  MindboxRawScheduleEntry,
  MindboxRawStudentSchedule,
  ScheduleEntry,
  StudentSchedule,
} from "./mindbox.types.js";

// Convierte la cadena de días abreviados a un array normalizado
// ej. "LMV" → ["Lun","Mié","Vie"] — ajustar al formato real de Mindbox
const DAY_MAP: Record<string, string> = {
  L: "Lun",
  M: "Mar",
  I: "Mié",
  J: "Jue",
  V: "Vie",
  S: "Sáb",
  D: "Dom",
};

function parseDays(diasStr: string | undefined): string[] {
  if (!diasStr) return [];
  return diasStr
    .toUpperCase()
    .split("")
    .map((c) => DAY_MAP[c] ?? c)
    .filter(Boolean);
}

function adaptEntry(raw: MindboxRawScheduleEntry): ScheduleEntry {
  return {
    nrc: raw.nrc ?? "",
    subject: raw.materia ?? "",
    group: raw.grupo ?? "",
    professor: raw.docente ?? "",
    room: raw.salon ?? "",
    building: raw.edificio ?? "",
    days: parseDays(raw.dias),
    startTime: raw.horaInicio ?? "",
    endTime: raw.horaFin ?? "",
    period: raw.periodo ?? "",
  };
}

export function adaptStudentSchedule(raw: MindboxRawStudentSchedule): StudentSchedule {
  return {
    controlNumber: raw.numeroControl ?? "",
    studentName: raw.nombre ?? "",
    career: raw.carrera ?? "",
    semester: typeof raw.semestre === "number" ? raw.semestre : parseInt(String(raw.semestre ?? "0"), 10),
    entries: (raw.grupos ?? []).map(adaptEntry),
  };
}
