import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).nullable().optional();

export const createTeacherCubicleSchema = z.object({
  building_id: z
    .string({ required_error: "El edificio es obligatorio" })
    .uuid("El building_id debe ser un UUID válido"),
  code: z
    .string({ required_error: "El código es obligatorio" })
    .min(1, "El código no puede estar vacío")
    .max(32),
  professor_id: z
    .string()
    .uuid("El professor_id debe ser un UUID válido")
    .nullable()
    .optional(),
  department_id: z
    .string()
    .uuid("El department_id debe ser un UUID válido")
    .nullable()
    .optional(),
  schedule_text: optionalText(255),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const updateTeacherCubicleSchema = createTeacherCubicleSchema.partial();

export const teacherCubicleIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del cubículo es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const teacherCubicleStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateTeacherCubicleInput = z.infer<typeof createTeacherCubicleSchema>;
export type UpdateTeacherCubicleInput = z.infer<typeof updateTeacherCubicleSchema>;
