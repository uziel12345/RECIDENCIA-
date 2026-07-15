import { z } from "zod";

const classroomTypeSchema = z.enum(["aula", "laboratorio", "taller", "oficina", "otro"]);

export const createClassroomSchema = z.object({
  building_id: z
    .string({ required_error: "El edificio es obligatorio" })
    .uuid("El building_id debe ser un UUID válido"),
  code: z
    .string({ required_error: "El código es obligatorio" })
    .min(1, "El código no puede estar vacío")
    .max(32),
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  description: z.string().nullable().optional(),
  floor: z.number().int("El piso debe ser un entero").min(-5).max(100).optional(),
  capacity: z
    .number()
    .int("La capacidad debe ser un entero")
    .min(1, "La capacidad debe ser al menos 1")
    .nullable()
    .optional(),
  type: classroomTypeSchema.optional(),
  is_active: z.boolean().optional(),
});

export const updateClassroomSchema = createClassroomSchema.partial();

export const classroomIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del aula es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const classroomStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
