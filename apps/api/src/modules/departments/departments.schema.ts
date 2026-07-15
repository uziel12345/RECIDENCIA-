import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).nullable().optional();

export const createDepartmentSchema = z.object({
  building_id: z
    .string({ required_error: "El edificio es obligatorio" })
    .uuid("El building_id debe ser un UUID válido"),
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  description: z.string().nullable().optional(),
  schedule_text: optionalText(255),
  head_name: optionalText(255),
  contact: optionalText(255),
  is_active: z.boolean().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del departamento es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const departmentStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
