import { z } from "zod";

const timeHHMMSchema = z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido");
const periodSchema = z
  .string()
  .regex(/^\d{4}-\d{1,2}$/, "El periodo debe tener formato YYYY-N (ej. 2026-1)");

export const createScheduleSchema = z
  .object({
    subject: z
      .string({ required_error: "La materia es obligatoria" })
      .min(1, "La materia no puede estar vacía")
      .max(255),
    professor_id: z
      .string({ required_error: "El profesor es obligatorio" })
      .uuid("El professor_id debe ser un UUID válido"),
    classroom_id: z
      .string({ required_error: "El aula es obligatoria" })
      .uuid("El classroom_id debe ser un UUID válido"),
    day_of_week: z
      .number({ required_error: "El día de la semana es obligatorio" })
      .int()
      .min(1, "1=Lunes")
      .max(7, "7=Domingo"),
    start_time: timeHHMMSchema,
    end_time: timeHHMMSchema,
    period: periodSchema,
  })
  .refine((d) => d.start_time < d.end_time, {
    message: "La hora de inicio debe ser anterior a la de fin",
    path: ["end_time"],
  });

export const updateScheduleSchema = z
  .object({
    subject: z.string().min(1).max(255).optional(),
    professor_id: z.string().uuid().optional(),
    classroom_id: z.string().uuid().optional(),
    day_of_week: z.number().int().min(1).max(7).optional(),
    start_time: timeHHMMSchema.optional(),
    end_time: timeHHMMSchema.optional(),
    period: periodSchema.optional(),
  })
  .refine(
    (d) => {
      if (d.start_time && d.end_time) return d.start_time < d.end_time;
      return true;
    },
    { message: "La hora de inicio debe ser anterior a la de fin", path: ["end_time"] }
  );

export const scheduleIdSchema = z.object({
  id: z.string().uuid("El ID debe ser un UUID válido"),
});

export const classroomScheduleQuerySchema = z.object({
  period: periodSchema.optional(),
  day: z.coerce.number().int().min(1).max(7).optional(),
});

export const linkStudentSchema = z.object({
  student_id: z.string().uuid("El student_id debe ser un UUID válido"),
});

export const scheduleStudentParamsSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
