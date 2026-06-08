import { ApiError } from "../../shared/errors/api-error.js";
import { SchedulesRepository } from "./schedules.repository.js";
import type { CreateScheduleInput, UpdateScheduleInput } from "./schedules.schema.js";

export class SchedulesService {
  constructor(private readonly repository = new SchedulesRepository()) {}

  async getAll(period?: string) {
    return this.repository.findAll(period);
  }

  async getById(id: string) {
    const schedule = await this.repository.findById(id);
    if (!schedule) throw new ApiError(404, "Horario no encontrado");
    return schedule;
  }

  async getByClassroom(classroomId: string, period?: string, day?: number) {
    return this.repository.findByClassroom(classroomId, period, day);
  }

  async create(input: CreateScheduleInput) {
    const profExists = await this.repository.professorExists(input.professor_id);
    if (!profExists) throw new ApiError(404, "El profesor indicado no existe");

    const clsExists = await this.repository.classroomExists(input.classroom_id);
    if (!clsExists) throw new ApiError(404, "El aula indicada no existe");

    const id = await this.repository.create(input);
    return this.getById(id);
  }

  async update(id: string, input: UpdateScheduleInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new ApiError(404, "Horario no encontrado");

    if (input.professor_id && input.professor_id !== current.professor_id) {
      const exists = await this.repository.professorExists(input.professor_id);
      if (!exists) throw new ApiError(404, "El profesor indicado no existe");
    }

    if (input.classroom_id && input.classroom_id !== current.classroom_id) {
      const exists = await this.repository.classroomExists(input.classroom_id);
      if (!exists) throw new ApiError(404, "El aula indicada no existe");
    }

    await this.repository.update(id, {
      subject: input.subject ?? current.subject,
      professor_id: input.professor_id ?? current.professor_id,
      classroom_id: input.classroom_id ?? current.classroom_id,
      day_of_week: input.day_of_week ?? current.day_of_week,
      start_time: input.start_time ?? current.start_time,
      end_time: input.end_time ?? current.end_time,
      period: input.period ?? current.period,
    });

    return this.getById(id);
  }

  async remove(id: string) {
    const schedule = await this.repository.findById(id);
    if (!schedule) throw new ApiError(404, "Horario no encontrado");
    await this.repository.remove(id);
    return { id, deleted: true };
  }

  async linkStudent(scheduleId: string, studentId: string) {
    const schedule = await this.repository.findById(scheduleId);
    if (!schedule) throw new ApiError(404, "Horario no encontrado");

    const studentExists = await this.repository.studentExists(studentId);
    if (!studentExists) throw new ApiError(404, "Alumno no encontrado");

    await this.repository.linkStudent(scheduleId, studentId);
    return { schedule_id: scheduleId, student_id: studentId, linked: true };
  }

  async unlinkStudent(scheduleId: string, studentId: string) {
    const schedule = await this.repository.findById(scheduleId);
    if (!schedule) throw new ApiError(404, "Horario no encontrado");
    await this.repository.unlinkStudent(scheduleId, studentId);
    return { schedule_id: scheduleId, student_id: studentId, unlinked: true };
  }
}
