import { ApiError } from "../../shared/errors/api-error.js";
import { ProfessorsRepository } from "./professors.repository.js";
import type { CreateProfessorInput, UpdateProfessorInput } from "./professors.schema.js";

function getCurrentISODay(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function getCurrentTimeHHMMSS(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
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

    const professorSummary = {
      id: professor.id,
      employee_number: professor.employee_number,
      full_name: professor.full_name,
      department: professor.department,
    };

    if (!loc) {
      return { professor: professorSummary, in_class: false, schedule: null, classroom: null, building: null };
    }

    return {
      professor: professorSummary,
      in_class: true,
      schedule: {
        id: loc.schedule_id,
        subject: loc.subject,
        day_of_week: loc.day_of_week,
        start_time: loc.start_time,
        end_time: loc.end_time,
        period: loc.period,
      },
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
}
