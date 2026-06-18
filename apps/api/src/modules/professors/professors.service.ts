import { ApiError } from "../../shared/errors/api-error.js";
import { ProfessorsRepository } from "./professors.repository.js";
import type { CreateProfessorInput, UpdateProfessorInput } from "./professors.schema.js";
import {
  parseProfessorScheduleWorkbook,
  parseScheduleTimeRange,
} from "./professors.import.js";
import type { ProfessorRow } from "./professors.types.js";

const IMPORT_DAYS = [
  { column: "lunes", classroomColumn: "lunes_aula", day: 1, label: "lunes" },
  { column: "martes", classroomColumn: "martes_aula", day: 2, label: "martes" },
  { column: "miercoles", classroomColumn: "miercoles_aula", day: 3, label: "miercoles" },
  { column: "jueves", classroomColumn: "jueves_aula", day: 4, label: "jueves" },
  { column: "viernes", classroomColumn: "viernes_aula", day: 5, label: "viernes" },
  { column: "sabado", classroomColumn: "sabado_aula", day: 6, label: "sabado" },
  { column: "domingo", classroomColumn: "domingo_aula", day: 7, label: "domingo" },
] as const;

function getCurrentISODay(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function getCurrentTimeHHMMSS(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
}

function normalizeRfc(value: string): string {
  return value.trim().toUpperCase();
}

function professorSummary(professor: {
  id: string;
  employee_number: string;
  rfc: string | null;
  full_name: string;
  department: string;
}) {
  return {
    id: professor.id,
    employee_number: professor.employee_number,
    rfc: professor.rfc,
    full_name: professor.full_name,
    department: professor.department,
  };
}

function scheduleSummary(loc: {
  schedule_id: string;
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
}) {
  return {
    id: loc.schedule_id,
    subject: loc.subject,
    subject_code: loc.subject_code ?? null,
    subject_name: loc.subject_name ?? null,
    group_code: loc.group_code ?? null,
    career_code: loc.career_code ?? null,
    career_name: loc.career_name ?? null,
    day_of_week: loc.day_of_week,
    start_time: loc.start_time,
    end_time: loc.end_time,
    period: loc.period,
  };
}

export class ProfessorsService {
  constructor(private readonly repository = new ProfessorsRepository()) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const professor = await this.repository.findById(id);
    if (!professor) throw new ApiError(404, "Profesor no encontrado");
    return professor;
  }

  async create(input: CreateProfessorInput) {
    const duplicate = await this.repository.findByEmployeeNumber(input.employee_number);
    if (duplicate) {
      throw new ApiError(
        409,
        `Ya existe un profesor con el número de empleado '${input.employee_number}'`
      );
    }
    const id = await this.repository.create({
      employee_number: input.employee_number,
      rfc: input.rfc ?? null,
      full_name: input.full_name,
      email: input.email ?? null,
      department: input.department,
      is_active: input.is_active ?? true,
    });
    return this.getById(id);
  }

  async update(id: string, input: UpdateProfessorInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new ApiError(404, "Profesor no encontrado");

    if (input.employee_number && input.employee_number !== current.employee_number) {
      const duplicate = await this.repository.findByEmployeeNumberExcluding(
        input.employee_number,
        id
      );
      if (duplicate) {
        throw new ApiError(
          409,
          `Ya existe un profesor con el número de empleado '${input.employee_number}'`
        );
      }
    }

    await this.repository.update(id, {
      employee_number: input.employee_number ?? current.employee_number,
      rfc: input.rfc !== undefined ? input.rfc : (current.rfc ?? null),
      full_name: input.full_name ?? current.full_name,
      email: input.email !== undefined ? input.email : (current.email ?? null),
      department: input.department ?? current.department,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });
    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const professor = await this.repository.findById(id);
    if (!professor) throw new ApiError(404, "Profesor no encontrado");
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    const professor = await this.repository.findById(id);
    if (!professor) throw new ApiError(404, "Profesor no encontrado");
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }

  async getLocation(employeeNumber: string, period?: string, at?: string) {
    const professor = await this.repository.findByEmployeeNumber(employeeNumber);
    if (!professor || !professor.is_active) throw new ApiError(404, "Profesor no encontrado");

    const dayOfWeek = getCurrentISODay();
    const timeHHMMSS = at ? `${at}:00` : getCurrentTimeHHMMSS();

    const loc = await this.repository.findCurrentLocation(
      professor.id,
      dayOfWeek,
      timeHHMMSS,
      period
    );

    const summary = professorSummary(professor);

    if (!loc) {
      return { professor: summary, in_class: false, schedule: null, classroom: null, building: null };
    }

    return {
      professor: summary,
      in_class: true,
      schedule: scheduleSummary(loc),
      classroom: {
        id: loc.classroom_id,
        code: loc.classroom_code,
        name: loc.classroom_name,
        floor: loc.classroom_floor,
      },
      building: {
        id: loc.building_id,
        code: loc.building_code,
        name: loc.building_name,
      },
    };
  }

  async importSchedules(fileBuffer: Buffer) {
    const rows = parseProfessorScheduleWorkbook(fileBuffer);
    const warnings: string[] = [];
    let professorsUpserted = 0;
    let schedulesCreated = 0;

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const rfc = normalizeRfc(row.rfc ?? "");
      const fullName = (row.docente ?? "").trim();
      const period = (row.periodo ?? "").trim();
      if (!rfc || !fullName || !period) {
        warnings.push(`Fila ${rowNumber}: RFC, docente o periodo vacio; fila omitida.`);
        continue;
      }

      const professor = await this.repository.upsertImportedProfessor({
        rfc,
        full_name: fullName,
        department: (row.carrera_nombre || row.carrera || "Sin departamento").trim(),
      });
      professorsUpserted += 1;

      for (const day of IMPORT_DAYS) {
        const range = (row[day.column] ?? "").trim();
        if (!range) continue;

        const parsedRange = parseScheduleTimeRange(range);
        if (!parsedRange) {
          warnings.push(`Fila ${rowNumber}, ${day.label}: horario invalido '${range}'.`);
          continue;
        }

        const classroomCode = (row[day.classroomColumn] ?? "").trim();
        if (!classroomCode) {
          warnings.push(`Fila ${rowNumber}, ${day.label}: aula vacia; horario omitido.`);
          continue;
        }

        const classroom = await this.repository.findClassroomByCode(classroomCode);
        if (!classroom) {
          warnings.push(`Fila ${rowNumber}, ${day.label}: aula '${classroomCode}' no existe; horario omitido.`);
          continue;
        }

        await this.repository.createImportedSchedule({
          professor_id: professor.id,
          classroom_id: classroom.id,
          subject: (row.nombre_materia || row.materia || "Sin materia").trim(),
          subject_code: (row.materia || "").trim() || null,
          subject_name: (row.nombre_materia || "").trim() || null,
          group_code: (row.grupo || "").trim() || null,
          career_code: (row.carrera || "").trim() || null,
          career_name: (row.carrera_nombre || "").trim() || null,
          day_of_week: day.day,
          start_time: parsedRange.start_time,
          end_time: parsedRange.end_time,
          period,
        });
        schedulesCreated += 1;
      }
    }

    return {
      rows_read: rows.length,
      professors_upserted: professorsUpserted,
      schedules_created: schedulesCreated,
      warnings,
    };
  }

  async searchLocation(query: string, period?: string, at?: string) {
    const trimmed = query.trim();
    if (!trimmed) throw new ApiError(400, "El parametro q es obligatorio");

    const timeHHMMSS = at ? `${at}:00` : undefined;
    const byRfc = await this.repository.findByRfc(normalizeRfc(trimmed));
    const professor = byRfc ?? null;

    if (professor) {
      if (!professor.is_active) throw new ApiError(404, "Profesor no encontrado");
      return this.buildSearchResult(professor, period, timeHHMMSS);
    }

    const matches = await this.repository.findByName(trimmed);
    if (matches.length === 0) throw new ApiError(404, "Profesor no encontrado");
    if (matches.length > 1) {
      return {
        candidates: matches.map((candidate) => professorSummary(candidate)),
        schedules: [],
      };
    }

    return this.buildSearchResult(matches[0], period, timeHHMMSS);
  }

  private async buildSearchResult(
    professor: ProfessorRow,
    period?: string,
    at?: string
  ) {
    const schedules = await this.repository.findSchedulesForProfessor(professor.id, {
      period,
      at,
    });

    return {
      professor: professorSummary(professor),
      schedules: schedules.map((schedule) => ({
        schedule: scheduleSummary(schedule),
        classroom: {
          id: schedule.classroom_id,
          code: schedule.classroom_code,
          name: schedule.classroom_name,
          floor: schedule.classroom_floor,
        },
        building: {
          id: schedule.building_id,
          code: schedule.building_code,
          name: schedule.building_name,
        },
      })),
      candidates: [],
    };
  }
}
