import { ApiError } from "../../shared/errors/api-error.js";
import { StudentsRepository } from "./students.repository.js";
import type { CreateStudentInput, UpdateStudentInput } from "./students.schema.js";

function getCurrentISODay(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d; // JS: 0=Sun → ISO: 7=Sun; 1=Mon…6=Sat unchanged
}

function getCurrentTimeHHMMSS(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
}

export class StudentsService {
  constructor(private readonly repository = new StudentsRepository()) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const student = await this.repository.findById(id);
    if (!student) throw new ApiError(404, "Alumno no encontrado");
    return student;
  }

  async create(input: CreateStudentInput) {
    const duplicate = await this.repository.findByControlNumber(input.control_number);
    if (duplicate) {
      throw new ApiError(
        409,
        `Ya existe un alumno con el número de control '${input.control_number}'`
      );
    }
    const id = await this.repository.create({
      control_number: input.control_number,
      full_name: input.full_name,
      email: input.email ?? null,
      program: input.program,
      semester: input.semester,
      is_active: input.is_active ?? true,
    });
    return this.getById(id);
  }

  async update(id: string, input: UpdateStudentInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new ApiError(404, "Alumno no encontrado");

    if (input.control_number && input.control_number !== current.control_number) {
      const duplicate = await this.repository.findByControlNumberExcluding(
        input.control_number,
        id
      );
      if (duplicate) {
        throw new ApiError(
          409,
          `Ya existe un alumno con el número de control '${input.control_number}'`
        );
      }
    }

    await this.repository.update(id, {
      control_number: input.control_number ?? current.control_number,
      full_name: input.full_name ?? current.full_name,
      email: input.email !== undefined ? input.email : (current.email ?? null),
      program: input.program ?? current.program,
      semester: input.semester ?? current.semester,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });
    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const student = await this.repository.findById(id);
    if (!student) throw new ApiError(404, "Alumno no encontrado");
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    const student = await this.repository.findById(id);
    if (!student) throw new ApiError(404, "Alumno no encontrado");
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }

  async getSchedules(controlNumber: string, period?: string) {
    const student = await this.repository.findByControlNumber(controlNumber);
    if (!student || !student.is_active) throw new ApiError(404, "Alumno no encontrado");

    const rows = await this.repository.findAllSchedulesByControlNumber(controlNumber, period);
    return rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      professor_id: r.professor_id,
      professor_name: r.professor_name ?? "",
      classroom_id: r.classroom_id,
      classroom_code: r.classroom_code,
      classroom_name: r.classroom_name,
      building_id: r.building_id,
      building_code: r.building_code,
      building_name: r.building_name,
      day_of_week: r.day_of_week,
      start_time: r.start_time,
      end_time: r.end_time,
      period: r.period,
    }));
  }

  async getLocation(controlNumber: string, period?: string, at?: string) {
    const student = await this.repository.findByControlNumber(controlNumber);
    if (!student || !student.is_active) throw new ApiError(404, "Alumno no encontrado");

    const dayOfWeek = getCurrentISODay();
    const timeHHMMSS = at ? `${at}:00` : getCurrentTimeHHMMSS();

    const loc = await this.repository.findCurrentLocation(
      student.id,
      dayOfWeek,
      timeHHMMSS,
      period
    );

    const studentSummary = {
      id: student.id,
      control_number: student.control_number,
      full_name: student.full_name,
      program: student.program,
      semester: student.semester,
    };

    if (!loc) {
      return { student: studentSummary, in_class: false, schedule: null, classroom: null, building: null };
    }

    return {
      student: studentSummary,
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
