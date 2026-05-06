import { z } from "zod";

export const createBuildingSchema = z.object({
  code: z
    .string({ required_error: "El código es obligatorio" })
    .min(1, "El código no puede estar vacío")
    .max(20),
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  slug: z.string().max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  model_node_name: z.string().max(255).optional().nullable(),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  z: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category_code: z.string().max(50).optional(),
});

export const updateBuildingSchema = createBuildingSchema.partial();

export const buildingIdSchema = z.object({
  id: z.string({ required_error: "El ID del edificio es obligatorio" }).uuid("El ID debe ser un UUID válido"),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
