import { z } from "zod";

export const createGateSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  description: z.string().nullable().optional(),
  access_type: z.enum(["peatonal", "vehicular", "mixto"]).optional(),
  status: z.enum(["abierta", "cerrada", "solo_entrada", "solo_salida"]).optional(),
  x: z.number({ required_error: "La coordenada x es obligatoria" }),
  y: z.number().optional(),
  z: z.number({ required_error: "La coordenada z es obligatoria" }),
  is_active: z.boolean().optional(),
});

export const updateGateSchema = createGateSchema.partial();

export const gateIdSchema = z.object({
  id: z
    .string({ required_error: "El ID de la puerta es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const gateStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateGateInput = z.infer<typeof createGateSchema>;
export type UpdateGateInput = z.infer<typeof updateGateSchema>;
