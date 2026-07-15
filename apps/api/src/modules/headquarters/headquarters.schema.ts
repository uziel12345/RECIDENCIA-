import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).nullable().optional();

export const createHeadquartersSchema = z.object({
  building_id: z
    .string({ required_error: "El edificio es obligatorio" })
    .uuid("El building_id debe ser un UUID válido"),
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  head_name: optionalText(255),
  department_id: z.string().uuid("El department_id debe ser un UUID válido").nullable().optional(),
  schedule_text: optionalText(255),
  contact: optionalText(255),
  is_active: z.boolean().optional(),
});

export const updateHeadquartersSchema = createHeadquartersSchema.partial();

export const headquartersIdSchema = z.object({
  id: z
    .string({ required_error: "El ID de la jefatura es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const headquartersStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateHeadquartersInput = z.infer<typeof createHeadquartersSchema>;
export type UpdateHeadquartersInput = z.infer<typeof updateHeadquartersSchema>;
